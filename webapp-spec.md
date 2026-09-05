# NewsLens Web Application — Developer Specification

Handoff document for building the NewsLens web app. This covers everything the frontend and backend developer needs to know: what data exists, how to query it, what endpoints to build, and what the UI should look like.

---

## 1. System Context

NewsLens is a Sinhala news aggregation and analysis pipeline. It scrapes news from 5 Sri Lankan sources, cleans the text, generates embeddings, classifies political bias, clusters articles into "events" (stories covered by multiple sources), and loads everything into a PostgreSQL + pgvector database.

The web app is a **read-only dashboard** on top of this database, with an **admin panel** to trigger and monitor pipeline runs.

### What already exists

| Component | Tech | Where |
|-----------|------|-------|
| Pipeline orchestrator | Apache Airflow 3.3.1 | `localhost:8080` (REST API + UI) |
| Pipeline database | PostgreSQL 16 + pgvector | `localhost:5433` (or `news-db:5432` inside Docker network) |
| Object storage | MinIO (S3-compatible) | `localhost:9000` (API), `localhost:9001` (console) |
| Pipeline containers | 7 Docker containers | Launched by Airflow via DockerOperator |

### What you're building

A **separate repo** with:
- **FastAPI backend** — connects to the existing `news-db` PostgreSQL database (read-only for public endpoints) and Airflow REST API (admin endpoints)
- **React frontend** — public dashboard + admin panel

The web app should be deployable as a Docker container (or two) that joins the same Docker network as the pipeline.

---

## 2. Database Schema

The backend connects to the `news-db` PostgreSQL database. Three tables:

### `sources` table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `source_name` | `VARCHAR` | **PK** | e.g. `"hirunews"`, `"bbc_sinhala"` |
| `source_type` | `VARCHAR` | NOT NULL | Always `"html"` currently |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | When source was first seen |

**Current sources:** `hirunews`, `bbc_sinhala`, `lankadeepa`, `newsfirst`, `divaina`

### `articles` table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `article_id` | `VARCHAR` | **PK** | `sha256(url)[:24]` — 24 hex chars |
| `source_name` | `VARCHAR` | NOT NULL, FK → `sources.source_name` | Which news source |
| `url` | `TEXT` | NOT NULL, UNIQUE | Original article URL |
| `title` | `TEXT` | NOT NULL | Article headline |
| `body` | `TEXT` | NOT NULL | Full article text (Sinhala) |
| `language` | `VARCHAR` | NOT NULL | Always `"si"` (Sinhala) |
| `published_at` | `TIMESTAMPTZ` | NULLABLE | When originally published (not always available) |
| `scraped_at` | `TIMESTAMPTZ` | NULLABLE | When our pipeline fetched it |
| `bias_label` | `VARCHAR` | NULLABLE | One of: `far_left`, `left`, `center`, `right`, `far_right` |
| `bias_confidence` | `FLOAT` | NULLABLE | 0.0 to 1.0 |
| `bias_scores` | `JSONB` | NULLABLE | `{"far_left": 0.05, "left": 0.10, "center": 0.70, "right": 0.10, "far_right": 0.05}` |
| `embedding` | `VECTOR(1024)` | NULLABLE | 1024-dim float vector (pgvector type) |
| `event_id` | `UUID` | NULLABLE, FK → `events.event_id` | Which event/cluster this belongs to |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | DB insert time |

**Indexes:**
- `idx_articles_event_id` on `event_id` — for "show articles in this event"
- `idx_articles_published_at` on `published_at` — for "latest articles"
- `idx_articles_source` on `source_name` — for "articles from source X"
- `idx_articles_embedding` — IVFFlat vector index with `vector_l2_ops` for similarity search

### `events` table

An "event" is a real-world news story covered by one or more articles from different sources. Created by the clustering stage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `event_id` | `UUID` | **PK** | Generated per cluster |
| `summary` | `TEXT` | NULLABLE | LLM-generated neutral summary (may be NULL — not yet implemented) |
| `topic` | `VARCHAR` | NULLABLE | Topic label (may be NULL — not yet implemented) |
| `article_count` | `INTEGER` | NOT NULL | How many articles cover this event |
| `source_count` | `INTEGER` | NOT NULL | How many distinct sources cover this event |
| `window_start` | `TIMESTAMPTZ` | NULLABLE | Earliest article's `published_at` |
| `window_end` | `TIMESTAMPTZ` | NULLABLE | Latest article's `published_at` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | When event was created |

