from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

from app.core.article_images import usable_image_url


class ImageResponse(BaseModel):
    image_url: str | None = None

    @field_validator("image_url")
    @classmethod
    def filter_image(cls, value: str | None) -> str | None:
        return usable_image_url(value)


class ArticleSummary(ImageResponse):
    model_config = ConfigDict(from_attributes=True)

    article_id: str
    source_name: str
    url: str
    title: str
    image_url: str | None = None
    body_excerpt: str | None
    published_at: datetime | None
    bias_label: str | None
    bias_confidence: float | None
    event_id: UUID | None


class ArticleDetail(ImageResponse):
    model_config = ConfigDict(from_attributes=True)

    article_id: str
    source_name: str
    url: str
    title: str
    image_url: str | None = None
    body: str
    language: str
    published_at: datetime | None
    scraped_at: datetime | None
    bias_label: str | None
    bias_confidence: float | None
    bias_scores: dict | None
    event_id: UUID | None


class ArticleInEvent(ImageResponse):
    model_config = ConfigDict(from_attributes=True)

    article_id: str
    source_name: str
    url: str
    title: str
    image_url: str | None = None
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
