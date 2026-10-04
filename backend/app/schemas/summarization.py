from pydantic import BaseModel


class TopicResponse(BaseModel):
    event_id: str
    topic: str


class SummaryResponse(BaseModel):
    event_id: str
    summary: str
    topic: str | None


class BulkJobResponse(BaseModel):
    job_id: str
    message: str


class BulkJobStatus(BaseModel):
    job_id: str
    status: str
    total: int
    done: int
    failed: int
