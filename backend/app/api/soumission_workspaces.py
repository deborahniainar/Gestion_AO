from fastapi import APIRouter, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from typing import Any, Dict, List, Optional
import os
import json
import re
import io
from docx import Document as DocxDocument
from ..core.config import settings


router = APIRouter(prefix="/soumissions/workspaces", tags=["Soumissions - Workspaces"])


BASE_DIR = os.path.join(os.getcwd(), "files", "soumissions_workspaces")
os.makedirs(BASE_DIR, exist_ok=True)

CACHE: dict[str, dict] = {}


def _slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "_", value)
    value = re.sub(r"_+", "_", value).strip("_")
    return value or "default"


def _workspace_filepath(appel_offre: str, lot: str) -> str:
    ao = _slugify(appel_offre or "default")
    lt = _slugify(lot or "default")
    filename = f"{ao}__{lt}.json"
    return os.path.join(BASE_DIR, filename)


@router.get("/", response_model=List[str])
def list_lots(appel_offre: str = Query("default")) -> List[str]:
    ao = _slugify(appel_offre)
    lots: List[str] = []
    for name in os.listdir(BASE_DIR):
        if not name.endswith(".json"):
            continue
        if name.startswith(f"{ao}__"):
            parts = name[:-5].split("__", 1)
            if len(parts) == 2:
                lots.append(parts[1])
    return lots


@router.get("/{lot}")
def get_workspace(lot: str, appel_offre: str = Query("default"), create_if_missing: bool = Query(False)) -> Dict[str, Any]:
    path = _workspace_filepath(appel_offre, lot)
    if not os.path.exists(path):
        if create_if_missing:
            return {"appelOffre": appel_offre, "lot": lot, "listes": [], "subtasks": {}}
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Espace non trouvé")
    try:
        mtime = os.path.getmtime(path)
        cached = CACHE.get(path)
        if cached and cached.get("mtime") == mtime:
            return cached["data"]
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            # ensure keys exist
            if "subtasks" not in data or not isinstance(data.get("subtasks"), dict):
                data["subtasks"] = {}
            CACHE[path] = {"mtime": mtime, "data": data}
            return data
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lecture échouée")


