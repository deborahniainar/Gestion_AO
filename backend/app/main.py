from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .api import routers as api_routers
from .db.base import Base
from .db.session import engine
from .dependencies import get_current_admin
app = FastAPI(title="Gestion AO")

for r in api_routers:
    # Appliquer l'authentification par défaut sauf pour le routeur d'auth
    if getattr(r, "prefix", None) == "/auth":
        app.include_router(r)
    else:
        app.include_router(r, dependencies=[Depends(get_current_admin)])


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)

# CORS pour le front en dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Fichiers statiques: servir les uploads sous /uploads
uploads_dir = os.path.join(os.getcwd(), "files", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.get("/")
def root():
    return {"status": "ok"}