**Indexes:**
- `idx_events_topic` on `topic`
- `idx_events_window` on `(window_start, window_end)`

### Important notes for the backend developer

1. **`summary` and `topic` are currently NULL** for all events — the summarization/topic assignment module hasn't been built yet. Design the UI to handle this gracefully (show a fallback like the title of the most recent article in the cluster).
2. **`embedding` is a pgvector type** — you need the `pgvector` extension and Python library to query it. For similarity search use `ORDER BY embedding <-> %s LIMIT k` (L2 distance) or `<=>` (cosine distance, but our embeddings are L2-normalized so both give same ranking).
3. **`bias_scores` is JSONB** — always has exactly 5 keys: `far_left`, `left`, `center`, `right`, `far_right`. Values sum to ~1.0.
4. **All text content is in Sinhala** (Unicode range U+0D80–U+0DFF). Ensure your frontend renders Sinhala correctly (any modern browser does by default, but test with actual data).

---

## 3. Backend (FastAPI)

### Connection Details

```python
# news-db (pipeline database)
DB_HOST = "news-db"       # Docker hostname (or localhost:5433 from host)
DB_PORT = 5432
DB_NAME = "news_pipeline"
DB_USER = "news"
DB_PASSWORD = "news"       # from .env, use env vars in production

# Airflow REST API (for admin endpoints)
AIRFLOW_BASE_URL = "http://airflow-apiserver:8080"
AIRFLOW_USER = "airflow"
AIRFLOW_PASSWORD = "airflow"  # from .env
```

Use **SQLAlchemy async** or **psycopg** (async) for DB queries. Add `pgvector` Python package for vector operations.

### Public API Endpoints

#### Events

```
GET /api/events
```
List events, newest first. This is the **main landing page data source**.

**Query params:**
- `page` (int, default 1)
- `page_size` (int, default 20, max 50)
- `topic` (string, optional) — filter by topic (when implemented)
- `source` (string, optional) — filter to events that have articles from this source
- `date_from` / `date_to` (ISO date, optional) — filter by `window_start`/`window_end`
- `min_sources` (int, optional) — e.g. `min_sources=2` to only show multi-source events

**Response:**
```json
{
  "events": [
    {
      "event_id": "550e8400-e29b-41d4-a716-446655440000",
      "summary": "Government announces new economic reforms...",
      "topic": "politics",
      "article_count": 4,
      "source_count": 3,
      "window_start": "2026-09-04T08:00:00+00:00",
      "window_end": "2026-09-04T14:00:00+00:00",
      "created_at": "2026-09-04T15:00:00+00:00",
      "representative_title": "ආර්ථික ප්‍රතිසංස්කරණ...",
      "sources": ["hirunews", "bbc_sinhala", "lankadeepa"]
    }
  ],
  "total": 142,
  "page": 1,
  "page_size": 20
}
```

**Implementation notes:**
- `representative_title`: since `summary` may be NULL, JOIN to articles and pick the title of the most recent article in the event as a fallback display title
- `sources`: aggregate distinct `source_name` from articles in this event (small subquery, fast with the event_id index)
- Order by `window_end DESC NULLS LAST` (most recent events first)

---

```
GET /api/events/{event_id}
```
Single event with its full article list.

**Response:**
```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "summary": null,
  "topic": null,
  "article_count": 4,
  "source_count": 3,
  "window_start": "2026-09-04T08:00:00+00:00",
  "window_end": "2026-09-04T14:00:00+00:00",
  "articles": [
    {
      "article_id": "aaa111bbb222ccc333ddd444",
      "source_name": "hirunews",
      "url": "https://hirunews.lk/...",
      "title": "ආර්ථික ප්‍රතිසංස්කරණ...",
      "body": "...",
      "published_at": "2026-09-04T10:00:00+00:00",
      "bias_label": "center",
      "bias_confidence": 0.82,
      "bias_scores": {"far_left": 0.03, "left": 0.07, "center": 0.82, "right": 0.05, "far_right": 0.03}
    }
  ],
  "bias_distribution": {
    "far_left": 0,
    "left": 1,
    "center": 2,
    "right": 1,
    "far_right": 0
  }
}
```

