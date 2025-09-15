from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

# Charger les variables d'environnement depuis le fichier .env
load_dotenv()

from .api import routers as api_routers
from .db.base import Base
from .db.session import engine
from .dependencies import get_current_admin
app = FastAPI(title="Gestion AO")

# CORS configuration: apply early so middleware runs for error responses too.
# In development you can set CORS_ALLOW_ALL=1 to allow all origins (convenient for local testing).
CORS_ALLOW_ALL = os.getenv("CORS_ALLOW_ALL", "1") == "1"
if CORS_ALLOW_ALL:
    cors_origins = ["*"]
else:
    cors_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in api_routers:
    # Appliquer l'authentification par défaut sauf pour le routeur d'auth
    if getattr(r, "prefix", None) == "/auth":
        app.include_router(r)
    else:
        app.include_router(r, dependencies=[Depends(get_current_admin)])


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


# Fichiers statiques: servir les uploads sous /uploads
uploads_dir = os.path.join(os.getcwd(), "files", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.get("/")
def root():
    return {"status": "ok"}

