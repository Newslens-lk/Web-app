"""Integration tests for the Article/Source models against a REAL
Postgres+pgvector database.

Everything in tests/unit/ mocked the database away entirely — good for
testing route logic fast, but none of it proves the actual SQL, the real
constraints, or the pgvector column genuinely work. That's what this file
is for: it's slower and needs Docker running, but it's the only place in
the suite that would catch a real schema mismatch, a broken constraint,
or a pgvector round-trip bug.

Run just this file with:  pytest -m integration
Skip it (e.g. no Docker):  pytest -m "not integration"
"""
import pytest
from sqlalchemy.exc import IntegrityError

from app.models.article import EMBEDDING_DIMENSION, Article
from app.models.source import Source

pytestmark = pytest.mark.integration


def make_source(db_session, name="BBC"):
    source = Source(source_name=name, source_type="news")
    db_session.add(source)
    db_session.flush()  # sends the INSERT to Postgres, without committing
    return source


def make_article(db_session, **overrides):
    defaults = dict(
        article_id="int-test-a1",
        source_name="BBC",
        url="https://example.com/int-test-a1",
        title="Integration Test Headline",
        body="Body text.",
        language="en",
    )
    defaults.update(overrides)
    article = Article(**defaults)
    db_session.add(article)
    db_session.flush()
    return article


def test_insert_and_read_back_an_article(db_session):
    make_source(db_session)
    make_article(db_session)

    # A fresh lookup by primary key, exactly like Session.get() in
    # app/api/articles.py's get_article route.
    found = db_session.get(Article, "int-test-a1")

    assert found is not None
    assert found.title == "Integration Test Headline"
    assert found.source_name == "BBC"


def test_duplicate_url_is_rejected_by_the_unique_constraint(db_session):
    make_source(db_session)
    make_article(db_session, article_id="int-test-a1", url="https://example.com/dup")

    with pytest.raises(IntegrityError):
        make_article(db_session, article_id="int-test-a2", url="https://example.com/dup")


def test_article_cannot_reference_a_nonexistent_source(db_session):
    # No Source row created first — the foreign key on source_name should
    # reject this at the database level, not just in application code.
    with pytest.raises(IntegrityError):
        make_article(db_session, source_name="DoesNotExist")


def test_embedding_vector_round_trips_correctly(db_session):
    make_source(db_session)
    embedding = [0.0] * EMBEDDING_DIMENSION
    embedding[0] = 0.5
    embedding[1] = -0.25

    make_article(db_session, embedding=embedding)

    found = db_session.get(Article, "int-test-a1")

    # pgvector returns a numpy-like sequence, not a plain list — comparing
    # element-by-element (with a tolerance) avoids depending on exactly
    # what Python type pgvector.sqlalchemy hands back.
    assert len(found.embedding) == EMBEDDING_DIMENSION
    assert found.embedding[0] == pytest.approx(0.5)
    assert found.embedding[1] == pytest.approx(-0.25)
    assert found.embedding[2] == pytest.approx(0.0)
