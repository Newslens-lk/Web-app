import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Query

from app.core.config import get_settings
from app.schemas.admin import (
    PipelineRun,
    PipelineStatusResponse,
    PipelineTriggerResponse,
    TaskStatus,
)

router = APIRouter(prefix="/admin", tags=["admin"])
settings = get_settings()


def verify_admin(x_api_key: str = Header()) -> None:
    if x_api_key != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="Invalid API key")


def _airflow_client() -> httpx.Client:
    return httpx.Client(
        base_url=settings.airflow_base_url,
        auth=(settings.airflow_user, settings.airflow_password),
        timeout=10.0,
    )


@router.post("/pipeline/trigger", response_model=PipelineTriggerResponse, dependencies=[Depends(verify_admin)])
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
            state=data["state"],
            logical_date=data.get("logical_date", ""),
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
            state=t.get("state", "unknown"),
            duration=t.get("duration"),
        )
        for t in tasks
    ]


@router.get("/pipeline/status", response_model=PipelineStatusResponse, dependencies=[Depends(verify_admin)])
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


@router.get("/pipeline/history", response_model=PipelineStatusResponse, dependencies=[Depends(verify_admin)])
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
