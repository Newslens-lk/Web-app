-- Pipeline-owned tables, recreated locally so the web app can run without the
-- Data-Pipeline stack. Mirrors backend/app/models/{source,event,article}.py.
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS sources (
    source_name TEXT PRIMARY KEY,
    source_type TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
    event_id      UUID PRIMARY KEY,
    summary       TEXT,
    topic         TEXT,
    article_count INTEGER NOT NULL,
    source_count  INTEGER NOT NULL,
    window_start  TIMESTAMPTZ,
    window_end    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_topic  ON events (topic);
CREATE INDEX IF NOT EXISTS idx_events_window ON events (window_start, window_end);

CREATE TABLE IF NOT EXISTS articles (
    article_id      TEXT PRIMARY KEY,
    source_name     TEXT NOT NULL REFERENCES sources (source_name),
    url             TEXT UNIQUE NOT NULL,
    title           TEXT NOT NULL,
    body            TEXT NOT NULL,
    image_url       TEXT,
    language        TEXT NOT NULL,
    published_at    TIMESTAMPTZ,
    scraped_at      TIMESTAMPTZ,
    bias_label      TEXT,
    bias_confidence DOUBLE PRECISION,
    bias_scores     JSONB,
    embedding       vector(1024),
    event_id        UUID REFERENCES events (event_id) DEFERRABLE INITIALLY DEFERRED,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articles_event_id     ON articles (event_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles (published_at);
CREATE INDEX IF NOT EXISTS idx_articles_source       ON articles (source_name);
CREATE INDEX IF NOT EXISTS idx_articles_embedding
    ON articles USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
