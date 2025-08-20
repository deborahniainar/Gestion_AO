from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from sqlalchemy.orm import Session
import os
import shutil
import uuid

from ..db.session import get_db
from ..db.models import Materiel, Document
from ..schemas.materiel import MaterielCreate, MaterielRead, MaterielUpdate


router = APIRouter(prefix="/materiels", tags=["Matériels"])


@router.get("/", response_model=list[MaterielRead])
def list_materiels(db: Session = Depends(get_db)):
    return db.query(Materiel).all()


@router.get("/{materiel_id}", response_model=MaterielRead)
def get_materiel(materiel_id: int, db: Session = Depends(get_db)):
    obj = db.get(Materiel, materiel_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Matériel introuvable")
    return obj


@router.post("/", response_model=MaterielRead, status_code=status.HTTP_201_CREATED)
def create_materiel(payload: MaterielCreate, db: Session = Depends(get_db)):
    obj = Materiel(**payload.model_dump(exclude_unset=True))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{materiel_id}", response_model=MaterielRead)
def update_materiel(materiel_id: int, payload: MaterielUpdate, db: Session = Depends(get_db)):
    obj = db.get(Materiel, materiel_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Matériel introuvable")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.post("/with-files", response_model=MaterielRead, status_code=status.HTTP_201_CREATED)
def create_materiel_with_files(
    designation: str = Form(...),
    nombre: int = Form(...),
    marque: str | None = Form(None),
    modele: str | None = Form(None),
    annee: int | None = Form(None),
    qualite: str | None = Form(None),
    files: list[UploadFile] | None = File(None),
    db: Session = Depends(get_db),
):
    data = {
        "designation": designation,
        "nombre": nombre,
        "marque": marque,
        "modele": modele,
        "annee": annee,
        "qualite": qualite,
    }
    obj = Materiel(**{k: v for k, v in data.items() if v is not None})
    db.add(obj)
    db.flush()

    # Dossier upload
    upload_root = os.path.join(os.getcwd(), "files", "uploads", "materiels")
    os.makedirs(upload_root, exist_ok=True)

    def save_upload(u: UploadFile) -> str:
        _, ext = os.path.splitext(u.filename)
        safe_name = f"{uuid.uuid4().hex}{ext.lower()}"
        dest_path = os.path.join(upload_root, safe_name)
        u.file.seek(0)
        with open(dest_path, "wb") as out:
            shutil.copyfileobj(u.file, out)
        return safe_name

    if files:
        for f in files:
            if not f or not f.filename:
                continue
            fname = save_upload(f)
            doc = Document(type="materiel_piece", filename=fname)
            obj.documents.append(doc)
            db.add(doc)

    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{materiel_id}/with-files", response_model=MaterielRead)
def update_materiel_with_files(
    materiel_id: int,
    designation: str = Form(...),
    nombre: int = Form(...),
    marque: str | None = Form(None),
    modele: str | None = Form(None),
    annee: int | None = Form(None),
    qualite: str | None = Form(None),
    files: list[UploadFile] | None = File(None),
    db: Session = Depends(get_db),
):
    # Récupérer le matériel existant
    obj = db.get(Materiel, materiel_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Matériel introuvable")
    
    # Mettre à jour les données
    data = {
        "designation": designation,
        "nombre": nombre,
        "marque": marque,
        "modele": modele,
        "annee": annee,
        "qualite": qualite,
    }
    for key, value in data.items():
        if value is not None:
            setattr(obj, key, value)
    
    # Gérer les nouveaux fichiers
    if files:
        upload_root = os.path.join(os.getcwd(), "files", "uploads", "materiels")
        os.makedirs(upload_root, exist_ok=True)

        def save_upload(u: UploadFile) -> str:
            _, ext = os.path.splitext(u.filename)
            safe_name = f"{uuid.uuid4().hex}{ext.lower()}"
            dest_path = os.path.join(upload_root, safe_name)
            u.file.seek(0)
            with open(dest_path, "wb") as out:
                shutil.copyfileobj(u.file, out)
            return safe_name

        for f in files:
            if not f or not f.filename:
                continue
            fname = save_upload(f)
            doc = Document(type="materiel_piece", filename=fname)
            obj.documents.append(doc)
            db.add(doc)
    
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{materiel_id}/documents", response_model=list[dict])
def list_documents_for_materiel(materiel_id: int, db: Session = Depends(get_db)):
    obj = db.get(Materiel, materiel_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Matériel introuvable")
    
    return [
        {"id": doc.id, "type": doc.type, "filename": doc.filename, "created_at": doc.created_at}
        for doc in obj.documents
    ]


@router.delete("/{materiel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_materiel(materiel_id: int, db: Session = Depends(get_db)):
    obj = db.get(Materiel, materiel_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Matériel introuvable")
    db.delete(obj)
    db.commit()
    return None