**Implementation notes:**
- `bias_distribution`: count how many articles in this event have each bias label — this powers the bias comparison visualization
- Don't return `embedding` or `body` in the list view (too large). Only return `body` in the detail view
- Articles sorted by `published_at DESC`

---

#### Articles

```
GET /api/articles
```
**Query params:**
- `page`, `page_size`
- `source` (string, optional)
- `bias_label` (string, optional) — filter by bias classification
- `event_id` (UUID, optional) — articles in a specific event
- `date_from` / `date_to`
- `search` (string, optional) — full-text search on title/body (use PostgreSQL `to_tsvector`/`to_tsquery` or `ILIKE` for simple substring)

**Response:**
```json
{
  "articles": [
    {
      "article_id": "aaa111bbb222ccc333ddd444",
      "source_name": "hirunews",
      "url": "https://hirunews.lk/...",
      "title": "...",
      "published_at": "2026-09-04T10:00:00+00:00",
      "bias_label": "center",
      "bias_confidence": 0.82,
      "event_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  ],
  "total": 500,
  "page": 1,
  "page_size": 20
}
```

Note: omit `body`, `embedding`, and `bias_scores` from list responses for performance.

---

```
GET /api/articles/{article_id}
```
Full article detail including body and bias scores.

**Response:**
```json
{
  "article_id": "aaa111bbb222ccc333ddd444",
  "source_name": "hirunews",
  "url": "https://hirunews.lk/...",
  "title": "...",
  "body": "...",
  "language": "si",
  "published_at": "2026-09-04T10:00:00+00:00",
  "scraped_at": "2026-09-04T12:00:00+00:00",
  "bias_label": "center",
  "bias_confidence": 0.82,
  "bias_scores": {"far_left": 0.03, "left": 0.07, "center": 0.82, "right": 0.05, "far_right": 0.03},
  "event_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

```
GET /api/articles/{article_id}/similar
```
Find articles similar to this one using vector similarity search.

**Query params:**
- `limit` (int, default 5, max 20)

**SQL approach:**
```sql
SELECT article_id, title, source_name, published_at, bias_label,
       embedding <-> (SELECT embedding FROM articles WHERE article_id = %s) AS distance
FROM articles
WHERE article_id != %s AND embedding IS NOT NULL
ORDER BY distance
LIMIT %s;
```

**Response:**
```json
{
  "similar_articles": [
    {
      "article_id": "bbb222ccc333ddd444eee555",
      "title": "...",
      "source_name": "bbc_sinhala",
      "published_at": "...",
      "bias_label": "left",
      "distance": 0.23
    }
  ]
}
```

---

#### Sources

```
GET /api/sources
```
List all news sources with article counts.

**Response:**
```json
{
  "sources": [
    {
      "source_name": "hirunews",
      "source_type": "html",
      "article_count": 1250,
      "latest_article_at": "2026-09-04T14:00:00+00:00"
    }
  ]
}
```

---

#### Statistics

```
GET /api/stats
```
Dashboard overview stats.

**Response:**
```json
{
  "total_articles": 5000,
  "total_events": 800,
  "total_sources": 5,
  "articles_today": 45,
  "events_today": 12,
  "bias_breakdown": {
    "far_left": 120,
    "left": 850,
    "center": 3200,
    "right": 700,
    "far_right": 130
  },
  "articles_per_source": {
    "hirunews": 1250,
    "bbc_sinhala": 980,
    "lankadeepa": 1100,
    "newsfirst": 870,
    "divaina": 800
  },
  "last_pipeline_run": "2026-09-04T12:00:00+00:00"
}
```

The `last_pipeline_run` comes from the Airflow API (see admin endpoints below).

---

### Admin API Endpoints

These require authentication. Use a simple API key or session-based auth.

```
POST /api/admin/pipeline/trigger
```
Trigger a new pipeline run via the Airflow REST API.

**Implementation:**
```python
import httpx

