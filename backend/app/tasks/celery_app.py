import os
from celery import Celery
broker = os.getenv("REDIS_URL", "redis://redis:6379/0")
celery_app = Celery("gestion_ao", broker=broker, backend=broker)

