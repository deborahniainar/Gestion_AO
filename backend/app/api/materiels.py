from fastapi import APIRouter
router = APIRouter(prefix="/materiels", tags=["Matériels"])
@router.get("/")
def list_materiels():
    return {"materiels": []}

