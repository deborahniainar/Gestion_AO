from fastapi import APIRouter
router = APIRouter(prefix="/marches", tags=["Marches"])
@router.get("/")
def list_marches():
    return {"marches": []}

