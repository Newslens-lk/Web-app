"""Exercise real aggregate queries against a small isolated article table."""

from datetime import datetime
from types import SimpleNamespace

import pytest
from sqlalchemy import Column, DateTime, MetaData, String, Table, create_engine, event
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.api.auth import get_current_user
from app.main import app


@pytest.fixture
def analytics_db(override_get_db):
    engine = create_engine("sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})
    metadata = MetaData()
    articles = Table(
        "articles", metadata,
        Column("article_id", String, primary_key=True), Column("source_name", String),
        Column("bias_label", String), Column("published_at", DateTime), Column("event_id", String),
    )
    metadata.create_all(engine)
    with Session(engine) as db:
        rows = [
            ("1", "alpha", "left", datetime(2026, 9, 1, 0, 0), "event1"),
            ("2", "alpha", " CENTER ", datetime(2026, 9, 1, 23, 59, 59, 999999), "event1"),
            ("3", "beta", "right", datetime(2026, 9, 2), "event1"),
            ("4", "beta", None, None, "event2"),
            ("5", "alpha", "unknown", None, None),
        ]
        db.execute(articles.insert(), [dict(zip(
            ("article_id", "source_name", "bias_label", "published_at", "event_id"), row,
        )) for row in rows])
        db.commit()
        override_get_db(db)
        yield db
    engine.dispose()


@pytest.fixture
def regular_user():
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(role="user")
    yield
    app.dependency_overrides.pop(get_current_user, None)


def test_anonymous_access_is_allowed(client, analytics_db):
    assert client.get("/api/analytics/overview").status_code == 200


@pytest.mark.parametrize("role", ["user", "admin"])
def test_role_access(client, analytics_db, regular_user, role):
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(role=role)
    assert client.get("/api/analytics/overview").status_code == 200


def test_totals_and_distributions_include_unknown_labels(client, analytics_db):
    response = client.get("/api/analytics/overview")
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    body = response.json()
    assert (body["total_articles"], body["total_events"], body["total_sources"]) == (5, 2, 2)
    assert body["missing_publication_dates"] == 2
    assert body["undated_excluded"] == 0
    assert sum(b["count"] for b in body["bias_distribution"]) == 5
    assert sum(b["percentage"] for b in body["bias_distribution"]) == 100
    assert body["bias_distribution"][-1] == {
        "label": "unclassified", "count": 2, "percentage": 40,
    }
    assert sum(p["article_count"] for p in body["publishers"]) == 5
    assert body["publishers"][0]["source_name"] == "alpha"
    for publisher in body["publishers"]:
        assert sum(b["count"] for b in publisher["bias_distribution"]) == publisher["article_count"]


def test_inclusive_single_day_excludes_undated(client, analytics_db):
    # SQLite strips the offset; inspect bound datetimes separately to verify timezone.
    bounds = []

    def capture(conn, clause, multiparams, params, options):
        bounds.extend(v for v in clause.compile().params.values() if isinstance(v, datetime))

    event.listen(analytics_db.bind, "before_execute", capture)
    body = client.get("/api/analytics/overview?date_from=2026-09-01&date_to=2026-09-01").json()
    assert body["total_articles"] == 2
    assert body["total_events"] == 1
    assert body["undated_excluded"] == 2
    assert body["missing_publication_dates"] == 0
    assert bounds and all(value.utcoffset().total_seconds() == 19800 for value in bounds)


def test_combined_filters_and_repeated_sources(client, analytics_db):
    body = client.get(
        "/api/analytics/overview?source=alpha&source=beta&source=alpha"
        "&bias_label=center&date_to=2026-09-01"
    ).json()
    assert body["sources"] == ["alpha", "beta"]
    assert body["total_articles"] == 1
    assert body["publishers"][0]["source_name"] == "alpha"
    assert body["undated_excluded"] == 0


def test_source_filter_limits_missing_date_count(client, analytics_db):
    body = client.get("/api/analytics/overview?source=alpha&date_from=2026-09-01").json()
    assert body["total_articles"] == 2
    assert body["undated_excluded"] == 1


def test_empty_result_has_zero_buckets(client, analytics_db):
    body = client.get("/api/analytics/overview?source=missing").json()
    assert body["total_articles"] == 0
    assert body["publishers"] == []
    assert len(body["bias_distribution"]) == 6
    assert all(b["count"] == b["percentage"] == 0 for b in body["bias_distribution"])


@pytest.mark.parametrize("query", [
    "date_from=2026-09-02&date_to=2026-09-01", "date_from=bad", "bias_label=made_up",
])
def test_invalid_filters_return_validation_error(client, analytics_db, query):
    assert client.get(f"/api/analytics/overview?{query}").status_code == 422
