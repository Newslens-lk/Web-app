from sqlalchemy import JSON, Boolean, Float, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class OutletStats(Base):
    __tablename__ = "outlet_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[str] = mapped_column(
        Uuid, ForeignKey("events.event_id", ondelete="CASCADE"), index=True
    )
    source_name: Mapped[str] = mapped_column(String(255), index=True)

    covered: Mapped[bool] = mapped_column(Boolean)
    reporting_latency_minutes: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Distinctive lexical terms and entity-emphasis counts for this
    # outlet's coverage of the event (REQ-1.6.3 / REQ-1.6.4).
    lexical_stats: Mapped[dict] = mapped_column(JSON, default=dict)
    entity_stats: Mapped[dict] = mapped_column(JSON, default=dict)
