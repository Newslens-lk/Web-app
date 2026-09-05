from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.article import ArticleOut

# Recognized bias labels; anything else (including null/missing) is "unknown".
BIAS_LABELS: tuple[str, ...] = ("left", "neutral", "right", "unknown")


class BiasDistribution(BaseModel):
    """Article counts per bias label. All four keys are always present."""

    left: int = 0
    neutral: int = 0
    right: int = 0
    unknown: int = 0


class SourceBiasComparison(BaseModel):
    source_name: str
    article_count: int
    bias_distribution: BiasDistribution
    average_bias_confidence: float | None


class EventSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: UUID
    summary: str | None
    topic: str | None
    article_count: int
    source_count: int
    window_start: datetime | None
    window_end: datetime | None


class EventDetail(EventSummary):
    bias_overview: BiasDistribution = BiasDistribution()
    source_bias_comparison: list[SourceBiasComparison] = []
    articles: list[ArticleOut] = []
