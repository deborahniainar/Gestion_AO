from .celery_app import celery_app
@celery_app.task
def example_task(x: int) -> int:
    return x * 2

