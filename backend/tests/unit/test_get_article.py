"""Unit tests for GET /api/articles/{article_id}.

No real database — `get_db` is swapped out (via the `override_get_db` fixture
in tests/conftest.py) for a fake session whose `.get()` we control directly.
This tests only the route's own logic: does it 404 correctly, and does it
shape a found article into the right JSON?
"""
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock


def make_fake_article():
    """A stand-in Article with exactly the attributes ArticleDetail reads.

    ArticleDetail.model_validate() (from_attributes=True) just reads
    attributes off whatever object it's given — it doesn't care that this
    is a SimpleNamespace instead of a real ORM-mapped Article.
    """
    return SimpleNamespace(
        article_id="a1",
        source_name="BBC",
        url="https://example.com/a1",
        title="Test Headline",
        body="Full article body text.",
        language="en",
        published_at=datetime(2026, 9, 1, tzinfo=timezone.utc),
        scraped_at=datetime(2026, 9, 1, 1, tzinfo=timezone.utc),
        bias_label="center",
        bias_confidence=0.82,
        bias_scores={
            "far_left": 0.02,
            "left": 0.10,
            "center": 0.82,
            "right": 0.05,
            "far_right": 0.01,
        },
        event_id=None,
    )


def test_returns_404_when_article_not_found(client, override_get_db):
    fake_db = MagicMock()
    fake_db.get.return_value = None
    override_get_db(fake_db)

    response = client.get("/api/articles/does-not-exist")

    assert response.status_code == 404
    assert response.json() == {"detail": "Article not found"}


def test_returns_full_detail_when_article_found(client, override_get_db):
    fake_db = MagicMock()
    fake_db.get.return_value = make_fake_article()
    override_get_db(fake_db)

    response = client.get("/api/articles/a1")

    assert response.status_code == 200
    body = response.json()
    assert body["article_id"] == "a1"
    assert body["title"] == "Test Headline"
    assert body["bias_scores"]["center"] == 0.82
    assert body["event_id"] is None  # optional field, should serialize as null


def test_looks_up_the_requested_article_id(client, override_get_db):
    """Confirms the path param is actually passed through to db.get(),
    rather than the route ignoring it or hardcoding something."""
    fake_db = MagicMock()
    fake_db.get.return_value = make_fake_article()
    override_get_db(fake_db)

    client.get("/api/articles/a1")

    fake_db.get.assert_called_once()
    _model, article_id = fake_db.get.call_args.args  # db.get(Article, article_id)
    assert article_id == "a1"
