from fastapi import APIRouter, HTTPException, Query, Request, status, Depends
from fastapi.responses import StreamingResponse
from typing import Any, Dict, List, Optional
import io
from docx import Document as DocxDocument
from ..core.config import settings
from sqlalchemy.orm import Session
from ..db import models
from ..db.session import get_db
import uuid
from jose import jwt
import time


router = APIRouter(prefix="/soumissions/workspaces", tags=["Soumissions - Workspaces"])


def _slugify(value: str) -> str:
    return (value or "").strip()


@router.get("/", response_model=List[str])
def list_lots(appel_offre: str = Query("default"), db: Session = Depends(get_db)) -> List[str]:
    ao = (appel_offre or "default").strip()
    lots = db.query(models.Lot).filter(models.Lot.appel_offre == ao).all()
    return [l.titre for l in lots]


def _build_workspace_response(lot_obj: models.Lot) -> Dict[str, Any]:
    listes = []
    subtasks_map: Dict[str, Dict[str, Any]] = {}
    for task in sorted(lot_obj.tasks, key=lambda t: (t.ordre or 0)):
        sous = []
        for st in sorted(task.subtasks, key=lambda s: (s.ordre or 0)):
            sous.append({
                "id": st.id,
                "titre": st.titre,
                "done": bool(st.done)
            })
            # only expose content via subtasks map endpoints; include title mapping
            subtasks_map[st.id] = {"title": st.titre or "", "content_markdown": st.content_markdown or ""}
        listes.append({
            "id": task.id,
            "titre": task.titre,
            "sousTaches": sous
        })
    return {"appelOffre": lot_obj.appel_offre, "lot": lot_obj.titre, "listes": listes, "subtasks": subtasks_map}


@router.get("/{lot}")
def get_workspace(lot: str, appel_offre: str = Query("default"), create_if_missing: bool = Query(False), db: Session = Depends(get_db)) -> Dict[str, Any]:
    ao = (appel_offre or "default").strip()
    lot_title = (lot or "default").strip()
    lot_obj = db.query(models.Lot).filter(models.Lot.appel_offre == ao, models.Lot.titre == lot_title).first()
    if not lot_obj:
        if create_if_missing:
            # create empty lot
            lot_obj = models.Lot(appel_offre=ao, titre=lot_title)
            db.add(lot_obj)
            db.commit()
            db.refresh(lot_obj)
            return {"appelOffre": ao, "lot": lot_title, "listes": [], "subtasks": {}}
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Espace non trouvé")
    return _build_workspace_response(lot_obj)


@router.put("/{lot}", status_code=status.HTTP_204_NO_CONTENT)
def save_workspace(lot: str, payload: Dict[str, Any], appel_offre: str = Query("default"), db: Session = Depends(get_db)) -> None:
    ao = (appel_offre or "default").strip()
    lot_title = (lot or "default").strip()
    # find or create lot
    lot_obj = db.query(models.Lot).filter(models.Lot.appel_offre == ao, models.Lot.titre == lot_title).first()
    if not lot_obj:
        lot_obj = models.Lot(appel_offre=ao, titre=lot_title)
        db.add(lot_obj)
        db.commit()
        db.refresh(lot_obj)

    listes = payload.get("listes", []) or []
    # Build map of incoming task ids
    incoming_task_ids = set()
    for idx, l in enumerate(listes):
        task_id = l.get("id") or str(uuid.uuid4().hex)
        incoming_task_ids.add(task_id)
        task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.id_lot == lot_obj.id).first()
        if not task:
            task = models.Task(id=task_id, titre=l.get("titre") or "", ordre=idx, id_lot=lot_obj.id)
            db.add(task)
            db.commit()
            db.refresh(task)
        else:
            task.titre = l.get("titre") or task.titre
            task.ordre = idx
            db.add(task)
            db.commit()
        # handle subtasks
        incoming_sub_ids = set()
        for sidx, st in enumerate(l.get("sousTaches") or []):
            sid = st.get("id") or str(uuid.uuid4().hex)
            incoming_sub_ids.add(sid)
            # find subtask by id (may belong to another task if it was moved)
            sub = db.query(models.Subtask).filter(models.Subtask.id == sid).first()
            if not sub:
                sub = models.Subtask(
                    id=sid,
                    titre=st.get("titre") or "",
                    done=bool(st.get("done")),
                    ordre=sidx,
                    id_task=task.id
                )
                db.add(sub)
            else:
                # update fields and attach/move to the current task
                sub.titre = st.get("titre") or sub.titre
                sub.done = bool(st.get("done"))
                sub.ordre = sidx
                sub.id_task = task.id
                db.add(sub)
        # commit once after processing all subtasks for this task
        db.commit()
    # delete tasks not present
    existing_tasks = db.query(models.Task).filter(models.Task.id_lot == lot_obj.id).all()
    for et in existing_tasks:
        if et.id not in incoming_task_ids:
            db.delete(et)
    db.commit()
    return None


