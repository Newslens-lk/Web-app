from datetime import datetime

from pydantic import BaseModel


class SourceInfo(BaseModel):
    source_name: str
    source_type: str
    article_count: int
    latest_article_at: datetime | None


class SourceList(BaseModel):
    sources: list[SourceInfo]
