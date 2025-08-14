from fastapi import FastAPI
from .api import routers as api_routers
app = FastAPI(title="Gestion AO")

for r in api_routers:
    app.include_router(r)
@app.get("/")
def root():
    return {"status": "ok"}

