import uuid
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.api.v1.events import build_bias_comparison
from app.db.session import SessionLocal
from app.main import app
from app.models.article import Article
from app.models.event import Event
from app.models.source import Source

client = TestClient(app)


@pytest.fixture
def seeded_event() -> uuid.UUID:
    event_id = uuid.uuid4()
    now = datetime.now(UTC)
    source_name = f"test-source-{event_id.hex[:8]}"
    article_id = f"test-article-{event_id.hex[:8]}"

    db = SessionLocal()
    try:
        db.add(Source(source_name=source_name, source_type="html"))
        db.commit()

        db.add(
            Event(
                event_id=str(event_id),
                summary=None,
                topic=None,
                article_count=1,
                source_count=1,
                window_start=now - timedelta(hours=1),
                window_end=now,
            )
        )
        db.commit()

        db.add(
            Article(
                article_id=article_id,
                source_name=source_name,
                url=f"https://example.com/{article_id}",
                title="Test headline",
                body="Test body content",
                language="si",
                published_at=now,
                event_id=str(event_id),
            )
        )
        db.commit()
        yield event_id
    finally:
        db.query(Article).filter(Article.article_id == article_id).delete()
        db.query(Event).filter(Event.event_id == str(event_id)).delete()
        db.query(Source).filter(Source.source_name == source_name).delete()
        db.commit()
        db.close()


def test_list_events_returns_seeded_event(seeded_event: uuid.UUID) -> None:
    response = client.get("/api/v1/events")
    assert response.status_code == 200
    ids = [row["event_id"] for row in response.json()]
    assert str(seeded_event) in ids


def test_get_event_includes_articles(seeded_event: uuid.UUID) -> None:
    response = client.get(f"/api/v1/events/{seeded_event}")
    assert response.status_code == 200
    body = response.json()
    assert body["event_id"] == str(seeded_event)
    assert len(body["articles"]) == 1
    assert body["articles"][0]["title"] == "Test headline"


def test_get_event_not_found() -> None:
    response = client.get(f"/api/v1/events/{uuid.uuid4()}")
    assert response.status_code == 404


def test_list_articles_filters_by_source(seeded_event: uuid.UUID) -> None:
    db = SessionLocal()
    try:
        article = db.query(Article).filter(Article.event_id == str(seeded_event)).one()
    finally:
        db.close()

    response = client.get("/api/v1/articles", params={"source_name": article.source_name})
    assert response.status_code == 200
    assert all(row["source_name"] == article.source_name for row in response.json())


def test_get_article_not_found() -> None:
    response = client.get("/api/v1/articles/does-not-exist")
    assert response.status_code == 404


def _article(source_name: str, bias_label, bias_confidence) -> SimpleNamespace:
    return SimpleNamespace(
        source_name=source_name,
        bias_label=bias_label,
        bias_confidence=bias_confidence,
    )


def test_build_bias_comparison_overall_and_source_counts() -> None:
    articles = [
        _article("Source A", "left", 0.90),
        _article("Source A", "neutral", 0.80),
        _article("Source A", "neutral", 0.70),
        _article("Source A", "right", 0.88),
        _article("Source B", "left", 0.60),
        _article("Source B", "NEUTRAL", 0.50),  # recognized after normalization
        _article("Source B", None, None),  # missing label -> unknown
        _article("Source C", "right", None),
        _article("Source C", "right", None),
        _article("Source D", "totally-made-up", 0.40),  # unrecognized -> unknown
    ]

    overview, by_source = build_bias_comparison(articles)

    # overall counts
    assert overview.model_dump() == {"left": 2, "neutral": 3, "right": 3, "unknown": 2}
    assert sum(overview.model_dump().values()) == len(articles)
    assert [s.source_name for s in by_source] == ["Source A", "Source B", "Source C", "Source D"]

    sources = {s.source_name: s for s in by_source}

    # source-level counts
    assert sources["Source A"].article_count == 4
    assert sources["Source A"].bias_distribution.model_dump() == {
        "left": 1,
        "neutral": 2,
        "right": 1,
        "unknown": 0,
    }

    # missing / unrecognized labels become "unknown"
    assert sources["Source B"].bias_distribution.model_dump() == {
        "left": 1,
        "neutral": 1,
        "right": 0,
        "unknown": 1,
    }
    assert sources["Source D"].bias_distribution.model_dump() == {
        "left": 0,
        "neutral": 0,
        "right": 0,
        "unknown": 1,
    }

    # average confidence uses only non-null values
    assert sources["Source A"].average_bias_confidence == 0.82
    assert sources["Source B"].average_bias_confidence == 0.55

    # every distribution carries all four keys, zero-filled where needed
    assert sources["Source C"].bias_distribution.model_dump() == {
        "left": 0,
        "neutral": 0,
        "right": 2,
        "unknown": 0,
    }
    # no usable confidence -> None
    assert sources["Source C"].average_bias_confidence is None


