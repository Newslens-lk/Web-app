"""Shared helpers for building real rows in integration tests.

Not a conftest.py fixture on purpose — these take explicit arguments
(a session, field overrides), so a plain function is simpler to call than
a fixture would be.
"""
from app.models.article import Article
from app.models.source import Source


def make_source(db_session, name="BBC"):
    source = Source(source_name=name, source_type="news")
    db_session.add(source)
    db_session.flush()  # sends the INSERT to Postgres without committing
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
