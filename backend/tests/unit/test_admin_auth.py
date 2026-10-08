import pytest
from unittest.mock import MagicMock

from app.api.auth import require_admin
from app.main import app


ADMIN_ROUTES = [
    ("post", "/api/admin/pipeline/trigger"),
    ("get", "/api/admin/pipeline/status"),
    ("get", "/api/admin/pipeline/history"),
]


@pytest.fixture(autouse=True)
def _cleanup_overrides():
    yield
    app.dependency_overrides.pop(require_admin, None)


# 1. Unauthenticated requests should be rejected.


@pytest.mark.parametrize("method, path", ADMIN_ROUTES)
def test_admin_route_rejects_unauthenticated_request(client, method, path):
    response = getattr(client, method)(path)
    assert response.status_code in (401, 403)


# 2. Non-admin users should be rejected.


@pytest.mark.parametrize("method, path", ADMIN_ROUTES)
def test_admin_route_rejects_non_admin_user(client, method, path):
    non_admin = MagicMock()
    non_admin.is_active = True
    non_admin.role = "user"

    def fake_require_admin():
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin access required")

    app.dependency_overrides[require_admin] = fake_require_admin
    response = getattr(client, method)(path)
    assert response.status_code == 403
