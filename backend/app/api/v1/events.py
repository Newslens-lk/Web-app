from collections.abc import Iterable
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.article import Article
from app.models.event import Event
from app.schemas.event import (
    BIAS_LABELS,
    BiasDistribution,
    EventDetail,
    EventSummary,
    SourceBiasComparison,
)

router = APIRouter(prefix="/events", tags=["events"])

_KNOWN_BIAS_LABELS = frozenset(label for label in BIAS_LABELS if label != "unknown")


def _normalize_bias_label(label: str | None) -> str:
    """Map null, missing or unrecognized labels to "unknown"."""
    if not label:
        return "unknown"
    normalized = label.strip().lower()
    return normalized if normalized in _KNOWN_BIAS_LABELS else "unknown"


def _empty_distribution() -> dict[str, int]:
    return {label: 0 for label in BIAS_LABELS}


def build_bias_comparison(
    articles: Iterable[Article],
) -> tuple[BiasDistribution, list[SourceBiasComparison]]:
    """Compute the cluster-wide bias overview and per-source comparison from a
    set of articles. Confidence averages ignore null values and are None when a
    source has no usable confidence figures."""
    overview = _empty_distribution()
    by_source: dict[str, dict] = {}

    for article in articles:
        label = _normalize_bias_label(article.bias_label)
        overview[label] += 1

        bucket = by_source.setdefault(
            article.source_name,
            {"distribution": _empty_distribution(), "confidences": []},
        )
        bucket["distribution"][label] += 1
        if article.bias_confidence is not None:
            bucket["confidences"].append(article.bias_confidence)

    comparison = [
        SourceBiasComparison(
            source_name=source_name,
            article_count=sum(data["distribution"].values()),
            bias_distribution=BiasDistribution(**data["distribution"]),
            average_bias_confidence=(
                round(sum(data["confidences"]) / len(data["confidences"]), 4)
                if data["confidences"]
                else None
            ),
        )
        for source_name, data in sorted(by_source.items())
    ]
    return BiasDistribution(**overview), comparison


@router.get("", response_model=list[EventSummary])
def list_events(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[Event]:
    stmt = select(Event).order_by(Event.window_start.desc())
    if date_from is not None:
        stmt = stmt.where(Event.window_start >= date_from)
    if date_to is not None:
        stmt = stmt.where(Event.window_end <= date_to)
    stmt = stmt.limit(limit).offset(offset)
    return list(db.scalars(stmt))


@router.get("/{event_id}", response_model=EventDetail)
def get_event(event_id: UUID, db: Session = Depends(get_db)) -> EventDetail:
    event = db.get(Event, str(event_id))
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    articles = list(
        db.scalars(
            select(Article)
            .where(Article.event_id == str(event_id))
            .order_by(Article.published_at)
        )
    )
    bias_overview, source_bias_comparison = build_bias_comparison(articles)
    return EventDetail(
        **EventSummary.model_validate(event).model_dump(),
        bias_overview=bias_overview,
        source_bias_comparison=source_bias_comparison,
        articles=articles,
    )
