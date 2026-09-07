"""End-to-end integration test for GET /api/articles/{id}/similar.

This is the one piece of business logic no mocked unit test could ever
verify: does the real pgvector <-> distance query actually return the
genuinely-closest article first? tests/unit/test_similar_articles.py only
proved the route *shapes* whatever rows come back correctly — it never
touched real vector math.

Uses the real FastAPI app (via `client`) wired to a real database session
(via `db_session`) — combining fixtures from both tests/conftest.py and
tests/integration/conftest.py.
"""
import pytest
from sqlalchemy import text

from app.models.article import EMBEDDING_DIMENSION
from tests.integration.factories import make_article, make_source

pytestmark = pytest.mark.integration


def test_similar_articles_ranks_the_closest_embedding_first(client, override_get_db, db_session):
    make_source(db_session)

    # Three articles with deliberately, unambiguously different distances
    # from the "source" article — this isn't testing precise numbers, just
    # that closer-in-vector-space genuinely means "ranked first."
    source_embedding = [0.0] * EMBEDDING_DIMENSION
    source_embedding[0] = 1.0

    close_embedding = list(source_embedding)
    close_embedding[1] = 0.1  # tiny nudge -> small L2 distance from source

    far_embedding = [0.5] * EMBEDDING_DIMENSION  # every dimension off -> large L2 distance

    make_article(
        db_session, article_id="source", url="https://example.com/source",
        embedding=source_embedding,
    )
    make_article(
        db_session, article_id="close", url="https://example.com/close",
        embedding=close_embedding,
    )
    make_article(
        db_session, article_id="far", url="https://example.com/far",
        embedding=far_embedding,
    )
    make_article(
        db_session, article_id="no-embedding", url="https://example.com/none",
        embedding=None,
    )

    # KNOWN LIMITATION (flagged in the test plan, §3.1.4): the ivfflat index
    # on `embedding` was built while the articles table was empty, so its
    # clusters are essentially meaningless, and Postgres defaults to
    # probing just 1 of them (`ivfflat.probes`). On a real, populated table
    # this trades recall for speed on purpose — but it makes correctness
    # *tests* unreliable, since a real nearest neighbor could easily be
    # skipped over. Forcing every list to be probed makes this specific
    # test deterministic without changing anything about production
    # behavior (this only affects the current test transaction).
    db_session.execute(text("SET LOCAL ivfflat.probes = 100"))

    override_get_db(db_session)

    response = client.get("/api/articles/source/similar")

    assert response.status_code == 200
    results = response.json()["similar_articles"]
    ids = [r["article_id"] for r in results]

    assert "source" not in ids  # never ranked as similar to itself
    assert "no-embedding" not in ids  # nothing to compare, correctly excluded
    assert ids[0] == "close"  # the genuinely closer article is ranked first
    assert results[0]["distance"] < results[1]["distance"]
