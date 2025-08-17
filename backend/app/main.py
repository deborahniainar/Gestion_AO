from fastapi import FastAPI
from .api import routers as api_routers
from .db.base import Base
from .db.session import engine
app = FastAPI(title="Gestion AO")

for r in api_routers:
    app.include_router(r)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
@app.get("/")
def root():
    return {"status": "ok"}

