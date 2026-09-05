# backend

API layer for the Bias-Aware Sinhala News Aggregation Platform (Newslens). Batch
scraping/cleaning/embedding/bias-classification/clustering is owned by the separate
[Data-Pipeline](https://github.com/Newslens-lk/Data-Pipeline) repo (Airflow-orchestrated,
writes to a shared `news_pipeline` Postgres+pgvector database). This repo is the "on-demand"
API layer that Data-Pipeline's own README calls out as *not* part of the batch pipeline: it
serves articles/events read from that shared database, and (going forward) computes
summarization/topic-tagging and ad-hoc bias prediction on demand.

## Stack

- **API**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 14+ with `pgvector` — the same `news_pipeline` database
  Data-Pipeline's loader writes to
- **Cache / rate limiting**: Redis
- **ML**: scikit-learn, PyTorch, Transformers, spaCy, HDBSCAN + Leiden, MLflow (see `requirements-ml.txt`)
- **Migrations**: Alembic

## Project layout

```
app/
  api/v1/          REST endpoints (health, articles, events, predict)
  collection/       Scraping + external dataset ingestion (superseded by Data-Pipeline; stub)
  preprocessing/     Cleaning / normalisation
  embedding/         LASER3 sentence embeddings (superseded by Data-Pipeline; stub)
  clustering/         HDBSCAN + Leiden event clustering (superseded by Data-Pipeline; stub)
  summarization/      On-demand multi-document event summaries (FR1.4) - this API's job
  classification/      On-demand ad-hoc bias prediction (FR1.5) - this API's job
  models/           SQLAlchemy ORM models
                      - Source/Article/Event mirror Data-Pipeline's news_pipeline schema
                        (include/db/models.py); this repo does not own their migration in
                        shared deployments (see alembic/versions/0001)
                      - Annotation/OutletStats are owned by this backend
  schemas/          Pydantic request/response models
  db/               Engine/session setup
  core/             Settings, rate limiting
alembic/            Database migrations
tests/
```

`collection`, `embedding` and `clustering` are stubs kept only as a historical marker of the
SRS pipeline stages — that logic now lives in Data-Pipeline. `summarization` and
`classification` are still stubs (`NotImplementedError`) but are in scope for this repo, since
Data-Pipeline's README explicitly defers summarization/topic-tagging and ad-hoc prediction to
an API layer rather than the batch pipeline.

## Getting started

`docker-compose.yml` here spins up its own standalone Postgres for local dev/CI (migration
0001 creates the full `sources`/`articles`/`events` schema, guarded with `IF NOT EXISTS` so it's
also safe to run against Data-Pipeline's real `news_pipeline` database, where those tables
already exist). To connect to the actual shared pipeline database instead, point `DATABASE_URL`
at Data-Pipeline's `news-db` service.

1. Copy the environment template and adjust as needed:
   ```
   cp .env.example .env
   ```
2. Start Postgres + Redis + the API with Docker Compose:
   ```
   docker compose up --build
   ```
3. Apply database migrations:
   ```
   docker compose exec api alembic upgrade head
   ```
4. API docs are available at `http://localhost:8000/docs`.

### Local development without Docker

```
python -m venv .venv
.venv/Scripts/activate   # or source .venv/bin/activate on macOS/Linux
pip install -r requirements-dev.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Install `requirements-ml.txt` separately when working on embedding, clustering, summarization or
classification (heavier dependencies, not required to run the API/DB layer).

## Tests & linting

```
pytest
ruff check app tests alembic
```
