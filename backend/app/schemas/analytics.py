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


class LabelConfidence(BaseModel):
    label: str
    total: int
    scored: int
    mean: float | None
    low_count: int
    histogram: list[int]  # ten equal-width bins over confidence 0.0 to 1.0


class TimelineWeek(BaseModel):
    week_start: date
    total: int
    counts: dict[str, int]


class LanguageCount(BaseModel):
    language: str
    count: int


class PublisherFreshness(BaseModel):
    source_name: str
    article_count: int
    dated_articles: int
    first_published: date | None
    latest_published: date | None


class AnalyticsInsights(BaseModel):
    date_from: date | None
    date_to: date | None
    timezone: str = "Asia/Colombo"
    total_articles: int
    missing_confidence: int
    low_confidence_threshold: float
    confidence: list[LabelConfidence]
    timeline: list[TimelineWeek]
    languages: list[LanguageCount]
    publishers: list[PublisherFreshness]


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


class StoryDot(BaseModel):
    source_name: str
    lean: float  # -2 far left ... 0 center ... +2 far right, averaged over that publisher's articles
    articles: int


class DividedStory(BaseModel):
    event_id: str
    headline: str
    spread: float
    dots: list[StoryDot]


class PublisherPair(BaseModel):
    source_a: str
    source_b: str
    shared_events: int
    differing_events: int  # stories where the two land at least one category apart
    mean_gap: float


class AnalyticsStories(BaseModel):
    date_from: date | None
    date_to: date | None
    shared_events: int
    unanimous_events: int
    min_pair_events: int
    stories: list[DividedStory]
    pairs: list[PublisherPair]
