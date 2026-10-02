"""Exercise real aggregate queries against a small isolated article table."""

from datetime import datetime
from types import SimpleNamespace

import pytest
from sqlalchemy import Column, DateTime, Float, MetaData, String, Table, create_engine, event
from sqlalchemy import text
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
        Column("bias_confidence", Float), Column("language", String), Column("title", String),
    )
    metadata.create_all(engine)
    with Session(engine) as db:
        rows = [
            ("1", "alpha", "left", datetime(2026, 9, 1, 0, 0), "00000000-0000-0000-0000-000000000001", 0.95, "en", "Budget passes"),
            ("2", "alpha", " CENTER ", datetime(2026, 9, 1, 23, 59, 59, 999999), "00000000-0000-0000-0000-000000000001", 0.5, "EN ", "Budget later"),
            ("3", "beta", "right", datetime(2026, 9, 2), "00000000-0000-0000-0000-000000000001", 1.0, "si", "Budget slammed"),
            ("4", "beta", None, None, "00000000-0000-0000-0000-000000000002", None, None, "Rain"),
            ("5", "alpha", "unknown", None, None, 0.2, "en", "Misc"),
        ]
        db.execute(articles.insert(), [dict(zip(
            ("article_id", "source_name", "bias_label", "published_at", "event_id",
             "bias_confidence", "language", "title"), row,
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


def test_insights_category_totals(client, analytics_db):
    response = client.get("/api/analytics/insights")
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    body = response.json()
    assert body["total_articles"] == 5
    assert {c["label"]: c["count"] for c in body["categories"]} == {
        "far_left": 0, "left": 1, "center": 1, "right": 1, "far_right": 0, "unclassified": 2,
    }


def test_insights_timeline_fills_empty_weeks_and_skips_undated(client, analytics_db):
    analytics_db.execute(text(
        "INSERT INTO articles VALUES ('7','alpha','left','2026-09-21 00:00:00','00000000-0000-0000-0000-000000000003',0.7,'en','T7')"
    ))
    analytics_db.commit()
    timeline = client.get("/api/analytics/insights").json()["timeline"]
    assert [w["week_start"] for w in timeline] == ["2026-08-31", "2026-09-07", "2026-09-14", "2026-09-21"]
    assert [w["total"] for w in timeline] == [3, 0, 0, 1]
    assert timeline[0]["counts"]["left"] == 1


def test_insights_languages_and_freshness(client, analytics_db):
    body = client.get("/api/analytics/insights").json()
    assert {row["language"]: row["count"] for row in body["languages"]} == {"en": 3, "si": 1, "unknown": 1}
    alpha, beta = body["publishers"]
    assert (alpha["source_name"], alpha["dated_articles"], alpha["latest_published"]) == ("alpha", 2, "2026-09-01")
    assert (beta["article_count"], beta["dated_articles"]) == (2, 1)


def test_insights_respects_filters_and_validation(client, analytics_db):
    assert client.get("/api/analytics/insights?source=beta").json()["total_articles"] == 2
    assert client.get("/api/analytics/insights?date_from=2026-09-02&date_to=2026-09-01").status_code == 422


def test_stories_rank_shared_events_by_spread(client, analytics_db):
    body = client.get("/api/analytics/stories").json()
    assert (body["shared_events"], body["unanimous_events"]) == (1, 0)
    story = body["stories"][0]
    assert story["headline"] == "Budget passes"  # earliest article names the story
    assert story["spread"] == 1.5  # alpha averages -0.5 (left, center), beta is +1
    assert [(d["source_name"], d["lean"], d["articles"]) for d in story["dots"]] == [
        ("alpha", -0.5, 2), ("beta", 1.0, 1),
    ]
    assert body["pairs"] == [{"source_a": "alpha", "source_b": "beta", "shared_events": 1, "differing_events": 1, "mean_gap": 1.5}]


def test_stories_ignore_unclassified_and_single_publisher_events(client, analytics_db):
    analytics_db.execute(text(
        "INSERT INTO articles VALUES ('8','gamma','unknown','2026-09-03 00:00:00','00000000-0000-0000-0000-000000000001',0.9,'en','Noise')"
    ))
    analytics_db.commit()
    body = client.get("/api/analytics/stories").json()
    assert [d["source_name"] for d in body["stories"][0]["dots"]] == ["alpha", "beta"]
    assert client.get("/api/analytics/stories?source=alpha").json()["shared_events"] == 0


def test_stories_validation(client, analytics_db):
    assert client.get("/api/analytics/stories?limit=0").status_code == 422
    assert client.get("/api/analytics/stories?date_from=2026-09-02&date_to=2026-09-01").status_code == 422
