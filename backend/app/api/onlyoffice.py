from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/{lot}/subtasks/{sub_id}/onlyoffice_config")
def onlyoffice_config(lot: str, sub_id: str):
    raise HTTPException(status_code=410, detail="OnlyOffice integration removed. Use TinyMCE editor endpoints instead.")
