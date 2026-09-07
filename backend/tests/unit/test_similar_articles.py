"""Unit tests for GET /api/articles/{article_id}/similar.

This route does two DB things: a plain db.get() to fetch the source
article, then (if it has an embedding) a raw db.execute(text(...)) for the
pgvector similarity query. Both are faked here — the real vector-distance
math is never exercised by these tests, only the route's own branching
logic (404 / empty-list / shape-the-results).
"""
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock


def make_fake_article(embedding):
    """Only `.embedding` matters to this route — everything else on a
    real Article is irrelevant here."""
    return SimpleNamespace(embedding=embedding)


def make_fake_row(article_id, distance):
    """A stand-in for the raw SQL result row — the route reads these
    fields by attribute, same as a real SQLAlchemy Row would allow."""
    return SimpleNamespace(
        article_id=article_id,
        title=f"Title for {article_id}",
        source_name="BBC",
        published_at=datetime(2026, 9, 1, tzinfo=timezone.utc),
        bias_label="center",
        distance=distance,
    )


def test_returns_404_when_source_article_not_found(client, override_get_db):
    fake_db = MagicMock()
    fake_db.get.return_value = None
    override_get_db(fake_db)

    response = client.get("/api/articles/does-not-exist/similar")

    assert response.status_code == 404
    assert response.json() == {"detail": "Article not found"}


def test_returns_empty_list_when_article_has_no_embedding(client, override_get_db):
    fake_db = MagicMock()
    fake_db.get.return_value = make_fake_article(embedding=None)
    override_get_db(fake_db)

    response = client.get("/api/articles/a1/similar")

    assert response.status_code == 200
    assert response.json() == {"similar_articles": []}
    # No embedding means there's nothing to compare against — the route
    # should short-circuit before ever running the similarity query.
    fake_db.execute.assert_not_called()


def test_returns_similar_articles_shaped_correctly(client, override_get_db):
    fake_db = MagicMock()
    fake_db.get.return_value = make_fake_article(embedding=[0.1, 0.2, 0.3])
    fake_db.execute.return_value.all.return_value = [
        make_fake_row("a2", distance=0.12345),
        make_fake_row("a3", distance=0.5),
    ]
    override_get_db(fake_db)

    response = client.get("/api/articles/a1/similar")

    assert response.status_code == 200
    body = response.json()
    assert [a["article_id"] for a in body["similar_articles"]] == ["a2", "a3"]
    # The route rounds distance to 4 decimal places before returning it.
    assert body["similar_articles"][0]["distance"] == 0.1235


def test_limit_query_param_is_forwarded_to_the_query(client, override_get_db):
    fake_db = MagicMock()
    fake_db.get.return_value = make_fake_article(embedding=[0.1])
    fake_db.execute.return_value.all.return_value = []
    override_get_db(fake_db)

    client.get("/api/articles/a1/similar?limit=10")

    _text_clause, params = fake_db.execute.call_args.args
    assert params["lim"] == 10
    assert params["aid"] == "a1"


def test_default_limit_is_5(client, override_get_db):
    fake_db = MagicMock()
    fake_db.get.return_value = make_fake_article(embedding=[0.1])
    fake_db.execute.return_value.all.return_value = []
    override_get_db(fake_db)

    client.get("/api/articles/a1/similar")

    _text_clause, params = fake_db.execute.call_args.args
    assert params["lim"] == 5


def test_limit_zero_is_rejected_with_422(client):
    response = client.get("/api/articles/a1/similar?limit=0")

    assert response.status_code == 422


def test_limit_over_20_is_rejected_with_422(client):
    response = client.get("/api/articles/a1/similar?limit=21")

    assert response.status_code == 422
