import httpx
from fastapi import APIRouter, Depends
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.article import Article
from app.models.event import Event
from app.models.source import Source
from app.schemas.stats import Stats

router = APIRouter(prefix="/stats", tags=["stats"])
settings = get_settings()


def _get_last_pipeline_run() -> str | None:
    try:
        resp = httpx.get(
            f"{settings.airflow_base_url}/api/v2/dags/news_event_pipeline/dagRuns",
            params={"order_by": "-start_date", "limit": 1},
            auth=(settings.airflow_user, settings.airflow_password),
            timeout=5.0,
        )
        if resp.is_success:
            runs = resp.json().get("dag_runs", [])
            if runs:
                return runs[0].get("start_date")
    except httpx.HTTPError:
        pass
    return None


@router.get("", response_model=Stats)
def get_stats(db: Session = Depends(get_db)) -> Stats:
    total_articles = db.scalar(select(func.count()).select_from(Article)) or 0
    total_events = db.scalar(select(func.count()).select_from(Event)) or 0
    total_sources = db.scalar(select(func.count()).select_from(Source)) or 0

    articles_today = db.scalar(
        select(func.count()).select_from(Article).where(Article.scraped_at >= text("CURRENT_DATE"))
    ) or 0
    events_today = db.scalar(
        select(func.count()).select_from(Event).where(Event.created_at >= text("CURRENT_DATE"))
    ) or 0

    bias_rows = db.execute(
        select(Article.bias_label, func.count())
        .where(Article.bias_label.isnot(None))
        .group_by(Article.bias_label)
    ).all()
    bias_breakdown = {r[0]: r[1] for r in bias_rows}

    source_rows = db.execute(
        select(Article.source_name, func.count()).group_by(Article.source_name)
    ).all()
    articles_per_source = {r[0]: r[1] for r in source_rows}

    return Stats(
        total_articles=total_articles,
        total_events=total_events,
        total_sources=total_sources,
        articles_today=articles_today,
        events_today=events_today,
        bias_breakdown=bias_breakdown,
        articles_per_source=articles_per_source,
        last_pipeline_run=_get_last_pipeline_run(),
    )