@router.put("/{lot}", status_code=status.HTTP_204_NO_CONTENT)
def save_workspace(lot: str, payload: Dict[str, Any], appel_offre: str = Query("default")) -> None:
    path = _workspace_filepath(appel_offre, lot)
    try:
        existing: Dict[str, Any] = {}
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as fr:
                    existing = json.load(fr) or {}
            except Exception:
                existing = {}
        data = {
            "appelOffre": appel_offre,
            "lot": lot,
            "listes": payload.get("listes", existing.get("listes", [])),
            "subtasks": existing.get("subtasks", {}),
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        try:
            mtime = os.path.getmtime(path)
            CACHE[path] = {"mtime": mtime, "data": data}
        except Exception:
            CACHE.pop(path, None)
        return None
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Sauvegarde échouée")


@router.delete("/{lot}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(lot: str, appel_offre: str = Query("default")) -> None:
    path = _workspace_filepath(appel_offre, lot)
    try:
        if os.path.exists(path):
            os.remove(path)
        CACHE.pop(path, None)
        return None
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Suppression échouée")


@router.get("/{lot}/subtasks/{sub_id}")
def get_subtask_content(lot: str, sub_id: str, appel_offre: str = Query("default")) -> Dict[str, Any]:
    path = _workspace_filepath(appel_offre, lot)
    if not os.path.exists(path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Espace non trouvé")
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f) or {}
        subtasks = data.get("subtasks", {})
        return subtasks.get(sub_id, {"title": "", "content_markdown": ""})
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lecture échouée")


@router.put("/{lot}/subtasks/{sub_id}", status_code=status.HTTP_204_NO_CONTENT)
def save_subtask_content(lot: str, sub_id: str, payload: Dict[str, Any], appel_offre: str = Query("default")) -> None:
    path = _workspace_filepath(appel_offre, lot)
    try:
        data: Dict[str, Any] = {"appelOffre": appel_offre, "lot": lot, "listes": [], "subtasks": {}}
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f) or data
        if "subtasks" not in data or not isinstance(data.get("subtasks"), dict):
            data["subtasks"] = {}
        data["subtasks"][sub_id] = {
            "title": payload.get("title") or "",
            "content_markdown": payload.get("content_markdown") or "",
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        try:
            mtime = os.path.getmtime(path)
            CACHE[path] = {"mtime": mtime, "data": data}
        except Exception:
            CACHE.pop(path, None)
        return None
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Sauvegarde échouée")


@router.post("/{lot}/export_finished")
def export_finished(lot: str, appel_offre: str = Query("default")):
    path = _workspace_filepath(appel_offre, lot)
    if not os.path.exists(path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Espace non trouvé")
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f) or {}
        listes = data.get("listes", [])
        subtasks_map: Dict[str, Dict[str, Any]] = data.get("subtasks", {})

        def is_done_list(title: str) -> bool:
            t = (title or "").lower()
            return "termin" in t

        # Build docx
        doc = DocxDocument()
        any_content = False
        for l in listes:
            if not is_done_list(l.get("titre")):
                continue
            for st in l.get("sousTaches", []) or []:
                sub_id = st.get("id")
                sub_title = st.get("titre") or "Sans titre"
                stored = subtasks_map.get(sub_id or "", {})
                content = stored.get("content_markdown", "").strip()
                if not content:
                    # Skip empty content
                    continue
                any_content = True
                doc.add_heading(sub_title, level=2)
                for line in content.splitlines():
                    doc.add_paragraph(line)

        if not any_content:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aucun contenu à exporter dans 'Terminées'")

        buf = io.BytesIO()
        doc.save(buf)
        buf.seek(0)
        filename = f"export_{_slugify(appel_offre)}_{_slugify(lot)}.docx"
        return StreamingResponse(buf, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={
            "Content-Disposition": f"attachment; filename={filename}"
        })
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Export échoué")


@router.get("/{lot}/subtasks/{sub_id}/docx")
def get_subtask_docx(lot: str, sub_id: str, appel_offre: str = Query("default")):
    path = _workspace_filepath(appel_offre, lot)
    if not os.path.exists(path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Espace non trouvé")
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f) or {}
        subtasks = data.get("subtasks", {})
        entry = subtasks.get(sub_id)
        if not entry:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sous-tâche sans contenu")
        title = entry.get("title") or "document"
        content = (entry.get("content_markdown") or "").strip()
        doc = DocxDocument()
        doc.add_heading(title, level=1)
        for line in content.splitlines():
            doc.add_paragraph(line)
        buf = io.BytesIO()
        doc.save(buf)
        buf.seek(0)
        filename = f"subtask_{_slugify(sub_id)}.docx"
        return StreamingResponse(buf, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={
            "Content-Disposition": f"attachment; filename={filename}"
        })
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Génération DOCX échouée")


@router.get("/{lot}/subtasks/{sub_id}/onlyoffice_url")
def get_onlyoffice_url(lot: str, sub_id: str, request: Request, appel_offre: str = Query("default")) -> Dict[str, str]:
    ds = settings.ONLYOFFICE_DS_URL or ""
    if not ds:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ONLYOFFICE_DS_URL non configuré")
    # For a basic embed via editor?fileUrl=... approach (public link). Real deployments should use config JSON + JWT.
    from urllib.parse import quote, urlencode
    lot_enc = quote(lot, safe="")
    sub_enc = quote(sub_id, safe="")
    query = urlencode({"appel_offre": appel_offre})
    rel = f"/api/soumissions/workspaces/{lot_enc}/subtasks/{sub_enc}/docx?{query}"
    # OnlyOffice DS often cannot reach the Vite dev server on 5173; point to the backend public URL
    base = settings.BACKEND_PUBLIC_URL.rstrip('/') if settings.BACKEND_PUBLIC_URL else str(request.base_url).rstrip('/')
    file_url = base + rel
    # Some DS distributions accept ?fileUrl= param on default editor route. Otherwise, front should embed via DocsAPI config.
    from urllib.parse import quote as q
    return {"url": f"{ds.rstrip('/')}/?fileUrl={q(file_url, safe=':/?&=%')}"}