async def trigger_pipeline():
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{AIRFLOW_BASE_URL}/api/v2/dags/news_event_pipeline/dagRuns",
            json={"logical_date": None, "conf": {}},
            auth=(AIRFLOW_USER, AIRFLOW_PASSWORD),
        )
        return resp.json()
```

**Response:**
```json
{
  "dag_run_id": "manual__2026-09-04T15:30:00+00:00",
  "state": "queued",
  "logical_date": "2026-09-04T15:30:00+00:00"
}
```

---

```
GET /api/admin/pipeline/status
```
Get the status of the most recent pipeline run.

**Implementation — call Airflow API:**
```
GET {AIRFLOW_BASE_URL}/api/v2/dags/news_event_pipeline/dagRuns?order_by=-start_date&limit=5
```

**Response:**
```json
{
  "runs": [
    {
      "dag_run_id": "manual__2026-09-04T15:30:00+00:00",
      "state": "success",
      "start_date": "2026-09-04T15:30:00+00:00",
      "end_date": "2026-09-04T15:45:00+00:00",
      "tasks": [
        {"task_id": "scrape", "state": "success", "duration": 120},
        {"task_id": "clean", "state": "success", "duration": 15},
        {"task_id": "embed", "state": "success", "duration": 90},
        {"task_id": "bias", "state": "success", "duration": 30},
        {"task_id": "cluster", "state": "success", "duration": 20},
        {"task_id": "load", "state": "success", "duration": 10}
      ]
    }
  ]
}
```

For task-level status, call:
```
GET {AIRFLOW_BASE_URL}/api/v2/dags/news_event_pipeline/dagRuns/{dag_run_id}/taskInstances
```

---

```
GET /api/admin/pipeline/history
```
List recent pipeline runs (last 20).

**Query params:**
- `limit` (int, default 20)

---

## 4. Frontend (React)

### Tech Recommendations

- **React 18+** with TypeScript
- **React Router** for client-side routing
- **Tailwind CSS** or **Chakra UI** for styling
- **React Query (TanStack Query)** for data fetching + caching
- **Recharts** or **Chart.js** for bias distribution charts
- A Sinhala-capable font (Noto Sans Sinhala — include via Google Fonts)

### Pages & Routes

#### Public Pages

**1. Home / Events Dashboard — `/`**

The main page. Shows a feed of news events, newest first.

Layout:
```
┌──────────────────────────────────────────────────────┐
│  NewsLens    [Sources ▼]  [Date Range]  [Search]     │
├──────────────────────────────────────────────────────┤
│  Stats Bar: 5000 articles | 800 events | 5 sources   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ Event Card                                     │  │
│  │ ▎ ආර්ථික ප්‍රතිසංස්කරණ... (representative title)│  │
│  │ ▎ 4 articles · 3 sources · 2h ago              │  │
│  │ ▎ Sources: ● hirunews ● bbc_sinhala ● lankadeepa│  │
│  │ ▎ Bias: ██████ center(2) █ left(1) █ right(1)  │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ Event Card                                     │  │
│  │ ...                                            │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  [Load More] or infinite scroll                      │
└──────────────────────────────────────────────────────┘
```

Each event card shows:
- Representative title (from `summary` if available, otherwise the most recent article's title)
- Article count and source count
- Relative time ("2h ago", "yesterday")
- Source badges (colored dots/chips per source)
- Mini bias bar showing the distribution of bias labels across articles in that event

Clicking an event card navigates to the event detail page.

**2. Event Detail — `/events/:eventId`**

Shows one event with all its articles side by side, enabling bias comparison.

Layout:
```
┌──────────────────────────────────────────────────────┐
│ ← Back to Events                                     │
├──────────────────────────────────────────────────────┤
│ Event Summary (or representative title)               │
│ 4 articles from 3 sources · Sep 4, 2026              │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Bias Distribution Chart (horizontal stacked bar)     │
│ ████████████████░░░░░░░░                              │
│ far_left(0) left(1) center(2) right(1) far_right(0) │
│                                                      │
├──────────────────────────────────────────────────────┤
│ Articles (sorted by published_at)                    │
│                                                      │
│ ┌─────────────────┐  ┌─────────────────┐             │
│ │ hirunews         │  │ bbc_sinhala      │            │
│ │ Bias: center 82% │  │ Bias: left 65%   │            │
│ │ ──────────────── │  │ ──────────────── │            │
│ │ Title...         │  │ Title...         │            │
│ │ Body preview...  │  │ Body preview...  │            │
│ │ [Read Original ↗]│  │ [Read Original ↗]│            │
│ └─────────────────┘  └─────────────────┘             │
│                                                      │
│ ┌─────────────────┐                                  │
│ │ lankadeepa       │                                  │
│ │ Bias: right 55%  │                                  │
│ │ ...              │                                  │
│ └─────────────────┘                                  │
└──────────────────────────────────────────────────────┘
```

Key features:
- **Bias comparison** is the core value — show how different sources covered the same story with different political leanings
- Each article card shows the bias label with confidence, a mini bar chart of the 5-class scores, source name, and a link to the original article
- Show article body as an expandable preview (first 200 chars, click to expand)

**3. Article Detail — `/articles/:articleId`**

Full article view.
- Full title and body text
- Source name + link to original
- Published date
- Bias classification with score breakdown (5-class bar chart)
- "Similar Articles" section at the bottom (from `/api/articles/{id}/similar`)
- Link to the event this article belongs to

**4. Sources Page — `/sources`**

Shows all 5 news sources with stats.
- Source name
- Total articles scraped
- Latest article date
- Bias distribution chart per source (how does each source lean overall?)

**5. Analytics / Stats Page — `/analytics`**

Dashboard with charts:
- Articles per day (line chart, last 30 days)
- Bias distribution across all articles (pie or donut chart)
- Articles per source (bar chart)
- Events per day (line chart)
- Source coverage overlap (how many events are covered by 1, 2, 3+ sources)

#### Admin Pages

**6. Admin Panel — `/admin`**

Protected by login (simple username/password is fine for a semester demo).

```
┌──────────────────────────────────────────────────────┐
│ Admin Panel                                           │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Pipeline Status                                       │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Last run: Sep 4, 2026 3:30 PM — ✅ SUCCESS       │ │
│ │ Duration: 15m 23s                                │ │
│ │                                                  │ │
│ │ scrape ✅ → clean ✅ → embed ✅ → bias ✅        │ │
│ │                                  → cluster ✅    │ │
│ │                                       → load ✅  │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ [▶ Trigger Pipeline Run]                             │
│                                                      │
│ Recent Runs                                           │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Sep 4 15:30  ✅ success  15m 23s                 │ │
│ │ Sep 4 11:30  ✅ success  14m 50s                 │ │
│ │ Sep 4 07:30  ❌ failed   8m 12s   (scrape fail)  │ │
│ │ Sep 3 23:30  ✅ success  16m 05s                 │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ Quick Links                                           │
│ [Open Airflow UI ↗]  [Open MinIO Console ↗]          │
└──────────────────────────────────────────────────────┘
```

Features:
- Show current pipeline status (running/idle) with task-level progress
- Trigger button to start a new pipeline run
- History of recent runs with status, duration, and failure info
- Links to Airflow UI (`localhost:8080`) and MinIO console (`localhost:9001`) for detailed debugging

---

## 5. Bias Label Color Scheme

Use consistent colors everywhere for the 5 bias labels:

| Label | Color | Hex |
|-------|-------|-----|
| `far_left` | Deep Red | `#DC2626` |
| `left` | Orange | `#EA580C` |
| `center` | Gray/Neutral | `#6B7280` |
| `right` | Blue | `#2563EB` |
| `far_right` | Deep Blue | `#1E3A8A` |

