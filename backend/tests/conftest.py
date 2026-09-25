"""Shared pytest fixtures for the backend test suite."""
import pytest
from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def override_get_db():
    """Install a fake object in place of a real DB session for one test.

    FastAPI resolves `Depends(get_db)` by calling `get_db` and using whatever
    it yields. `app.dependency_overrides` lets a test swap that callable for
    one returning a fake session instead — no real database involved, and no
    network/Postgres/pgvector needed for route-logic tests.

    Usage:
        def test_x(client, override_get_db):
            fake_db = MagicMock()
            fake_db.get.return_value = None
            override_get_db(fake_db)
            response = client.get("/api/articles/whatever")
    """

    def _install(fake_session):
        app.dependency_overrides[get_db] = lambda: fake_session

    yield _install

    # Always undo the override, even if the test fails, so a later test
    # doesn't accidentally run against a fake session meant for this one.
    app.dependency_overrides.pop(get_db, None)
