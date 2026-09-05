from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.article import Article
from app.schemas.article import ArticleOut

router = APIRouter(prefix="/articles", tags=["articles"])


@router.get("", response_model=list[ArticleOut])
def list_articles(
    source_name: str | None = None,
    q: str | None = Query(default=None, description="Keyword search over title and body"),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[Article]:
    stmt = select(Article).order_by(Article.published_at.desc())
    if source_name is not None:
        stmt = stmt.where(Article.source_name == source_name)
    if q is not None:
        stmt = stmt.where(Article.title.ilike(f"%{q}%") | Article.body.ilike(f"%{q}%"))
    stmt = stmt.limit(limit).offset(offset)
    return list(db.scalars(stmt))


@router.get("/{article_id}", response_model=ArticleOut)
def get_article(article_id: str, db: Session = Depends(get_db)) -> Article:
    article = db.get(Article, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")
    return article
