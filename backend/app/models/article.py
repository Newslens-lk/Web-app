from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, Float, ForeignKey, Index, String, Text, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

EMBEDDING_DIMENSION = 1024


class Article(Base):
    """Mirrors news_pipeline.articles as written by the Data-Pipeline loader
    (Newslens-lk/Data-Pipeline, include/db/models.py). This backend reads/updates
    this table but does not own its migration in shared deployments."""

    __tablename__ = "articles"

    article_id: Mapped[str] = mapped_column(String, primary_key=True)

    source_name: Mapped[str] = mapped_column(
        String, ForeignKey("sources.source_name"), nullable=False
    )

    url: Mapped[str] = mapped_column(Text, unique=True, nullable=False)

    title: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String, nullable=False)

    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    scraped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    bias_label: Mapped[str | None] = mapped_column(String, nullable=True)
    bias_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    bias_scores: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    embedding = mapped_column(Vector(EMBEDDING_DIMENSION), nullable=True)

    event_id: Mapped[str | None] = mapped_column(
        Uuid,
        ForeignKey("events.event_id", deferrable=True, initially="DEFERRED"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("idx_articles_event_id", "event_id"),
        Index("idx_articles_published_at", "published_at"),
        Index("idx_articles_source", "source_name"),
        Index(
            "idx_articles_embedding",
            "embedding",
            postgresql_using="ivfflat",
            postgresql_with={"lists": 100},
            postgresql_ops={"embedding": "vector_l2_ops"},
        ),
    )
