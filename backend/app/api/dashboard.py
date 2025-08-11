from fastapi import APIRouter
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
@router.get("/stats")
def stats():
    return {"stats": {}}

