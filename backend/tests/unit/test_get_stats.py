"""Unit tests for GET /api/stats (get_stats).

The route makes 5 separate db.scalar() calls (in a fixed order) plus 2
db.execute() calls, then calls _get_last_pipeline_run() for the Airflow
part. The Airflow call is patched out directly rather than mocking
httpx here too — that piece already has its own dedicated tests in
test_get_last_pipeline_run.py, so this file only needs to prove get_stats
wires everything together correctly.
"""
from unittest.mock import MagicMock

from app.api import stats as stats_module


def make_execute_result(rows):
    result = MagicMock()
    result.all.return_value = rows
    return result


def make_fake_db(counts, bias_rows, source_rows):
    """counts: the 5 db.scalar() return values, in the exact order
    get_stats calls them: total_articles, total_events, total_sources,
    articles_today, events_today."""
    fake_db = MagicMock()
    fake_db.scalar.side_effect = counts
    fake_db.execute.side_effect = [
        make_execute_result(bias_rows),
        make_execute_result(source_rows),
    ]
    return fake_db


def test_returns_all_counts_and_breakdowns_correctly(client, override_get_db, monkeypatch):
    monkeypatch.setattr(stats_module, "_get_last_pipeline_run", lambda: None)
    fake_db = make_fake_db(
        counts=[100, 10, 5, 3, 1],
        bias_rows=[("left", 5), ("right", 3)],
        source_rows=[("BBC", 50), ("CNN", 50)],
    )
    override_get_db(fake_db)

    response = client.get("/api/stats")

    body = response.json()
    assert body["total_articles"] == 100
    assert body["total_events"] == 10
    assert body["total_sources"] == 5
    assert body["articles_today"] == 3
    assert body["events_today"] == 1
    assert body["bias_breakdown"] == {"left": 5, "right": 3}
    assert body["articles_per_source"] == {"BBC": 50, "CNN": 50}


def test_counts_fall_back_to_zero_when_scalar_returns_none(client, override_get_db, monkeypatch):
    monkeypatch.setattr(stats_module, "_get_last_pipeline_run", lambda: None)
    fake_db = make_fake_db(counts=[None, None, None, None, None], bias_rows=[], source_rows=[])
    override_get_db(fake_db)

    response = client.get("/api/stats")

    body = response.json()
    assert body["total_articles"] == 0
    assert body["events_today"] == 0


def test_includes_last_pipeline_run_when_airflow_is_reachable(client, override_get_db, monkeypatch):
    monkeypatch.setattr(
        stats_module, "_get_last_pipeline_run", lambda: "2026-09-06T10:00:00+00:00"
    )
    override_get_db(make_fake_db(counts=[0, 0, 0, 0, 0], bias_rows=[], source_rows=[]))

    response = client.get("/api/stats")

    assert response.json()["last_pipeline_run"] == "2026-09-06T10:00:00+00:00"


def test_last_pipeline_run_is_null_when_airflow_is_unreachable(client, override_get_db, monkeypatch):
    monkeypatch.setattr(stats_module, "_get_last_pipeline_run", lambda: None)
    override_get_db(make_fake_db(counts=[0, 0, 0, 0, 0], bias_rows=[], source_rows=[]))

    response = client.get("/api/stats")

    assert response.json()["last_pipeline_run"] is None
