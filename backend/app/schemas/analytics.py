from datetime import date
from typing import Literal

from pydantic import BaseModel

BiasCategory = Literal["far_left", "left", "center", "right", "far_right"]


class BiasCount(BaseModel):
    label: str
    count: int
    percentage: float


class PublisherAnalytics(BaseModel):
    source_name: str
    article_count: int
    bias_distribution: list[BiasCount]


class AnalyticsOverview(BaseModel):
    date_from: date | None
    date_to: date | None
    timezone: str = "Asia/Colombo"
    sources: list[str]
    bias_label: BiasCategory | None
    total_articles: int
    total_events: int
    total_sources: int
    missing_publication_dates: int
    undated_excluded: int
    bias_distribution: list[BiasCount]
    publishers: list[PublisherAnalytics]
