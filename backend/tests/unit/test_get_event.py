"""Unit tests for GET /api/events/{event_id}.

Similar shape to test_get_article.py's 404/found/lookup pattern, but this
route also computes a bias_distribution from the articles it fetches —
via the real _build_bias_distribution function (not mocked), so these
fake articles need real bias_label values for that to mean anything.
"""
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock

EVENT_ID = "11111111-1111-1111-1111-111111111111"


def make_fake_event(**overrides):
    defaults = dict(
        event_id=EVENT_ID,
        summary="A summary",
        topic="politics",
        article_count=2,
        source_count=2,
        window_start=datetime(2026, 9, 1, tzinfo=timezone.utc),
        window_end=datetime(2026, 9, 2, tzinfo=timezone.utc),
    )
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def make_fake_article(**overrides):
    defaults = dict(
        article_id="a1",
        source_name="BBC",
        url="https://example.com/a1",
        title="Test Headline",
        body="Body text.",
        published_at=datetime(2026, 9, 1, tzinfo=timezone.utc),
        bias_label="left",
        bias_confidence=0.6,
        bias_scores=None,
    )
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def test_returns_404_when_event_not_found(client, override_get_db):
    fake_db = MagicMock()
    fake_db.get.return_value = None
    override_get_db(fake_db)

    response = client.get(f"/api/events/{EVENT_ID}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Event not found"}


def test_returns_event_detail_with_articles_and_bias_distribution(client, override_get_db):
    fake_db = MagicMock()
    fake_db.get.return_value = make_fake_event()
    fake_db.scalars.return_value = [
        make_fake_article(article_id="a1", bias_label="left"),
        make_fake_article(article_id="a2", bias_label="left"),
        make_fake_article(article_id="a3", bias_label="right"),
    ]
    override_get_db(fake_db)

    response = client.get(f"/api/events/{EVENT_ID}")

    assert response.status_code == 200
    body = response.json()
    assert [a["article_id"] for a in body["articles"]] == ["a1", "a2", "a3"]
    # _build_bias_distribution runs for real here — this locks in that the
    # route actually wires its output into the response correctly.
    assert body["bias_distribution"]["left"] == 2
    assert body["bias_distribution"]["right"] == 1
    assert body["bias_distribution"]["center"] == 0


def test_looks_up_the_requested_event_id(client, override_get_db):
    fake_db = MagicMock()
    fake_db.get.return_value = make_fake_event()
    fake_db.scalars.return_value = []
    override_get_db(fake_db)

    client.get(f"/api/events/{EVENT_ID}")

    fake_db.get.assert_called_once()
    _model, event_id = fake_db.get.call_args.args
    assert event_id == EVENT_ID
