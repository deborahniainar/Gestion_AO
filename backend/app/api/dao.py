from fastapi import APIRouter
router = APIRouter(prefix="/dao", tags=["DAO"])
@router.get("/")
def list_dao():
    return {"dao": []}

