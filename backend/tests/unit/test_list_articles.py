from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import MagicMock

from sqlalchemy.dialects import postgresql

# Compile against the real Postgres dialect, not SQLAlchemy's generic
# default one — the default compiler doesn't know Postgres-specific
# things like ILIKE or native UUID literals (it falls back to
# LOWER(x) LIKE LOWER(y) emulation, and can't render a UUID literal at
# all), and this app only ever runs against Postgres in practice.
COMPILE_KWARGS = {"dialect": postgresql.dialect(), "compile_kwargs": {"literal_binds": True}}


def make_fake_article(**overrides):
    """A stand-in Article with exactly the attributes ArticleSummary reads."""
    defaults = dict(
        article_id="a1",
        source_name="BBC",
        url="https://example.com/a1",
        title="Test Headline",
        published_at=datetime(2026, 9, 1, tzinfo=UTC),
        bias_label="center",
        bias_confidence=0.7,
        event_id=None,
    )
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def make_fake_db(total, articles):
    """A fake DB session that answers both calls list_articles makes:
    db.scalar(...) for the count, db.scalars(...) for the page of rows."""
    fake_db = MagicMock()
    fake_db.scalar.return_value = total
    fake_db.scalars.return_value = articles
    return fake_db


# ---------------------------------------------------------------------------
# Pagination defaults & echoing
# ---------------------------------------------------------------------------


def test_default_pagination_is_page_1_size_20(client, override_get_db):
    override_get_db(make_fake_db(total=0, articles=[]))

    response = client.get("/api/articles")

    body = response.json()
    assert body["page"] == 1
    assert body["page_size"] == 20


def test_page_and_page_size_are_echoed_back(client, override_get_db):
    override_get_db(make_fake_db(total=100, articles=[]))

    response = client.get("/api/articles?page=3&page_size=10")

    body = response.json()
    assert body["page"] == 3
    assert body["page_size"] == 10
    assert body["total"] == 100


# Validation — these never even reach the fake DB, FastAPI rejects them first



def test_page_zero_is_rejected_with_422(client):
    response = client.get("/api/articles?page=0")

    assert response.status_code == 422


def test_page_size_over_50_is_rejected_with_422(client):
    response = client.get("/api/articles?page_size=51")

    assert response.status_code == 422



# Response shaping



def test_returned_articles_are_serialized_correctly(client, override_get_db):
    articles = [make_fake_article(article_id="a1"), make_fake_article(article_id="a2")]
    override_get_db(make_fake_db(total=2, articles=articles))

    response = client.get("/api/articles")

    body = response.json()
    assert [a["article_id"] for a in body["articles"]] == ["a1", "a2"]
    assert body["articles"][0]["source_name"] == "BBC"


def test_total_falls_back_to_zero_when_count_query_returns_none(client, override_get_db):
    # db.scalar(...) can return None if the count query somehow yields
    # nothing — the route guards this with `total=total or 0`.
    override_get_db(make_fake_db(total=None, articles=[]))

    response = client.get("/api/articles")

    assert response.json()["total"] == 0


# Proving a filter is actually applied — without a real database



def test_source_filter_is_applied_to_the_query(client, override_get_db):
    fake_db = make_fake_db(total=0, articles=[])
    override_get_db(fake_db)

    client.get("/api/articles?source=BBC")

    # db.scalars(stmt) is called with the fully-built SQLAlchemy statement.
    # Compiling it with literal_binds=True inlines the actual filter value
    # into the SQL text, so we can check the WHERE clause without running
    # it against a real database.
    stmt = fake_db.scalars.call_args.args[0]
    compiled_sql = str(stmt.compile(**COMPILE_KWARGS))

    assert "source_name" in compiled_sql
    assert "BBC" in compiled_sql


def test_no_filters_means_no_where_clause(client, override_get_db):
    fake_db = make_fake_db(total=0, articles=[])
    override_get_db(fake_db)

    client.get("/api/articles")

    stmt = fake_db.scalars.call_args.args[0]
    compiled_sql = str(stmt.compile(**COMPILE_KWARGS))

    assert "WHERE" not in compiled_sql.upper()


def test_bias_label_filter_is_applied_to_the_query(client, override_get_db):
    fake_db = make_fake_db(total=0, articles=[])
    override_get_db(fake_db)

    client.get("/api/articles?bias_label=left")

    stmt = fake_db.scalars.call_args.args[0]
    compiled_sql = str(stmt.compile(**COMPILE_KWARGS))

    assert "bias_label" in compiled_sql
    assert "'left'" in compiled_sql


def test_event_id_filter_is_applied_to_the_query(client, override_get_db):
    fake_db = make_fake_db(total=0, articles=[])
    override_get_db(fake_db)
    event_id = "11111111-1111-1111-1111-111111111111"

    client.get(f"/api/articles?event_id={event_id}")

    stmt = fake_db.scalars.call_args.args[0]
    compiled_sql = str(stmt.compile(**COMPILE_KWARGS))

    assert "event_id" in compiled_sql
    assert event_id in compiled_sql


def test_date_from_filter_is_applied_to_the_query(client, override_get_db):
    fake_db = make_fake_db(total=0, articles=[])
    override_get_db(fake_db)

    client.get("/api/articles?date_from=2026-01-01T00:00:00")

    stmt = fake_db.scalars.call_args.args[0]
    compiled_sql = str(stmt.compile(**COMPILE_KWARGS))

    assert "published_at >=" in compiled_sql


def test_date_to_filter_is_applied_to_the_query(client, override_get_db):
    fake_db = make_fake_db(total=0, articles=[])
    override_get_db(fake_db)

    client.get("/api/articles?date_to=2026-12-31T23:59:59")

    stmt = fake_db.scalars.call_args.args[0]
    compiled_sql = str(stmt.compile(**COMPILE_KWARGS))

    assert "published_at <=" in compiled_sql


def test_search_filter_matches_title_or_body_with_ilike(client, override_get_db):
    fake_db = make_fake_db(total=0, articles=[])
    override_get_db(fake_db)

    client.get("/api/articles?search=election")

    stmt = fake_db.scalars.call_args.args[0]
    compiled_sql = str(stmt.compile(**COMPILE_KWARGS)).upper()

    assert "ILIKE" in compiled_sql
    assert "TITLE" in compiled_sql
    assert "BODY" in compiled_sql
    assert "%ELECTION%" in compiled_sql
