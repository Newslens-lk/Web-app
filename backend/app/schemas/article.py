from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ArticleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    article_id: str
    title: str
    source_name: str
    url: str
    language: str
    published_at: datetime | None
    bias_label: str | None
    bias_confidence: float | None
