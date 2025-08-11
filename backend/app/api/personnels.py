from fastapi import APIRouter
router = APIRouter(prefix="/personnels", tags=["Personnels"])
@router.get("/")
def list_personnels():
    return {"personnels": []}

