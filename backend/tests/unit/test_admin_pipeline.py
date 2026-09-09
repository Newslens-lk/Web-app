"""Unit tests for the admin pipeline routes' actual business logic —
the "correct key -> talks to Airflow correctly" path that
test_admin_auth.py deliberately left out.

The new technique here: `_airflow_client()` returns an `httpx.Client`
used as a context manager (`with _airflow_client() as client:`). Rather
than mocking httpx.Client itself, we monkeypatch `_airflow_client` to
return a fake object instead — MagicMock supports the `with ... as x:`
protocol automatically once `__enter__`/`__exit__` are configured, so no
real HTTP or real Airflow is involved.
"""
from unittest.mock import MagicMock

import pytest

from app.api import admin as admin_module

FAKE_KEY = "test-secret-key"
AUTH_HEADERS = {"X-API-Key": FAKE_KEY}


class FakeResponse:
    def __init__(self, is_success, json_data=None, text=""):
        self.is_success = is_success
        self._json = json_data or {}
        self.text = text

    def json(self):
        return self._json


@pytest.fixture(autouse=True)
def fixed_admin_key(monkeypatch):
    monkeypatch.setattr(admin_module.settings, "admin_api_key", FAKE_KEY)


def install_fake_airflow_client(monkeypatch, get_side_effect=None, post_side_effect=None):
    """Builds a fake object that behaves like `with _airflow_client() as client:`
    and installs it in place of the real one."""
    fake_client = MagicMock()
    fake_client.__enter__.return_value = fake_client
    fake_client.__exit__.return_value = False
    if get_side_effect is not None:
        fake_client.get.side_effect = get_side_effect
    if post_side_effect is not None:
        fake_client.post.side_effect = post_side_effect

    monkeypatch.setattr(admin_module, "_airflow_client", lambda: fake_client)
    return fake_client


# ---------------------------------------------------------------------------
# POST /api/admin/pipeline/trigger
# ---------------------------------------------------------------------------


def test_trigger_pipeline_returns_dag_run_info_on_success(client, monkeypatch):
    install_fake_airflow_client(
        monkeypatch,
        post_side_effect=[
            FakeResponse(
                is_success=True,
                json_data={
                    "dag_run_id": "run123",
                    "state": "queued",
                    "logical_date": "2026-09-06T10:00:00+00:00",
                },
            )
        ],
    )

    response = client.post("/api/admin/pipeline/trigger", headers=AUTH_HEADERS)

    assert response.status_code == 200
    assert response.json() == {
        "dag_run_id": "run123",
        "state": "queued",
        "logical_date": "2026-09-06T10:00:00+00:00",
    }


def test_trigger_pipeline_returns_502_when_airflow_rejects_it(client, monkeypatch):
    install_fake_airflow_client(
        monkeypatch, post_side_effect=[FakeResponse(is_success=False, text="Bad Request")]
    )

    response = client.post("/api/admin/pipeline/trigger", headers=AUTH_HEADERS)

    assert response.status_code == 502
    assert "Bad Request" in response.json()["detail"]


# ---------------------------------------------------------------------------
# GET /api/admin/pipeline/status
# ---------------------------------------------------------------------------


def test_pipeline_status_includes_tasks_for_each_run(client, monkeypatch):
    dag_runs_response = FakeResponse(
        is_success=True,
        json_data={
            "dag_runs": [
                {"dag_run_id": "run1", "state": "success", "start_date": "t0", "end_date": "t1"}
            ]
        },
    )
    task_instances_response = FakeResponse(
        is_success=True,
        json_data={
            "task_instances": [
                {"task_id": "scrape", "state": "success", "duration": 12.5},
            ]
        },
    )
    # pipeline_status calls client.get() once for the dag runs list, then
    # once more per run (via _fetch_tasks) — two calls total here, in order.
    install_fake_airflow_client(
        monkeypatch, get_side_effect=[dag_runs_response, task_instances_response]
    )

    response = client.get("/api/admin/pipeline/status", headers=AUTH_HEADERS)

    assert response.status_code == 200
    runs = response.json()["runs"]
    assert runs[0]["dag_run_id"] == "run1"
    assert runs[0]["tasks"] == [{"task_id": "scrape", "state": "success", "duration": 12.5}]


def test_pipeline_status_returns_502_when_airflow_rejects_it(client, monkeypatch):
    install_fake_airflow_client(
        monkeypatch, get_side_effect=[FakeResponse(is_success=False, text="Unauthorized")]
    )

    response = client.get("/api/admin/pipeline/status", headers=AUTH_HEADERS)

    assert response.status_code == 502
    assert "Unauthorized" in response.json()["detail"]


def test_pipeline_status_skips_tasks_when_task_fetch_fails(client, monkeypatch):
    """_fetch_tasks itself swallows a failed task-instances call and
    returns an empty list rather than raising — the run itself should
    still come back successfully."""
    dag_runs_response = FakeResponse(
        is_success=True,
        json_data={"dag_runs": [{"dag_run_id": "run1", "state": "success"}]},
    )
    failed_task_fetch = FakeResponse(is_success=False, text="not found")
    install_fake_airflow_client(monkeypatch, get_side_effect=[dag_runs_response, failed_task_fetch])

    response = client.get("/api/admin/pipeline/status", headers=AUTH_HEADERS)

    assert response.status_code == 200
    assert response.json()["runs"][0]["tasks"] == []


# ---------------------------------------------------------------------------
# GET /api/admin/pipeline/history
# ---------------------------------------------------------------------------


def test_pipeline_history_returns_runs_without_fetching_tasks(client, monkeypatch):
    fake_client = install_fake_airflow_client(
        monkeypatch,
        get_side_effect=[
            FakeResponse(
                is_success=True,
                json_data={
                    "dag_runs": [
                        {
                            "dag_run_id": "run1",
                            "state": "success",
                            "start_date": None,
                            "end_date": None,
                        }
                    ]
                },
            )
        ],
    )

    response = client.get("/api/admin/pipeline/history", headers=AUTH_HEADERS)

    assert response.status_code == 200
    assert response.json()["runs"][0]["tasks"] == []
    # Unlike pipeline_status, history never calls _fetch_tasks — only one
    # get() call should have happened.
    assert fake_client.get.call_count == 1


def test_pipeline_history_returns_502_when_airflow_rejects_it(client, monkeypatch):
    install_fake_airflow_client(
        monkeypatch, get_side_effect=[FakeResponse(is_success=False, text="Service Unavailable")]
    )

    response = client.get("/api/admin/pipeline/history", headers=AUTH_HEADERS)

    assert response.status_code == 502
    assert "Service Unavailable" in response.json()["detail"]


def test_pipeline_history_forwards_the_limit_query_param(client, monkeypatch):
    fake_client = install_fake_airflow_client(
        monkeypatch, get_side_effect=[FakeResponse(is_success=True, json_data={"dag_runs": []})]
    )

    client.get("/api/admin/pipeline/history?limit=5", headers=AUTH_HEADERS)

    _args, kwargs = fake_client.get.call_args
    assert kwargs["params"]["limit"] == 5