These colors should be used in bias bar charts, article cards, and source breakdowns.

---

## 6. Source Branding

Each source should have a distinct visual identity:

| Source | Display Name | Color Suggestion |
|--------|-------------|-----------------|
| `hirunews` | Hiru News | `#FF6B00` (orange) |
| `bbc_sinhala` | BBC Sinhala | `#BB1919` (BBC red) |
| `lankadeepa` | Lankadeepa | `#1B5E20` (green) |
| `newsfirst` | NewsFirst | `#0D47A1` (blue) |
| `divaina` | Divaina | `#6A1B9A` (purple) |

---

## 7. Docker Deployment

The web app should be deployable alongside the existing pipeline. Example `docker-compose.override.yaml`:

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DB_HOST: news-db
      DB_PORT: 5432
      DB_NAME: news_pipeline
      DB_USER: news
      DB_PASSWORD: ${NEWS_DB_PASSWORD}
      AIRFLOW_BASE_URL: http://airflow-apiserver:8080
      AIRFLOW_USER: airflow
      AIRFLOW_PASSWORD: ${AIRFLOW_PASSWORD}
    networks:
      - newslens_pipeline_default
    depends_on:
      - news-db

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      REACT_APP_API_URL: http://localhost:8000
    networks:
      - newslens_pipeline_default

