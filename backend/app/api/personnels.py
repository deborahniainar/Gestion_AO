import os
import uuid
import shutil
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..db.models import Personnel, Document
from ..schemas.personnel import PersonnelCreate, PersonnelRead, PersonnelUpdate


router = APIRouter(prefix="/personnels", tags=["Personnels"])


@router.get("/", response_model=list[PersonnelRead])
def list_personnels(db: Session = Depends(get_db)):
    return db.query(Personnel).all()


@router.get("/{personnel_id}", response_model=PersonnelRead)
def get_personnel(personnel_id: int, db: Session = Depends(get_db)):
    obj = db.get(Personnel, personnel_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Personnel introuvable")
    return obj


@router.post("/", response_model=PersonnelRead, status_code=status.HTTP_201_CREATED)
def create_personnel(payload: PersonnelCreate, db: Session = Depends(get_db)):
    obj = Personnel(**payload.model_dump(exclude_unset=True))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.post("/with-files", response_model=PersonnelRead, status_code=status.HTTP_201_CREATED)
def create_personnel_with_files(
    nom: str = Form(...),
    prenom: str = Form(""),
    fonction: str | None = Form(None),
    experience_annees: int | None = Form(None),
    formation: str | None = Form(None),
    nationalite: str | None = Form(None),
    date_naissance: date | None = Form(None),
    salaire_mensuel: float | None = Form(None),
    contact: str | None = Form(None),
    genre: str | None = Form(None),
    status_pers: str | None = Form(None, alias="status"),
    profile_image: UploadFile | None = File(None),
    files: list[UploadFile] | None = File(None),
    db: Session = Depends(get_db),
):
    data = {
        "nom": nom,
        "prenom": prenom,
        "fonction": fonction,
        "experience_annees": experience_annees,
        "formation": formation,
        "nationalite": nationalite,
        "date_naissance": date_naissance,
        "salaire_mensuel": salaire_mensuel,
        "contact": contact,
        "genre": genre,
        "status": status_pers,
    }
    obj = Personnel(**{k: v for k, v in data.items() if v is not None})
    db.add(obj)
    db.flush()

    # Dossier upload
    upload_root = os.path.join(os.getcwd(), "files", "uploads", "personnels")
    os.makedirs(upload_root, exist_ok=True)

    def save_upload(u: UploadFile) -> str:
        _, ext = os.path.splitext(u.filename)
        safe_name = f"{uuid.uuid4().hex}{ext.lower()}"
        dest_path = os.path.join(upload_root, safe_name)
        u.file.seek(0)
        with open(dest_path, "wb") as out:
            shutil.copyfileobj(u.file, out)
        return safe_name

    if profile_image and profile_image.filename:
        obj.profile_image = save_upload(profile_image)

    if files:
        for f in files:
            if not f or not f.filename:
                continue
            fname = save_upload(f)
            doc = Document(type="personnel_piece", filename=fname)
            obj.documents.append(doc)
            db.add(doc)

    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{personnel_id}", response_model=PersonnelRead)
def update_personnel(personnel_id: int, payload: PersonnelUpdate, db: Session = Depends(get_db)):
    obj = db.get(Personnel, personnel_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Personnel introuvable")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{personnel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_personnel(personnel_id: int, db: Session = Depends(get_db)):
    obj = db.get(Personnel, personnel_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Personnel introuvable")
    upload_root = os.path.join(os.getcwd(), "files", "uploads", "personnels")
    if getattr(obj, "profile_image", None):
        profile_path = os.path.join(upload_root, obj.profile_image)
        try:
            if os.path.exists(profile_path):
                os.remove(profile_path)
        except Exception:
            pass

    if getattr(obj, "documents", None):
        for doc in list(obj.documents):
            file_path = os.path.join(upload_root, doc.filename)
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                pass
            db.delete(doc)

    db.delete(obj)
    db.commit()
    return None

