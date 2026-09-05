from datetime import datetime

from sqlalchemy import ARRAY, Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Annotation(Base):
    __tablename__ = "annotations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    article_id: Mapped[str] = mapped_column(
        String, ForeignKey("articles.article_id", ondelete="CASCADE"), index=True
    )
    annotator_id: Mapped[str] = mapped_column(String(100))

    dimension_a_label: Mapped[str] = mapped_column(String(50))
    dimension_b_labels: Mapped[list[str]] = mapped_column(ARRAY(String))

    is_adjudicated: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
