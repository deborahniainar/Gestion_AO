from fastapi import APIRouter
router = APIRouter(prefix="/prix", tags=["Prix"])
@router.get("/")
def list_prix():
    return {"prix": []}

