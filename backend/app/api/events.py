from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.article import Article
from app.models.event import Event
from app.schemas.article import ArticleInEvent
from app.schemas.event import BiasDistribution, EventDetail, EventList, EventSummary, BIAS_LABELS

router = APIRouter(prefix="/events", tags=["events"])

_KNOWN_LABELS = frozenset(BIAS_LABELS)


def _build_bias_distribution(articles: list[Article]) -> BiasDistribution:
    counts: dict[str, int] = {label: 0 for label in BIAS_LABELS}
    for a in articles:
        label = (a.bias_label or "").strip().lower()
        if label in _KNOWN_LABELS:
            counts[label] += 1
    return BiasDistribution(**counts)


@router.get("", response_model=EventList)
def list_events(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    topic: str | None = None,
    source: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    min_sources: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
) -> EventList:
    stmt = select(Event)

    if topic:
        stmt = stmt.where(Event.topic == topic)
    if date_from:
        stmt = stmt.where(Event.window_start >= date_from)
    if date_to:
        stmt = stmt.where(Event.window_end <= date_to)
    if min_sources:
        stmt = stmt.where(Event.source_count >= min_sources)
    if source:
        stmt = stmt.where(
            Event.event_id.in_(
                select(Article.event_id).where(Article.source_name == source).distinct()
            )
        )

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))

    stmt = stmt.order_by(Event.window_end.desc().nullslast())
    stmt = stmt.limit(page_size).offset((page - 1) * page_size)
    events = list(db.scalars(stmt))

    summaries = []
    for event in events:
        rows = db.execute(
            select(Article.title, Article.source_name)
            .where(Article.event_id == event.event_id)
            .order_by(Article.published_at.desc().nullslast())
        ).all()

        rep_title = event.summary or (rows[0][0] if rows else "Untitled event")
        sources_list = sorted({r[1] for r in rows})

        summaries.append(
            EventSummary(
                event_id=event.event_id,
                summary=event.summary,
                topic=event.topic,
                article_count=event.article_count,
                source_count=event.source_count,
                window_start=event.window_start,
                window_end=event.window_end,
                created_at=event.created_at,
                representative_title=rep_title,
                sources=sources_list,
            )
        )

    return EventList(events=summaries, total=total or 0, page=page, page_size=page_size)


@router.get("/{event_id}", response_model=EventDetail)
def get_event(event_id: UUID, db: Session = Depends(get_db)) -> EventDetail:
    event = db.get(Event, str(event_id))
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    articles = list(
        db.scalars(
            select(Article)
            .where(Article.event_id == str(event_id))
            .order_by(Article.published_at.desc().nullslast())
        )
    )

    return EventDetail(
        event_id=event.event_id,
        summary=event.summary,
        topic=event.topic,
        article_count=event.article_count,
        source_count=event.source_count,
        window_start=event.window_start,
        window_end=event.window_end,
        articles=[ArticleInEvent.model_validate(a) for a in articles],
        bias_distribution=_build_bias_distribution(articles),
    )
