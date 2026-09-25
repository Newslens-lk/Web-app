from collections.abc import Iterator
from contextlib import contextmanager

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.auth import require_admin
from app.core.config import get_settings
from app.schemas.admin import (
    PipelineRun,
    PipelineStatusResponse,
    PipelineTriggerResponse,
    TaskStatus,
)

router = APIRouter(prefix="/admin", tags=["admin"])
settings = get_settings()


@contextmanager
def _airflow_client() -> Iterator[httpx.Client]:
    client = httpx.Client(
        base_url=settings.airflow_base_url,
        timeout=10.0,
    )
    try:
        token_response = client.post(
            "/auth/token",
            json={
                "username": settings.airflow_user,
                "password": settings.airflow_password,
            },
        )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Airflow connection error: {exc}") from exc

    if not token_response.is_success:
        detail = token_response.text[:500]
        raise HTTPException(
            status_code=502,
            detail=f"Airflow authentication failed ({token_response.status_code}): {detail}",
        )

    access_token = token_response.json().get("access_token")
    if not access_token:
        raise HTTPException(status_code=502, detail="Airflow did not return an access token")

    client.headers["Authorization"] = f"Bearer {access_token}"
    try:
        yield client
    finally:
        client.close()


@router.post(
    "/pipeline/trigger",
    response_model=PipelineTriggerResponse,
    dependencies=[Depends(require_admin)],
)
def trigger_pipeline() -> PipelineTriggerResponse:
    with _airflow_client() as client:
        resp = client.post(
            "/api/v2/dags/news_event_pipeline/dagRuns",
            json={"logical_date": None, "conf": {}},
        )
        if not resp.is_success:
            raise HTTPException(status_code=502, detail=f"Airflow error: {resp.text}")
        data = resp.json()
        return PipelineTriggerResponse(
            dag_run_id=data["dag_run_id"],
            state=data.get("state") or "queued",
            logical_date=data.get("logical_date") or "",
        )


def _fetch_tasks(client: httpx.Client, dag_run_id: str) -> list[TaskStatus]:
    resp = client.get(
        f"/api/v2/dags/news_event_pipeline/dagRuns/{dag_run_id}/taskInstances"
    )
    if not resp.is_success:
        return []
    tasks = resp.json().get("task_instances", [])
    return [
        TaskStatus(
            task_id=t["task_id"],
            state=t.get("state") or "unknown",
            duration=t.get("duration"),
        )
        for t in tasks
    ]


@router.get(
    "/pipeline/status",
    response_model=PipelineStatusResponse,
    dependencies=[Depends(require_admin)],
)
def pipeline_status() -> PipelineStatusResponse:
    with _airflow_client() as client:
        resp = client.get(
            "/api/v2/dags/news_event_pipeline/dagRuns",
            params={"order_by": "-start_date", "limit": 5},
        )
        if not resp.is_success:
            raise HTTPException(status_code=502, detail=f"Airflow error: {resp.text}")

        runs_data = resp.json().get("dag_runs", [])
        runs = [
            PipelineRun(
                dag_run_id=r["dag_run_id"],
                state=r["state"],
                start_date=r.get("start_date"),
                end_date=r.get("end_date"),
                tasks=_fetch_tasks(client, r["dag_run_id"]),
            )
            for r in runs_data
        ]
        return PipelineStatusResponse(runs=runs)


@router.get(
    "/pipeline/history",
    response_model=PipelineStatusResponse,
    dependencies=[Depends(require_admin)],
)
def pipeline_history(
    limit: int = Query(default=20, ge=1, le=50),
) -> PipelineStatusResponse:
    with _airflow_client() as client:
        resp = client.get(
            "/api/v2/dags/news_event_pipeline/dagRuns",
            params={"order_by": "-start_date", "limit": limit},
        )
        if not resp.is_success:
            raise HTTPException(status_code=502, detail=f"Airflow error: {resp.text}")

        runs_data = resp.json().get("dag_runs", [])
        runs = [
            PipelineRun(
                dag_run_id=r["dag_run_id"],
                state=r["state"],
                start_date=r.get("start_date"),
                end_date=r.get("end_date"),
            )
            for r in runs_data
        ]
        return PipelineStatusResponse(runs=runs)
