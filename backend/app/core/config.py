import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Application settings
    APP_NAME: str = "Gestion AO"
    REDIS_URL: str = "redis://redis:6379/0"
    JWT_SECRET: str = "change-me"
    
    # OpenAI / LLM configuration
    OPENAI_API_KEY: str = "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"
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    
    # Database settings
    DATABASE_URL: str = "sqlite:///./dev.db"

    # OnlyOffice Document Server URL (e.g., http://localhost:8080 or https://onlyoffice.example.com)
    ONLYOFFICE_DS_URL: str = "http://localhost:8080"
    # Public backend base URL (reachable by OnlyOffice DS) e.g., http://localhost:8000
    # For local Docker-based OnlyOffice, host.docker.internal often resolves to the host machine from the container.
    # If that doesn't work in your environment, set BACKEND_PUBLIC_URL explicitly in backend/.env to an IP or ngrok URL.
    BACKEND_PUBLIC_URL: str = "http://host.docker.internal:8000"

    # Optional: enable JWT for OnlyOffice Document Server if your DS is configured to require it
    ONLYOFFICE_JWT_ENABLED: bool = True
    ONLYOFFICE_JWT_SECRET: str = os.environ.get('ONLYOFFICE_JWT_SECRET', 'change-me-onlyoffice')
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()