from pydantic import BaseModel


class Stats(BaseModel):
    total_articles: int
    total_events: int
    total_sources: int
    articles_today: int
    events_today: int
    bias_breakdown: dict[str, int]
    articles_per_source: dict[str, int]
    last_pipeline_run: str | None
