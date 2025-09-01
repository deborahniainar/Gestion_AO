import os
import uuid
import shutil
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from fastapi.responses import FileResponse
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
    cv_file: UploadFile | None = File(None),
    diplome_file: UploadFile | None = File(None),
    contrat_file: UploadFile | None = File(None),
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

    # Gérer les fichiers par catégorie
    document_types = [
        (cv_file, "personnel_cv"),
        (diplome_file, "personnel_diplome"),
        (contrat_file, "personnel_contrat")
    ]
    
    for file_upload, doc_type in document_types:
        if file_upload and file_upload.filename:
            fname = save_upload(file_upload)
            doc = Document(type=doc_type, filename=fname, original_filename=file_upload.filename)
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


@router.put("/{personnel_id}/with-files", response_model=PersonnelRead)
def update_personnel_with_files(
    personnel_id: int,
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
    cv_file: UploadFile | None = File(None),
    diplome_file: UploadFile | None = File(None),
    contrat_file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    obj = db.get(Personnel, personnel_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Personnel introuvable")
    
    # Mettre à jour les données de base
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
    
    for key, value in data.items():
        if value is not None:
            setattr(obj, key, value)
    
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

    # Gérer l'image de profil
    if profile_image and profile_image.filename:
        # Supprimer l'ancienne image si elle existe
        if obj.profile_image:
            old_image_path = os.path.join(upload_root, obj.profile_image)
            try:
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)
            except Exception:
                pass
        
        # Sauvegarder la nouvelle image
        obj.profile_image = save_upload(profile_image)

    # Gérer les fichiers par catégorie  
    document_types = [
        (cv_file, "personnel_cv"),
        (diplome_file, "personnel_diplome"),
        (contrat_file, "personnel_contrat")
    ]
    
    for file_upload, doc_type in document_types:
        if file_upload and file_upload.filename:
            # Supprimer l'ancien document du même type s'il existe
            existing_docs = [doc for doc in obj.documents if doc.type == doc_type]
            for old_doc in existing_docs:
                old_file_path = os.path.join(upload_root, old_doc.filename)
                try:
                    if os.path.exists(old_file_path):
                        os.remove(old_file_path)
                except Exception:
                    pass
                obj.documents.remove(old_doc)
                db.delete(old_doc)
            
            # Ajouter le nouveau document
            fname = save_upload(file_upload)
            doc = Document(type=doc_type, filename=fname, original_filename=file_upload.filename)
            obj.documents.append(doc)
            db.add(doc)

    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{personnel_id}/documents")
def get_personnel_documents(personnel_id: int, db: Session = Depends(get_db)):
    obj = db.get(Personnel, personnel_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Personnel introuvable")
    
    # Organiser les documents par catégorie
    documents_by_category = {
        "cv": [],
        "diplome": [],
        "contrat": []
    }
    
    for doc in obj.documents:
        if doc.type == "personnel_cv":
            documents_by_category["cv"].append({
                "id": doc.id,
                "filename": doc.filename,
                "original_filename": doc.original_filename,
                "url": f"/api/uploads/personnels/{doc.filename}",
                "created_at": doc.created_at
            })
        elif doc.type == "personnel_diplome":
            documents_by_category["diplome"].append({
                "id": doc.id,
                "filename": doc.filename,
                "original_filename": doc.original_filename,
                "url": f"/api/uploads/personnels/{doc.filename}",
                "created_at": doc.created_at
            })
        elif doc.type == "personnel_contrat":
            documents_by_category["contrat"].append({
                "id": doc.id,
                "filename": doc.filename,
                "original_filename": doc.original_filename,
                "url": f"/api/uploads/personnels/{doc.filename}",
                "created_at": doc.created_at
            })
    
    return documents_by_category


@router.delete("/{personnel_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_personnel_document(personnel_id: int, document_id: int, db: Session = Depends(get_db)):
    """Supprimer un document spécifique d'un personnel"""
    # Vérifier que le personnel existe
    personnel = db.get(Personnel, personnel_id)
    if not personnel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Personnel introuvable")
    
    # Récupérer le document
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")
    
    # Vérifier que le document appartient bien au personnel
    if document not in personnel.documents:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ce document n'appartient pas à ce personnel")
    
    # Supprimer le fichier physique
    upload_root = os.path.join(os.getcwd(), "files", "uploads", "personnels")
    file_path = os.path.join(upload_root, document.filename)
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception:
        pass
    
    # Supprimer de la base de données
    personnel.documents.remove(document)
    db.delete(document)
    db.commit()
    
    return None


@router.get("/{personnel_id}/documents/debug")
def debug_personnel_documents(personnel_id: int, db: Session = Depends(get_db)):
    """Route de debug pour voir tous les documents d'un personnel"""
    obj = db.get(Personnel, personnel_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Personnel introuvable")
    
    documents = []
    for doc in obj.documents:
        documents.append({
            "id": doc.id,
            "type": doc.type,
            "filename": doc.filename,
            "original_filename": doc.original_filename,
            "created_at": doc.created_at
        })
    
    return {
        "personnel_id": personnel_id,
        "personnel_nom": f"{obj.nom} {obj.prenom}",
        "total_documents": len(documents),
        "documents": documents
    }



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

