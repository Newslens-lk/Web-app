from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ArticleSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    article_id: str
    source_name: str
    url: str
    title: str
    published_at: datetime | None
    bias_label: str | None
    bias_confidence: float | None
    event_id: UUID | None


class ArticleDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    article_id: str
    source_name: str
    url: str
    title: str
    body: str
    language: str
    published_at: datetime | None
    scraped_at: datetime | None
    bias_label: str | None
    bias_confidence: float | None
    bias_scores: dict | None
    event_id: UUID | None


class ArticleInEvent(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    article_id: str
    source_name: str
    url: str
    title: str
    body: str
    published_at: datetime | None
    bias_label: str | None
    bias_confidence: float | None
    bias_scores: dict | None


class ArticleList(BaseModel):
    articles: list[ArticleSummary]
    total: int
    page: int
    page_size: int


class SimilarArticle(BaseModel):
    article_id: str
    title: str
    source_name: str
    published_at: datetime | None
    bias_label: str | None
    distance: float


class SimilarArticleList(BaseModel):
    similar_articles: list[SimilarArticle]
