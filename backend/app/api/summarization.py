"""Endpoints for event topic assignment and summary generation.

Two separate steps:
  1. Topic assignment  — lightweight (titles only), can run in bulk.
  2. Summary generation — expensive (full bodies), triggered by the user.

Isolated from the rest of the API — no existing endpoints are modified.
"""

import uuid as _uuid
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db, SessionLocal
from app.models.event import Event
from app.schemas.summarization import (
    BulkJobResponse,
    BulkJobStatus,
    SummaryResponse,
    TopicResponse,
)
from app.services.summarizer import (
    assign_topic,
    assign_topics_bulk,
    generate_summary,
)

router = APIRouter(tags=["summarization"])

# In-memory job tracker for background tasks.
_jobs: dict[str, dict] = {}


# -- step 1: topic assignment -------------------------------------------------

@router.post(
    "/events/{event_id}/assign-topic",
    response_model=TopicResponse,
)
def assign_event_topic(
    event_id: UUID,
    db: Session = Depends(get_db),
) -> TopicResponse:
    """Assign a topic label to a single event."""
    try:
        topic = assign_topic(db, event_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return TopicResponse(event_id=str(event_id), topic=topic)


def _run_bulk_topics_job(job_id: str) -> None:
    _jobs[job_id]["status"] = "running"
    db = SessionLocal()
    try:
        result = assign_topics_bulk(db)
        _jobs[job_id].update(
            status="completed",
            total=result["total"],
            done=result["done"],
            failed=result["failed"],
        )
    except Exception as exc:
        _jobs[job_id].update(status="failed", error=str(exc))
    finally:
        db.close()


@router.post(
    "/admin/assign-topics",
    response_model=BulkJobResponse,
)
def bulk_assign_topics(
    background_tasks: BackgroundTasks,
) -> BulkJobResponse:
    """Bulk-assign topics for all events that don't have one yet."""
    job_id = str(_uuid.uuid4())
    _jobs[job_id] = {"status": "queued", "total": 0, "done": 0, "failed": 0}
    background_tasks.add_task(_run_bulk_topics_job, job_id)
    return BulkJobResponse(
        job_id=job_id,
        message="Bulk topic assignment started. Poll /admin/assign-topics/{job_id} for progress.",
    )


@router.get(
    "/admin/assign-topics/{job_id}",
    response_model=BulkJobStatus,
)
def bulk_assign_topics_status(job_id: str) -> BulkJobStatus:
    """Check progress of a bulk topic assignment job."""
    job = _jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return BulkJobStatus(
        job_id=job_id,
        status=job["status"],
        total=job.get("total", 0),
        done=job.get("done", 0),
        failed=job.get("failed", 0),
    )


# -- step 2: summary generation (user-triggered) ------------------------------

@router.post(
    "/events/{event_id}/summarize",
    response_model=SummaryResponse,
)
def summarize_event(
    event_id: UUID,
    db: Session = Depends(get_db),
) -> SummaryResponse:
    """Generate a summary for an event. Called when the user clicks Summarize."""
    event = db.get(Event, str(event_id))
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    # Return cached summary if it exists.
    if event.summary:
        return SummaryResponse(
            event_id=str(event_id),
            summary=event.summary,
            topic=event.topic,
        )

    try:
        summary = generate_summary(db, event_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    # Refresh to get the topic that generate_summary may have also set.
    db.refresh(event)
    return SummaryResponse(
        event_id=str(event_id),
        summary=summary,
        topic=event.topic,
    )


@router.post(
    "/events/{event_id}/resummarize",
    response_model=SummaryResponse,
)
def resummarize_event(
    event_id: UUID,
    db: Session = Depends(get_db),
) -> SummaryResponse:
    """Force re-generate the summary (and topic) for an event."""
    try:
        summary = generate_summary(db, event_id, force=True)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    event = db.get(Event, str(event_id))
    return SummaryResponse(
        event_id=str(event_id),
        summary=summary,
        topic=event.topic if event else None,
    )
