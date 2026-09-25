"""Tests for the CORS configuration wired up in app/main.py.

CORS is enforced by the *browser*, not the server rejecting requests —
the server's only job is deciding whether to include an
Access-Control-Allow-Origin header telling the browser "JavaScript on
this origin is allowed to read this response." These tests check exactly
that: present and correct for an allowed origin, genuinely absent for a
disallowed one.
"""
from app.core.config import get_settings


def test_allowed_origin_gets_the_cors_header_back(client):
    allowed_origin = get_settings().cors_origin_list[0]

    response = client.get("/api/health", headers={"Origin": allowed_origin})

    assert response.headers.get("access-control-allow-origin") == allowed_origin


def test_disallowed_origin_gets_no_cors_header(client):
    response = client.get("/api/health", headers={"Origin": "https://evil.example.com"})

    # Note this is NOT a 403 — the request still succeeds at the server
    # level. The browser is what actually blocks the frontend JS from
    # reading the response, based on this header being absent.
    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers


def test_preflight_request_allows_the_custom_admin_header(client):
    """The frontend's admin calls send a custom X-API-Key header, which
    triggers a CORS "preflight" OPTIONS request before the browser will
    send the real one. This confirms that preflight actually succeeds for
    an allowed origin requesting that header."""
    allowed_origin = get_settings().cors_origin_list[0]

    response = client.options(
        "/api/admin/pipeline/trigger",
        headers={
            "Origin": allowed_origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "X-API-Key",
        },
    )

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == allowed_origin
    assert "x-api-key" in response.headers.get("access-control-allow-headers", "").lower()
