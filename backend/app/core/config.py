import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Application settings
    APP_NAME: str = "Gestion AO"
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/postgres"
    REDIS_URL: str = "redis://redis:6379/0"
    JWT_SECRET: str = "change-me"
    
    # OnlyOffice settings
    ONLYOFFICE_URL: str = "http://localhost:8082"
    PUBLIC_ONLYOFFICE_URL: str = ""
    ONLYOFFICE_JWT: str = ""
    INTERNAL_BACKEND_URL: str = "http://localhost:8000"
    
    # OpenAI / LLM configuration
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_BASE_URL: str = "OPENAI_API_KEY=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"
    
    # Database settings
    DATABASE_URL: str = "sqlite:///./dev.db"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# Set default values for URLs that depend on other settings
if not settings.PUBLIC_ONLYOFFICE_URL:
    settings.PUBLIC_ONLYOFFICE_URL = settings.ONLYOFFICE_URL
    
if not settings.ONLYOFFICE_JWT:
    settings.ONLYOFFICE_JWT = settings.JWT_SECRET

