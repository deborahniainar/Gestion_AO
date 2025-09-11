from fastapi import APIRouter, Query, HTTPException
from ..core.config import settings
import jwt, time

router = APIRouter()

@router.get("/{lot}/subtasks/{sub_id}/onlyoffice_config")
def onlyoffice_config(lot: str, sub_id: str, appel_offre: str = Query("default")):
    from urllib.parse import quote

    file_url = f"{settings.BACKEND_PUBLIC_URL}/soumissions/workspaces/{lot}/subtasks/{sub_id}/docx?appel_offre={quote(appel_offre)}"
    callback_url = f"{settings.BACKEND_PUBLIC_URL}/soumissions/workspaces/{lot}/subtasks/{sub_id}/onlyoffice_callback?appel_offre={quote(appel_offre)}"

    doc_config = {
        "document": {
            "fileType": "docx",
            "key": f"{sub_id}-{int(time.time())}",
            "title": f"{sub_id}.docx",
            "url": file_url
        },
        "editorConfig": {
            "callbackUrl": callback_url,
            "user": {"id": "1", "name": "Admin"},
            "mode": "edit",
            "lang": "fr"
        }
    }

    # JWT
    if settings.ONLYOFFICE_JWT_ENABLED:
        doc_config["token"] = jwt.encode(doc_config, settings.ONLYOFFICE_JWT_SECRET, algorithm="HS256")

    return doc_config