@router.delete("/{lot}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(lot: str, appel_offre: str = Query("default"), db: Session = Depends(get_db)) -> None:
    ao = (appel_offre or "default").strip()
    lot_title = (lot or "default").strip()
    lot_obj = db.query(models.Lot).filter(models.Lot.appel_offre == ao, models.Lot.titre == lot_title).first()
    if lot_obj:
        db.delete(lot_obj)
        db.commit()
    return None


@router.get("/{lot}/subtasks/{sub_id}")
def get_subtask_content(lot: str, sub_id: str, appel_offre: str = Query("default"), db: Session = Depends(get_db)) -> Dict[str, Any]:
    ao = (appel_offre or "default").strip()
    lot_title = (lot or "default").strip()
    sub = db.query(models.Subtask).filter(models.Subtask.id == sub_id).first()
    if not sub or not sub.task or not sub.task.lot or sub.task.lot.titre != lot_title or sub.task.lot.appel_offre != ao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sous-tâche introuvable")
    return {"title": sub.titre or "", "content_markdown": sub.content_markdown or ""}


@router.put("/{lot}/subtasks/{sub_id}", status_code=status.HTTP_204_NO_CONTENT)
def save_subtask_content(lot: str, sub_id: str, payload: Dict[str, Any], appel_offre: str = Query("default"), db: Session = Depends(get_db)) -> None:
    ao = (appel_offre or "default").strip()
    lot_title = (lot or "default").strip()
    sub = db.query(models.Subtask).filter(models.Subtask.id == sub_id).first()
    if not sub:
        # create parent lot if missing
        lot_obj = db.query(models.Lot).filter(models.Lot.appel_offre == ao, models.Lot.titre == lot_title).first()
        if not lot_obj:
            lot_obj = models.Lot(appel_offre=ao, titre=lot_title)
            db.add(lot_obj)
            db.commit()
            db.refresh(lot_obj)
        # create a default task to attach this subtask
        default_task = db.query(models.Task).filter(models.Task.id_lot == lot_obj.id).first()
        if not default_task:
            default_task = models.Task(id=str(uuid.uuid4().hex), titre="Tâches à faire", ordre=0, id_lot=lot_obj.id)
            db.add(default_task)
            db.commit()
            db.refresh(default_task)
        sub = models.Subtask(id=sub_id, titre=payload.get("title") or "", content_markdown=payload.get("content_markdown") or "", id_task=default_task.id)
        db.add(sub)
        db.commit()
        return None
    # ensure sub belongs to lot
    if not sub.task or not sub.task.lot or sub.task.lot.titre != lot_title or sub.task.lot.appel_offre != ao:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sous-tâche ne correspond pas au lot indiqué")
    sub.titre = payload.get("title") or sub.titre
    sub.content_markdown = payload.get("content_markdown") or sub.content_markdown
    db.add(sub)
    db.commit()
    return None


@router.post("/{lot}/export_finished")
def export_finished(lot: str, appel_offre: str = Query("default"), db: Session = Depends(get_db)):
    ao = (appel_offre or "default").strip()
    lot_title = (lot or "default").strip()
    lot_obj = db.query(models.Lot).filter(models.Lot.appel_offre == ao, models.Lot.titre == lot_title).first()
    if not lot_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Espace non trouvé")

    def is_done_list(title: str) -> bool:
        t = (title or "").lower()
        return "termin" in t

    doc = DocxDocument()
    any_content = False
    # iterate tasks treated as lists
    for task in sorted(lot_obj.tasks, key=lambda t: (t.ordre or 0)):
        if not is_done_list(task.titre):
            continue
        for st in sorted(task.subtasks, key=lambda s: (s.ordre or 0)):
            content = (st.content_markdown or "").strip()
            if not content:
                continue
            any_content = True
            doc.add_heading(st.titre or "Sans titre", level=2)
            for line in content.splitlines():
                doc.add_paragraph(line)

    if not any_content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aucun contenu à exporter dans 'Terminées'")

    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    from urllib.parse import quote
    filename = f"export_{quote(ao)}_{quote(lot_title)}.docx"
    return StreamingResponse(buf, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={
        "Content-Disposition": f"attachment; filename={filename}"
    })


@router.get("/{lot}/subtasks/{sub_id}/docx")
def get_subtask_docx(lot: str, sub_id: str, appel_offre: str = Query("default"), db: Session = Depends(get_db)):
    ao = (appel_offre or "default").strip()
    lot_title = (lot or "default").strip()
    sub = db.query(models.Subtask).filter(models.Subtask.id == sub_id).first()
    if not sub or not sub.task or not sub.task.lot or sub.task.lot.titre != lot_title or sub.task.lot.appel_offre != ao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sous-tâche sans contenu")
    title = sub.titre or "document"
    content = (sub.content_markdown or "").strip()
    doc = DocxDocument()
    doc.add_heading(title, level=1)
    for line in content.splitlines():
        doc.add_paragraph(line)
    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    filename = f"subtask_{sub_id}.docx"
    return StreamingResponse(buf, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={
        "Content-Disposition": f"attachment; filename={filename}"
    })


@router.get("/{lot}/subtasks/{sub_id}/onlyoffice_url")
def get_onlyoffice_url(lot: str, sub_id: str, request: Request, appel_offre: str = Query("default"), db: Session = Depends(get_db)) -> Dict[str, str]:
    ds = settings.ONLYOFFICE_DS_URL or ""
    if not ds:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ONLYOFFICE_DS_URL non configuré")
    from urllib.parse import quote, urlencode, quote as q
    lot_enc = quote(lot, safe="")
    sub_enc = quote(sub_id, safe="")
    query = urlencode({"appel_offre": appel_offre})

    # Build two candidate file URLs: one without /api (backend routes are at root),
    # and one with /api for cases where a frontend proxy exposes the API under /api.
    rel_no_api = f"/soumissions/workspaces/{lot_enc}/subtasks/{sub_enc}/docx?{query}"
    rel_api = f"/api/soumissions/workspaces/{lot_enc}/subtasks/{sub_enc}/docx?{query}"

    base = settings.BACKEND_PUBLIC_URL.rstrip('/') if settings.BACKEND_PUBLIC_URL else str(request.base_url).rstrip('/')
    file_url_primary = base + rel_no_api
    file_url_fallback = base + rel_api

    # Escape file URLs for insertion into OnlyOffice query
    file_url_primary_escaped = q(file_url_primary, safe=':/?&=%')
    file_url_fallback_escaped = q(file_url_fallback, safe=':/?&=%')
    onlyoffice_base = ds.rstrip('/')

    primary_ds_url = f"{onlyoffice_base}/?fileUrl={file_url_primary_escaped}"
    fallback_ds_url = f"{onlyoffice_base}/?fileUrl={file_url_fallback_escaped}"

    # If OnlyOffice JWT is enabled, sign a short-lived JWT and append as token param to both URLs
    if settings.ONLYOFFICE_JWT_ENABLED:
        secret = settings.ONLYOFFICE_JWT_SECRET
        if not secret:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="ONLYOFFICE_JWT_SECRET non configuré")
        try:
            payload = {
                "fileUrl": file_url_primary,
                # short expiry to minimise risk; DS will validate
                "exp": int(time.time()) + 300
            }
            token = jwt.encode(payload, secret, algorithm='HS256')
            primary_ds_url = f"{primary_ds_url}&token={q(token)}"

            # sign fallback token as well (payload.fileUrl points to fallback)
            payload_fallback = {"fileUrl": file_url_fallback, "exp": int(time.time()) + 300}
            token_fb = jwt.encode(payload_fallback, secret, algorithm='HS256')
            fallback_ds_url = f"{fallback_ds_url}&token={q(token_fb)}"
        except Exception:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erreur génération token OnlyOffice")

    return {"url": primary_ds_url, "fallback_url": fallback_ds_url}