networks:
  newslens_pipeline_default:
    external: true
```

The Docker network name is `newslens_pipeline_default` (auto-generated by docker-compose from the project directory name).

---

## 8. Key Queries for Reference

These are the SQL queries the backend will need. Use them as a starting point.

### Get events with representative titles
```sql
SELECT e.*,
       (SELECT a.title FROM articles a
        WHERE a.event_id = e.event_id
        ORDER BY a.published_at DESC NULLS LAST LIMIT 1) AS representative_title,
       (SELECT array_agg(DISTINCT a.source_name) FROM articles a
        WHERE a.event_id = e.event_id) AS sources
FROM events e
ORDER BY e.window_end DESC NULLS LAST
LIMIT 20 OFFSET 0;
```

### Get bias distribution for an event
```sql
SELECT bias_label, COUNT(*) as count
FROM articles
WHERE event_id = %s AND bias_label IS NOT NULL
GROUP BY bias_label;
```

### Get overall stats
```sql
SELECT
  (SELECT COUNT(*) FROM articles) AS total_articles,
  (SELECT COUNT(*) FROM events) AS total_events,
  (SELECT COUNT(*) FROM sources) AS total_sources,
  (SELECT COUNT(*) FROM articles WHERE scraped_at >= CURRENT_DATE) AS articles_today;
```

### Similar articles (vector search)
```sql
SELECT article_id, title, source_name, published_at, bias_label,
       embedding <-> (SELECT embedding FROM articles WHERE article_id = %s) AS distance
FROM articles
WHERE article_id != %s AND embedding IS NOT NULL
ORDER BY distance
LIMIT 5;
```

### Bias breakdown per source
```sql
SELECT source_name, bias_label, COUNT(*) as count
FROM articles
WHERE bias_label IS NOT NULL
GROUP BY source_name, bias_label
ORDER BY source_name, bias_label;
```

---

## 9. CORS Configuration

The FastAPI backend needs CORS configured to allow requests from the React frontend:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 10. Summary Checklist

### Backend
- [ ] FastAPI project with async DB connection (SQLAlchemy async or asyncpg)
- [ ] Install `pgvector` Python package for vector queries
- [ ] Public endpoints: events (list/detail), articles (list/detail/similar), sources, stats
- [ ] Admin endpoints: pipeline trigger, status, history (proxy to Airflow REST API)
- [ ] Admin auth (API key or session)
- [ ] CORS for React frontend
- [ ] Pagination on all list endpoints
- [ ] Dockerfile

### Frontend
- [ ] React + TypeScript project
- [ ] Events feed (home page) with event cards
- [ ] Event detail with side-by-side article bias comparison
- [ ] Article detail with bias score chart
- [ ] Similar articles section
- [ ] Sources page with per-source stats
- [ ] Analytics dashboard with charts
- [ ] Admin panel (pipeline trigger/status/history)
- [ ] Sinhala font support (Noto Sans Sinhala)
- [ ] Consistent bias label colors
- [ ] Responsive design
- [ ] Dockerfile (nginx serving built React)
