"""Unit tests for GET /api/events (list_events).

This route is more involved than list_articles: for every event on the
page, it makes an *additional* db.execute() call to fetch that event's
article titles/sources, then derives a "representative title" through a
three-way fallback chain:

    event.summary  ->  first article's title  ->  "Untitled event"

That fallback chain is exactly the kind of branching logic that's easy to
get subtly wrong and easy to test precisely — which is most of what this
file focuses on.
"""
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock

EVENT_ID = "11111111-1111-1111-1111-111111111111"


def make_fake_event(**overrides):
    defaults = dict(
        event_id=EVENT_ID,
        summary=None,
        topic="politics",
        article_count=3,
        source_count=2,
        window_start=datetime(2026, 9, 1, tzinfo=timezone.utc),
        window_end=datetime(2026, 9, 2, tzinfo=timezone.utc),
        created_at=datetime(2026, 9, 2, tzinfo=timezone.utc),
    )
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def make_execute_result(rows):
    """rows: list of (title, source_name) tuples, matching what
    `select(Article.title, Article.source_name)` would return."""
    result = MagicMock()
    result.all.return_value = rows
    return result


def make_fake_db(total, events, rows_per_event):
    """rows_per_event: one rows-list per event, in the same order as
    `events` — the route calls db.execute() once per event on the page."""
    fake_db = MagicMock()
    fake_db.scalar.return_value = total
    fake_db.scalars.return_value = events
    fake_db.execute.side_effect = [make_execute_result(rows) for rows in rows_per_event]
    return fake_db


def test_default_pagination_is_page_1_size_20(client, override_get_db):
    override_get_db(make_fake_db(total=0, events=[], rows_per_event=[]))

    response = client.get("/api/events")

    body = response.json()
    assert body["page"] == 1
    assert body["page_size"] == 20


def test_representative_title_uses_event_summary_when_present(client, override_get_db):
    event = make_fake_event(summary="A real written summary")
    override_get_db(make_fake_db(total=1, events=[event], rows_per_event=[[("Some article title", "BBC")]]))

    response = client.get("/api/events")

    assert response.json()["events"][0]["representative_title"] == "A real written summary"


def test_representative_title_falls_back_to_first_article_when_no_summary(client, override_get_db):
    event = make_fake_event(summary=None)
    rows = [("Newest article title", "BBC"), ("Older article title", "CNN")]
    override_get_db(make_fake_db(total=1, events=[event], rows_per_event=[rows]))

    response = client.get("/api/events")

    # rows are pre-sorted newest-first by the query itself, so rows[0]
    # is what the route should pick.
    assert response.json()["events"][0]["representative_title"] == "Newest article title"


def test_representative_title_falls_back_to_untitled_when_no_summary_and_no_articles(
    client, override_get_db
):
    event = make_fake_event(summary=None)
    override_get_db(make_fake_db(total=1, events=[event], rows_per_event=[[]]))

    response = client.get("/api/events")

    assert response.json()["events"][0]["representative_title"] == "Untitled event"


def test_sources_list_is_deduplicated_and_sorted(client, override_get_db):
    event = make_fake_event()
    rows = [("Title A", "CNN"), ("Title B", "BBC"), ("Title C", "CNN")]
    override_get_db(make_fake_db(total=1, events=[event], rows_per_event=[rows]))

    response = client.get("/api/events")

    assert response.json()["events"][0]["sources"] == ["BBC", "CNN"]


def test_min_sources_filter_is_applied_to_the_query(client, override_get_db):
    fake_db = make_fake_db(total=0, events=[], rows_per_event=[])
    override_get_db(fake_db)

    client.get("/api/events?min_sources=3")

    stmt = fake_db.scalars.call_args.args[0]
    compiled_sql = str(stmt.compile(compile_kwargs={"literal_binds": True}))

    assert "source_count" in compiled_sql
    assert " >= 3" in compiled_sql
