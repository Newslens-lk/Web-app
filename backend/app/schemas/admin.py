from pydantic import BaseModel


class PipelineTriggerResponse(BaseModel):
    dag_run_id: str
    state: str
    logical_date: str


class TaskStatus(BaseModel):
    task_id: str
    state: str
    duration: float | None


class PipelineRun(BaseModel):
    dag_run_id: str
    state: str
    start_date: str | None
    end_date: str | None
    tasks: list[TaskStatus] = []


class PipelineStatusResponse(BaseModel):
    runs: list[PipelineRun]
