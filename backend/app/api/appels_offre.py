from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..db.models import AppelOffre, Document
from ..schemas.appel_offre import (
    AppelOffreCreate,
    AppelOffreRead,
    AppelOffreUpdate,
)


router = APIRouter(prefix="/appels_offre", tags=["Appels d'offre"])


@router.get("/", response_model=list[AppelOffreRead])
def list_appels_offre(db: Session = Depends(get_db)):
    return db.query(AppelOffre).all()


@router.get("/{ao_id}", response_model=AppelOffreRead)
def get_appel_offre(ao_id: int, db: Session = Depends(get_db)):
    obj = db.query(AppelOffre).get(ao_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AO introuvable")
    return obj


@router.post("/", response_model=AppelOffreRead, status_code=status.HTTP_201_CREATED)
def create_appel_offre(payload: AppelOffreCreate, db: Session = Depends(get_db)):
    obj = AppelOffre(**payload.model_dump(exclude_unset=True))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{ao_id}", response_model=AppelOffreRead)
def update_appel_offre(ao_id: int, payload: AppelOffreUpdate, db: Session = Depends(get_db)):
    obj = db.query(AppelOffre).get(ao_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AO introuvable")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{ao_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appel_offre(ao_id: int, db: Session = Depends(get_db)):
    obj = db.query(AppelOffre).get(ao_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AO introuvable")
    db.delete(obj)
    db.commit()
    return None


@router.get("/{ao_id}/documents", response_model=list[dict])
def list_documents_for_ao(ao_id: int, db: Session = Depends(get_db)):
    obj = db.query(AppelOffre).get(ao_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AO introuvable")
    return [
        {"id": d.id, "type": d.type, "filename": d.filename, "expire_at": d.expire_at, "created_at": d.created_at}
        for d in obj.documents
    ]


@router.post("/{ao_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def attach_document_to_ao(ao_id: int, document_id: int, db: Session = Depends(get_db)):
    ao = db.query(AppelOffre).get(ao_id)
    if not ao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AO introuvable")
    doc = db.query(Document).get(document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")
    if doc not in ao.documents:
        ao.documents.append(doc)
        db.commit()
    return None


@router.delete("/{ao_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def detach_document_from_ao(ao_id: int, document_id: int, db: Session = Depends(get_db)):
    ao = db.query(AppelOffre).get(ao_id)
    if not ao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AO introuvable")
    doc = db.query(Document).get(document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")
    if doc in ao.documents:
        ao.documents.remove(doc)
        db.commit()
    return None


