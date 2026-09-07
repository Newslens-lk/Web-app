"""Unit tests for GET /api/sources (list_sources).

The one thing worth locking in here: the query uses an OUTER join between
sources and articles, specifically so a source with zero articles still
shows up (with article_count: 0) instead of disappearing. An INNER join
would silently drop it — that's the regression these tests guard against.
"""
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock


def make_fake_row(source_name, source_type="news", article_count=0, latest_article_at=None):
    return SimpleNamespace(
        source_name=source_name,
        source_type=source_type,
        article_count=article_count,
        latest_article_at=latest_article_at,
    )


def make_fake_db(rows):
    fake_db = MagicMock()
    fake_db.execute.return_value.all.return_value = rows
    return fake_db


def test_returns_empty_list_when_no_sources_exist(client, override_get_db):
    override_get_db(make_fake_db([]))

    response = client.get("/api/sources")

    assert response.status_code == 200
    assert response.json() == {"sources": []}


def test_includes_a_source_with_zero_articles(client, override_get_db):
    row = make_fake_row("NewPaper", article_count=0, latest_article_at=None)
    override_get_db(make_fake_db([row]))

    response = client.get("/api/sources")

    body = response.json()["sources"]
    assert len(body) == 1
    assert body[0]["source_name"] == "NewPaper"
    assert body[0]["article_count"] == 0
    assert body[0]["latest_article_at"] is None


def test_multiple_sources_are_all_returned_with_correct_fields(client, override_get_db):
    rows = [
        make_fake_row(
            "BBC", article_count=42,
            latest_article_at=datetime(2026, 9, 6, tzinfo=timezone.utc),
        ),
        make_fake_row("CNN", article_count=10, latest_article_at=None),
    ]
    override_get_db(make_fake_db(rows))

    response = client.get("/api/sources")

    body = response.json()["sources"]
    assert [s["source_name"] for s in body] == ["BBC", "CNN"]
    assert body[0]["article_count"] == 42
    assert body[1]["article_count"] == 10


def test_query_uses_a_left_outer_join_not_an_inner_join(client, override_get_db):
    fake_db = make_fake_db([])
    override_get_db(fake_db)

    client.get("/api/sources")

    stmt = fake_db.execute.call_args.args[0]
    compiled_sql = str(stmt.compile()).upper()

    # An INNER join would silently drop sources with zero articles — this
    # is the one regression this test file exists to catch.
    assert "LEFT OUTER JOIN" in compiled_sql
