# NewsLens Backend

FastAPI backend for the NewsLens bias-aware Sinhala news aggregation platform. Provides a read-only REST API over the pipeline database and an admin interface for triggering/monitoring Airflow pipeline runs.

## Prerequisites

- Python 3.11+
- Access to the `news_pipeline` PostgreSQL database (with pgvector extension)
- Airflow API (for admin endpoints)

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Copy and edit environment variables
cp .env.example .env
```

## Running

```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/events` | List events (paginated, filterable by `topic`, `source`, `date_from`, `date_to`, `min_sources`) |
| `GET` | `/api/events/{event_id}` | Event detail with articles and bias distribution |
| `GET` | `/api/articles` | List articles (paginated, filterable by `source`, `bias_label`, `event_id`, `search`) |
| `GET` | `/api/articles/{article_id}` | Full article detail with bias scores |
| `GET` | `/api/articles/{article_id}/similar` | Similar articles via pgvector similarity search |
| `GET` | `/api/sources` | All sources with article counts |
| `GET` | `/api/stats` | Dashboard statistics |

### Admin (requires `X-API-Key` header)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/admin/pipeline/trigger` | Trigger a new Airflow pipeline run |
| `GET` | `/api/admin/pipeline/status` | Latest pipeline runs with task-level status |
| `GET` | `/api/admin/pipeline/history` | Recent pipeline run history |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `news-db` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `news_pipeline` | Database name |
| `DB_USER` | `news` | Database user |
| `DB_PASSWORD` | `news` | Database password |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins (comma-separated) |
| `AIRFLOW_BASE_URL` | `http://airflow-apiserver:8080` | Airflow REST API URL |
| `AIRFLOW_USER` | `airflow` | Airflow username |
| `AIRFLOW_PASSWORD` | `airflow` | Airflow password |
| `ADMIN_API_KEY` | `changeme` | API key for admin endpoints |

## Project Structure

```
app/
  main.py              # FastAPI app entrypoint
  core/
    config.py          # Settings from environment
  db/
    base.py            # SQLAlchemy declarative base
    session.py         # DB engine and session factory
  models/
    source.py          # Source ORM model
    article.py         # Article ORM model (with pgvector embedding)
    event.py           # Event (cluster) ORM model
  schemas/
    article.py         # Article response schemas
    event.py           # Event response schemas + BiasDistribution
    source.py          # Source response schema
    stats.py           # Dashboard stats schema
    admin.py           # Pipeline admin schemas
  api/
    router.py          # Top-level API router
    events.py          # /events endpoints
    articles.py        # /articles endpoints
    sources.py         # /sources endpoint
    stats.py           # /stats endpoint
    admin.py           # /admin/pipeline endpoints
    health.py          # /health endpoint
```

## Testing

```bash
pip install -r requirements-dev.txt
pytest --cov=app
```

## Analytics

`GET /api/analytics/overview` is public, like the news and event endpoints.
Visitors and regular users can view the dashboard without a special role or login.
Filters: repeated `source` parameters, `bias_label`, and `date_from`/`date_to`
(ISO calendar dates, inclusive, Asia/Colombo). Reversed ranges return HTTP 422.

The endpoint returns matching article counts, distinct event/publisher counts,
overall bias counts/percentages, and the same distribution for each publisher.
Unknown or missing labels remain in an `unclassified` bucket and in denominators.
All-time results include undated articles. Date-filtered results exclude them and
report the count excluded under the same source/bias filters. Collection timestamps
are never used as publication timestamps. Responses are not cached.

The `/analytics` dashboard provides these filters and Chart.js charts with data
tables. It flags samples below 20 articles as a reading aid, not a significance test.
No topic, sentiment, trend, or reporting-latency results are invented for missing data.

## Article image repair

Image backfilling rejects known publisher placeholders and validates actual image
dimensions (at least 320 × 160). Lankadeepa article-body photos take priority over
its unreliable Open Graph image. Ads and related-story images are not fallbacks.

Run from the backend directory or inside the backend container:

```bash
python -m scripts.backfill_article_images --source lankadeepa --limit 100
python -m scripts.backfill_article_images --source lankadeepa --replace-url "BAD_IMAGE_URL" --dry-run
python -m scripts.backfill_article_images --source lankadeepa --replace-url "BAD_IMAGE_URL" --backup image-repair.json
```

The default processes only missing images; `--replace-url` targets existing records
with exactly that URL. Repairs write a JSON backup of old and new values before
committing. If an article page cannot be fetched, its stored value is preserved.
If it loads but has no suitable photo, the image is cleared and the UI shows
“No image available.” Copy backups out of a container before recreating it.
