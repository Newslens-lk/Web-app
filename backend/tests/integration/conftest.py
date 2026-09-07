"""Fixtures for integration tests — these hit a REAL Postgres+pgvector
database (news_pipeline_test on localhost:5433), not a fake/mocked one.

Requires: Docker Desktop running, the Data-Pipeline stack up
(`docker compose -p newslens_pipeline up -d` from that project), and
news_pipeline_test already migrated (see backend/README or the session
notes for the one-time setup steps).
"""
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker

# Host-mapped port (5433), because pytest runs on the host, not inside
# Docker — same reasoning as the venv-vs-Docker .env split from earlier.
TEST_DATABASE_URL = "postgresql+psycopg://news:news@localhost:5433/news_pipeline_test"


@pytest.fixture(scope="session")
def engine():
    """One engine for the whole test session — cheap to create, and
    connection pooling means individual tests still get their own
    connections from it."""
    eng = create_engine(TEST_DATABASE_URL)
    try:
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
    except OperationalError as exc:
        pytest.skip(
            f"news_pipeline_test is not reachable at {TEST_DATABASE_URL} — "
            f"is Docker Desktop running and is news-db up? ({exc.__class__.__name__})"
        )
    return eng


@pytest.fixture
def db_session(engine):
    """A real SQLAlchemy session, wrapped in a transaction that's always
    rolled back at the end of the test.

    This is the standard "transaction per test" isolation pattern: every
    test starts from a clean slate and any rows it inserts vanish when the
    test ends — no manual TRUNCATE needed, and tests can't leak data into
    each other even if they don't clean up after themselves explicitly.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()

    yield session

    session.close()
    # If a test triggered a real constraint violation (IntegrityError), the
    # ORM session already invalidated this transaction internally — calling
    # rollback() again would just emit a harmless-but-noisy SAWarning.
    if transaction.is_active:
        transaction.rollback()
    connection.close()
