import os
from pydantic_settings import BaseSettings

# 🔹 Supprime toutes les variables d'environnement vite_* avant même d'importer Pydantic
for k in list(os.environ.keys()):
    if k.startswith("VITE_"):
        del os.environ[k]

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Gestion AO"
    REDIS_URL: str = "redis://redis:6379/0"
    JWT_SECRET: str = "change-me"

    # OpenAI / LLM
    OPENAI_API_KEY: str = "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"
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"

    # Database
    DATABASE_URL: str = "sqlite:///./dev.db"

    # OnlyOffice
    ONLYOFFICE_DS_URL: str = "http://localhost:8080"
    BACKEND_PUBLIC_URL: str = "http://172.17.0.1:8000"
    ONLYOFFICE_JWT_ENABLED: bool = True
    ONLYOFFICE_JWT_SECRET: str = "supersecretkey123456"

    class Config:
        env_file = None  # 🔹 Plus besoin de .env
        extra = "ignore"  # ignore toutes les variables inconnues

# Instanciation sécurisée
try:
    settings = Settings()
except Exception as e:
    print("⚠️ Erreur lors de l'instanciation des settings:", e)
    settings = Settings(_env_file=None)  # fallback minimal
