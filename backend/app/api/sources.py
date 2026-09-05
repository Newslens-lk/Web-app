from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.article import Article
from app.models.source import Source
from app.schemas.source import SourceInfo, SourceList

router = APIRouter(prefix="/sources", tags=["sources"])


@router.get("", response_model=SourceList)
def list_sources(db: Session = Depends(get_db)) -> SourceList:
    rows = db.execute(
        select(
            Source.source_name,
            Source.source_type,
            func.count(Article.article_id).label("article_count"),
            func.max(Article.published_at).label("latest_article_at"),
        )
        .outerjoin(Article, Source.source_name == Article.source_name)
        .group_by(Source.source_name, Source.source_type)
        .order_by(Source.source_name)
    ).all()

    return SourceList(
        sources=[
            SourceInfo(
                source_name=r.source_name,
                source_type=r.source_type,
                article_count=r.article_count,
                latest_article_at=r.latest_article_at,
            )
            for r in rows
        ]
    )
