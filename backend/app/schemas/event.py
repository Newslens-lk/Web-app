from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.article import ArticleInEvent

BIAS_LABELS = ("far_left", "left", "center", "right", "far_right")


class BiasDistribution(BaseModel):
    far_left: int = 0
    left: int = 0
    center: int = 0
    right: int = 0
    far_right: int = 0


class EventSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: UUID
    summary: str | None
    topic: str | None
    article_count: int
    source_count: int
    window_start: datetime | None
    window_end: datetime | None
    created_at: datetime
    representative_title: str
    sources: list[str]


class EventList(BaseModel):
    events: list[EventSummary]
    total: int
    page: int
    page_size: int


class EventDetail(BaseModel):
    event_id: UUID
    summary: str | None
    topic: str | None
    article_count: int
    source_count: int
    window_start: datetime | None
    window_end: datetime | None
    articles: list[ArticleInEvent]
    bias_distribution: BiasDistribution
