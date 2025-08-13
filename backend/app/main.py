from fastapi import FastAPI
from .api import routers as api_routers
from .db.base import Base
from .db.session import engine
app = FastAPI(title="Gestion AO")

# Création automatique des tables selon les modèles
Base.metadata.create_all(bind=engine)
for r in api_routers:
    app.include_router(r)
@app.get("/")
def root():
    return {"status": "ok"}

