"""Aggregate article predictions for research; never assign labels to publishers."""

from datetime import date, datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.article import Article
from app.schemas.analytics import AnalyticsOverview, BiasCategory, BiasCount, PublisherAnalytics
from app.schemas.event import BIAS_LABELS

COLOMBO = timezone(timedelta(hours=5, minutes=30))
CATEGORIES = (*BIAS_LABELS, "unclassified")


router = APIRouter(prefix="/analytics", tags=["analytics"])


def distribution(counts: dict[str, int]) -> list[BiasCount]:
    total = sum(counts.values())
    return [
        BiasCount(
            label=label, count=counts.get(label, 0),
            percentage=round(counts.get(label, 0) * 100 / total, 2) if total else 0,
        )
        for label in CATEGORIES
    ]


@router.get("/overview", response_model=AnalyticsOverview)
def overview(
    response: Response,
    date_from: date | None = None,
    date_to: date | None = None,
    source: list[str] | None = Query(default=None, max_length=50),
    bias_label: BiasCategory | None = None,
    db: Session = Depends(get_db),
) -> AnalyticsOverview:
    response.headers["Cache-Control"] = "no-store"
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=422, detail="Start date must not be after end date")
    sources = sorted({name.strip() for name in source or [] if name.strip()})
    normalized = func.lower(func.trim(Article.bias_label))
    label = case((normalized.in_(BIAS_LABELS), normalized), else_="unclassified")
    conditions = []
    if sources:
        conditions.append(Article.source_name.in_(sources))
    if bias_label:
        conditions.append(label == bias_label)

    # Count before date filtering so readers know what cannot be placed in time.
    undated = db.scalar(
        select(func.count()).select_from(Article)
        .where(*conditions, Article.published_at.is_(None))
    ) or 0
    if date_from:
        conditions.append(Article.published_at >= datetime.combine(date_from, time.min, COLOMBO))
    if date_to:
        conditions.append(Article.published_at <= datetime.combine(date_to, time.max, COLOMBO))
    totals = db.execute(
        select(
            func.count(Article.article_id),
            func.count(func.distinct(Article.event_id)),
            func.count(func.distinct(Article.source_name)),
        ).where(*conditions)
    ).one()
    rows = db.execute(
        select(Article.source_name, label, func.count())
        .where(*conditions).group_by(Article.source_name, label)
    ).all()
    overall = dict.fromkeys(CATEGORIES, 0)
    publishers: dict[str, dict[str, int]] = {}
    for name, category, count in rows:
        overall[category] += count
        publishers.setdefault(name, dict.fromkeys(CATEGORIES, 0))[category] += count
    date_filtered = date_from is not None or date_to is not None
    return AnalyticsOverview(
        date_from=date_from, date_to=date_to, sources=sources, bias_label=bias_label,
        total_articles=totals[0], total_events=totals[1], total_sources=totals[2],
        missing_publication_dates=0 if date_filtered else undated,
        undated_excluded=undated if date_filtered else 0,
        bias_distribution=distribution(overall),
        publishers=[
            PublisherAnalytics(
                source_name=name, article_count=sum(counts.values()),
                bias_distribution=distribution(counts),
            )
            for name, counts in sorted(
                publishers.items(), key=lambda item: (-sum(item[1].values()), item[0])
            )
        ],
    )
