import os
from pydantic_settings import BaseSettings

APP_NAME = os.getenv("APP_NAME", "Gestion AO")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/postgres")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

ONLYOFFICE_URL = os.getenv("ONLYOFFICE_URL", "http://localhost:8082")
PUBLIC_ONLYOFFICE_URL = os.getenv("PUBLIC_ONLYOFFICE_URL", ONLYOFFICE_URL)
ONLYOFFICE_JWT = os.getenv("ONLYOFFICE_JWT", JWT_SECRET)
INTERNAL_BACKEND_URL = os.getenv("INTERNAL_BACKEND_URL", "http://localhost:8000")

# OpenAI / LLM configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "")

class Settings(BaseSettings):
    # Base de données SQLite
    DATABASE_URL: str = "sqlite:///./dev.db"

settings = Settings()

