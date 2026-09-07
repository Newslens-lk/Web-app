"""Unit tests for app.api.stats._get_last_pipeline_run.

This helper calls Airflow's HTTP API directly (module-level `httpx.get`,
not injected via FastAPI's dependency system) and deliberately swallows
`httpx.HTTPError` so a stats-page request never fails just because
Airflow happens to be down. Tested here as a plain function, same
philosophy as verify_admin in test_admin_auth.py — fastest, most
isolated way to test this specific piece of logic.
"""
import httpx
import pytest

from app.api import stats as stats_module
from app.api.stats import _get_last_pipeline_run


class FakeResponse:
    def __init__(self, is_success, json_data=None):
        self.is_success = is_success
        self._json_data = json_data or {}

    def json(self):
        return self._json_data


def test_returns_start_date_of_most_recent_run(monkeypatch):
    fake_response = FakeResponse(
        is_success=True,
        json_data={"dag_runs": [{"start_date": "2026-09-06T10:00:00+00:00"}]},
    )
    monkeypatch.setattr(stats_module.httpx, "get", lambda *a, **kw: fake_response)

    result = _get_last_pipeline_run()

    assert result == "2026-09-06T10:00:00+00:00"


def test_returns_none_when_no_dag_runs_exist_yet(monkeypatch):
    fake_response = FakeResponse(is_success=True, json_data={"dag_runs": []})
    monkeypatch.setattr(stats_module.httpx, "get", lambda *a, **kw: fake_response)

    assert _get_last_pipeline_run() is None


def test_returns_none_when_airflow_responds_with_failure(monkeypatch):
    fake_response = FakeResponse(is_success=False)
    monkeypatch.setattr(stats_module.httpx, "get", lambda *a, **kw: fake_response)

    assert _get_last_pipeline_run() is None


def test_returns_none_when_airflow_is_unreachable(monkeypatch):
    def raise_connection_error(*args, **kwargs):
        raise httpx.ConnectError("connection refused")

    monkeypatch.setattr(stats_module.httpx, "get", raise_connection_error)

    # The whole point of the try/except in the real function: a network
    # failure must not propagate up and break the /api/stats endpoint.
    assert _get_last_pipeline_run() is None
