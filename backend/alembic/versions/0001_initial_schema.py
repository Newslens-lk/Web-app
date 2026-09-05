"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-08-17

The `sources`, `articles` and `events` tables mirror the schema owned by the
Data-Pipeline repo (Newslens-lk/Data-Pipeline, include/db/models.py + its own
Alembic migrations) against the shared `news_pipeline` database. They're
created here with IF NOT EXISTS/guarded DDL so this migration is a safe no-op
when run against a database Data-Pipeline has already migrated, while still
standing up a self-contained schema for local dev/CI. `annotations` and
`outlet_stats` are owned by this backend.
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

EMBEDDING_DIMENSION = 1024


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS sources (
            source_name TEXT PRIMARY KEY,
            source_type TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS events (
            event_id UUID PRIMARY KEY,
            summary TEXT,
            topic TEXT,
            article_count INTEGER NOT NULL,
            source_count INTEGER NOT NULL,
            window_start TIMESTAMPTZ,
            window_end TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_events_topic ON events (topic)")
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_events_window ON events (window_start, window_end)"
    )

    op.execute(
        f"""
        CREATE TABLE IF NOT EXISTS articles (
            article_id TEXT PRIMARY KEY,
            source_name TEXT NOT NULL REFERENCES sources (source_name),
            url TEXT NOT NULL UNIQUE,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            language TEXT NOT NULL,
            published_at TIMESTAMPTZ,
            scraped_at TIMESTAMPTZ,
            bias_label TEXT,
            bias_confidence DOUBLE PRECISION,
            bias_scores JSONB,
            embedding VECTOR({EMBEDDING_DIMENSION}),
            event_id UUID REFERENCES events (event_id) DEFERRABLE INITIALLY DEFERRED,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_articles_event_id ON articles (event_id)")
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles (published_at)"
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_articles_source ON articles (source_name)")
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_articles_embedding ON articles "
        "USING ivfflat (embedding vector_l2_ops) WITH (lists = 100)"
    )

    # Tables owned by this backend (not part of Data-Pipeline's schema).
    op.create_table(
        "annotations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "article_id", sa.String(), sa.ForeignKey("articles.article_id", ondelete="CASCADE")
        ),
        sa.Column("annotator_id", sa.String(100), nullable=False),
        sa.Column("dimension_a_label", sa.String(50), nullable=False),
        sa.Column("dimension_b_labels", sa.ARRAY(sa.String()), nullable=False),
        sa.Column("is_adjudicated", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_annotations_article_id", "annotations", ["article_id"])

    op.create_table(
        "outlet_stats",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "event_id", sa.Uuid(), sa.ForeignKey("events.event_id", ondelete="CASCADE")
        ),
        sa.Column("source_name", sa.String(255), nullable=False),
        sa.Column("covered", sa.Boolean(), nullable=False),
        sa.Column("reporting_latency_minutes", sa.Float(), nullable=True),
        sa.Column("lexical_stats", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("entity_stats", sa.JSON(), nullable=False, server_default="{}"),
    )
    op.create_index("ix_outlet_stats_event_id", "outlet_stats", ["event_id"])
    op.create_index("ix_outlet_stats_source_name", "outlet_stats", ["source_name"])


def downgrade() -> None:
    op.drop_table("outlet_stats")
    op.drop_table("annotations")
    op.execute("DROP INDEX IF EXISTS idx_articles_embedding")
    op.execute("DROP INDEX IF EXISTS idx_articles_source")
    op.execute("DROP INDEX IF EXISTS idx_articles_published_at")
    op.execute("DROP INDEX IF EXISTS idx_articles_event_id")
    op.execute("DROP TABLE IF EXISTS articles")
    op.execute("DROP INDEX IF EXISTS idx_events_window")
    op.execute("DROP INDEX IF EXISTS idx_events_topic")
    op.execute("DROP TABLE IF EXISTS events")
    op.execute("DROP TABLE IF EXISTS sources")
    op.execute("DROP EXTENSION IF EXISTS vector")
