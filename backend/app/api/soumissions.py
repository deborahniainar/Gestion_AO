from fastapi import APIRouter
router = APIRouter(prefix="/soumissions", tags=["Soumissions"])
@router.get("/")
def list_soumissions():
    return {"soumissions": []}

