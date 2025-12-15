"""Celery application configuration."""

from celery import Celery
from src.config import settings

# Create Celery app
celery_app = Celery(
    "finopt",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "src.infrastructure.workers.tasks.import_tasks",
        "src.infrastructure.workers.tasks.insight_tasks",
        "src.infrastructure.workers.tasks.budget_tasks",
    ],
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes
    task_soft_time_limit=240,  # 4 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Task routes
celery_app.conf.task_routes = {
    "src.infrastructure.workers.tasks.import_tasks.*": {"queue": "import"},
    "src.infrastructure.workers.tasks.insight_tasks.*": {"queue": "insights"},
    "src.infrastructure.workers.tasks.budget_tasks.*": {"queue": "budgets"},
}