def test_build_bias_comparison_empty() -> None:
    overview, by_source = build_bias_comparison([])
    assert overview.model_dump() == {"left": 0, "neutral": 0, "right": 0, "unknown": 0}
    assert by_source == []


@pytest.fixture
def bias_cluster() -> uuid.UUID:
    event_id = uuid.uuid4()
    now = datetime.now(UTC)
    tag = event_id.hex[:8]
    source_a = f"bias-src-a-{tag}"
    source_b = f"bias-src-b-{tag}"
    # (source_name, bias_label, bias_confidence)
    rows = [
        (source_a, "left", 0.90),
        (source_a, "neutral", 0.80),
        (source_a, "neutral", 0.70),
        (source_a, "right", 0.88),
        (source_b, "left", 0.60),
        (source_b, None, None),  # missing label -> unknown
        (source_b, "made-up-label", 0.40),  # unrecognized -> unknown
    ]

    db = SessionLocal()
    try:
        for name in (source_a, source_b):
            db.add(Source(source_name=name, source_type="html"))
        db.commit()

        db.add(
            Event(
                event_id=str(event_id),
                summary="Cluster summary",
                topic="Cluster topic",
                article_count=len(rows),
                source_count=2,
                window_start=now - timedelta(hours=2),
                window_end=now,
            )
        )
        db.commit()

        article_ids = []
        for i, (source_name, label, confidence) in enumerate(rows):
            article_id = f"bias-art-{tag}-{i}"
            article_ids.append(article_id)
            db.add(
                Article(
                    article_id=article_id,
                    source_name=source_name,
                    url=f"https://example.com/{article_id}",
                    title=f"Headline {i}",
                    body="Body content",
                    language="si",
                    published_at=now - timedelta(minutes=len(rows) - i),
                    bias_label=label,
                    bias_confidence=confidence,
                    event_id=str(event_id),
                )
            )
        db.commit()
        yield event_id
    finally:
        db.query(Article).filter(Article.event_id == str(event_id)).delete()
        db.query(Event).filter(Event.event_id == str(event_id)).delete()
        db.query(Source).filter(Source.source_name.in_([source_a, source_b])).delete(
            synchronize_session=False
        )
        db.commit()
        db.close()


def test_get_event_includes_bias_comparison(bias_cluster: uuid.UUID) -> None:
    response = client.get(f"/api/v1/events/{bias_cluster}")
    assert response.status_code == 200
    body = response.json()

    # existing behavior preserved
    assert body["event_id"] == str(bias_cluster)
    assert body["topic"] == "Cluster topic"
    assert body["summary"] == "Cluster summary"
    assert len(body["articles"]) == 7
    assert {"title", "source_name", "url", "bias_label", "bias_confidence"} <= body["articles"][
        0
    ].keys()

    # overall counts
    assert body["bias_overview"] == {"left": 2, "neutral": 2, "right": 1, "unknown": 2}

    tag = bias_cluster.hex[:8]
    comparison = {s["source_name"]: s for s in body["source_bias_comparison"]}
    assert set(comparison) == {f"bias-src-a-{tag}", f"bias-src-b-{tag}"}

    src_a = comparison[f"bias-src-a-{tag}"]
    src_b = comparison[f"bias-src-b-{tag}"]

    # source-level counts
    assert src_a["article_count"] == 4
    assert src_a["bias_distribution"] == {"left": 1, "neutral": 2, "right": 1, "unknown": 0}

    # missing / unrecognized labels become "unknown", all four keys present (zero-filled)
    assert src_b["bias_distribution"] == {"left": 1, "neutral": 0, "right": 0, "unknown": 2}

    # average confidence from non-null values only
    assert src_a["average_bias_confidence"] == 0.82
    assert src_b["average_bias_confidence"] == 0.5
