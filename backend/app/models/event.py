from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Event(Base):
    """Mirrors news_pipeline.events. article_count/source_count are written by
    the Data-Pipeline loader; summary/topic are on-demand (this API's job, see
    Data-Pipeline README) rather than set by the batch pipeline."""

    __tablename__ = "events"

    event_id: Mapped[str] = mapped_column(Uuid, primary_key=True)

    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    topic: Mapped[str | None] = mapped_column(String, nullable=True)

    article_count: Mapped[int] = mapped_column(Integer, nullable=False)
    source_count: Mapped[int] = mapped_column(Integer, nullable=False)

    window_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    window_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("idx_events_topic", "topic"),
        Index("idx_events_window", "window_start", "window_end"),
    )
