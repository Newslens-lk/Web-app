"""Verify analytics headlines and ranking against real SQL queries."""

from datetime import datetime
from uuid import UUID

import pytest
from sqlalchemy import Column, DateTime, MetaData, String, Table, Uuid, create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.models.event import Event


@pytest.fixture
def top_events_db(override_get_db):
    engine = create_engine(
        "sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False},
    )
    Event.__table__.create(engine)
    articles = Table(
        "articles", MetaData(),
        Column("article_id", String, primary_key=True), Column("event_id", Uuid),
        Column("title", String), Column("published_at", DateTime),
        Column("bias_label", String),
    )
    articles.create(engine)
    with Session(engine) as db:
        for number, title, count in [(1, None, 40), (2, " Event headline ", 30), (3, "  ", 20)]:
            db.add(Event(
                event_id=UUID(int=number), representative_title=title,
                summary="Long summary text", article_count=count, source_count=2,
            ))
        db.flush()
        db.execute(articles.insert(), [
            dict(article_id="1", event_id=UUID(int=1), title="  ",
                 published_at=None, bias_label=None),
            dict(article_id="2", event_id=UUID(int=2), title="Article headline",
                 published_at=None, bias_label="left"),
            dict(article_id="3", event_id=UUID(int=3), title="Older headline",
                 published_at=datetime(2026, 9, 1), bias_label="right"),
            dict(article_id="4", event_id=UUID(int=3), title=" Newest headline ",
                 published_at=datetime(2026, 9, 2), bias_label=" CENTER "),
            dict(article_id="5", event_id=UUID(int=3), title="",
                 published_at=datetime(2026, 9, 3), bias_label=None),
        ])
        db.commit()
        override_get_db(db)
        yield db
    engine.dispose()


def test_headlines_replace_summaries_and_untitled_entries(client, top_events_db):
    response = client.get("/api/analytics/top-events?limit=2")
    assert response.status_code == 200
    events = response.json()["events"]
    # The titleless highest-ranked event must not consume one of the two slots.
    assert [item["title"] for item in events] == ["Event headline", "Newest headline"]
    assert [item["article_count"] for item in events] == [30, 20]
    assert events[1]["bias_distribution"]["center"] == 1
    assert events[1]["bias_distribution"]["right"] == 1
    assert top_events_db.query(Event).count() == 3


def test_no_titled_events_returns_empty_list(client, top_events_db):
    top_events_db.query(Event).filter(Event.event_id != UUID(int=1)).delete()
    top_events_db.commit()
    assert client.get("/api/analytics/top-events").json() == {"events": []}
