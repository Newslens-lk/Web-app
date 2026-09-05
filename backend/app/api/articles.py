from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.article import Article
from app.schemas.article import (
    ArticleDetail,
    ArticleList,
    ArticleSummary,
    SimilarArticle,
    SimilarArticleList,
)

router = APIRouter(prefix="/articles", tags=["articles"])


@router.get("", response_model=ArticleList)
def list_articles(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    source: str | None = None,
    bias_label: str | None = None,
    event_id: UUID | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
) -> ArticleList:
    stmt = select(Article)

    if source:
        stmt = stmt.where(Article.source_name == source)
    if bias_label:
        stmt = stmt.where(Article.bias_label == bias_label)
    if event_id:
        stmt = stmt.where(Article.event_id == str(event_id))
    if date_from:
        stmt = stmt.where(Article.published_at >= date_from)
    if date_to:
        stmt = stmt.where(Article.published_at <= date_to)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(Article.title.ilike(pattern) | Article.body.ilike(pattern))

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))

    stmt = stmt.order_by(Article.published_at.desc().nullslast())
    stmt = stmt.limit(page_size).offset((page - 1) * page_size)

    articles = list(db.scalars(stmt))
    return ArticleList(
        articles=[ArticleSummary.model_validate(a) for a in articles],
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@router.get("/{article_id}", response_model=ArticleDetail)
def get_article(article_id: str, db: Session = Depends(get_db)) -> ArticleDetail:
    article = db.get(Article, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")
    return ArticleDetail.model_validate(article)


@router.get("/{article_id}/similar", response_model=SimilarArticleList)
def get_similar_articles(
    article_id: str,
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
) -> SimilarArticleList:
    article = db.get(Article, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")
    if article.embedding is None:
        return SimilarArticleList(similar_articles=[])

    rows = db.execute(
        text("""
            SELECT article_id, title, source_name, published_at, bias_label,
                   embedding <-> (SELECT embedding FROM articles WHERE article_id = :aid) AS distance
            FROM articles
            WHERE article_id != :aid AND embedding IS NOT NULL
            ORDER BY distance
            LIMIT :lim
        """),
        {"aid": article_id, "lim": limit},
    ).all()

    return SimilarArticleList(
        similar_articles=[
            SimilarArticle(
                article_id=r.article_id,
                title=r.title,
                source_name=r.source_name,
                published_at=r.published_at,
                bias_label=r.bias_label,
                distance=round(r.distance, 4),
            )
            for r in rows
        ]
    )
