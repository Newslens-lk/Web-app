import pytest
from fastapi import HTTPException

from app.api import admin as admin_module
from app.api.admin import verify_admin

FAKE_KEY = "test-secret-key"

ADMIN_ROUTES = [
    ("post", "/api/admin/pipeline/trigger"),
    ("get", "/api/admin/pipeline/status"),
    ("get", "/api/admin/pipeline/history"),
]


@pytest.fixture(autouse=True)
def fixed_admin_key(monkeypatch):
    """Pin settings.admin_api_key to a known value for every test in this
    file, instead of depending on whatever happens to be in .env — makes
    these tests reproducible regardless of local environment config."""
    monkeypatch.setattr(admin_module.settings, "admin_api_key", FAKE_KEY)



# 1. verify_admin() as a plain function call — no HTTP involved.



def test_verify_admin_passes_silently_with_the_correct_key():
    assert verify_admin(x_api_key=FAKE_KEY) is None


def test_verify_admin_raises_403_with_the_wrong_key():
    with pytest.raises(HTTPException) as exc_info:
        verify_admin(x_api_key="wrong-key")

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Invalid API key"


# 2. Through real HTTP requests — proves the dependency is actually applied to every admin route.



@pytest.mark.parametrize("method, path", ADMIN_ROUTES)
def test_admin_route_rejects_missing_api_key_header(client, method, path):
    response = getattr(client, method)(path)

    # Header() with no default makes x_api_key a *required* header — a
    # request that omits it entirely fails FastAPI's own validation before
    # verify_admin's body ever runs, hence 422, not 403.
    assert response.status_code == 422


@pytest.mark.parametrize("method, path", ADMIN_ROUTES)
def test_admin_route_rejects_wrong_api_key_header(client, method, path):
    response = getattr(client, method)(path, headers={"X-API-Key": "wrong-key"})

    assert response.status_code == 403
    assert response.json() == {"detail": "Invalid API key"}
