import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from ..db.session import get_db
from ..db.models import Document
from ..schemas.document import DocumentCreate, DocumentRead, DocumentUpdate


router = APIRouter(prefix="/documents", tags=["Documents"])


@router.get("/", response_model=list[DocumentRead])
def list_documents(db: Session = Depends(get_db)):
    return db.query(Document).all()


@router.get("/{document_id}", response_model=DocumentRead)
def get_document(document_id: int, db: Session = Depends(get_db)):
    obj = db.get(Document, document_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")
    return obj


@router.post("/", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
def create_document(payload: DocumentCreate, db: Session = Depends(get_db)):
    obj = Document(**payload.model_dump(exclude_unset=True))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{document_id}", response_model=DocumentRead)
def update_document(document_id: int, payload: DocumentUpdate, db: Session = Depends(get_db)):
    obj = db.get(Document, document_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: int, db: Session = Depends(get_db)):
    obj = db.get(Document, document_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")
    db.delete(obj)
    db.commit()
    return None


@router.post("/upload", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    name: str = Form(...),
    expiry: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Upload un fichier document administratif"""
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aucun fichier fourni")
    
    # Types de fichiers autorisés
    allowed_exts = {".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"}
    _, ext = os.path.splitext(file.filename)
    if ext.lower() not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Formats autorisés: PDF, DOC, DOCX, PNG, JPG, JPEG"
        )
    
    # Créer le dossier de destination
    upload_root = os.path.join(os.getcwd(), "files", "uploads", "documents")
    os.makedirs(upload_root, exist_ok=True)
    
    # Générer un nom de fichier unique
    safe_name = f"{uuid.uuid4().hex}{ext.lower()}"
    dest_path = os.path.join(upload_root, safe_name)
    
    # Sauvegarder le fichier
    try:
        file.file.seek(0)
        with open(dest_path, "wb") as out:
            shutil.copyfileobj(file.file, out)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la sauvegarde du fichier: {str(e)}"
        )
    
    # Convertir la date d'expiration si fournie
    expire_at = None
    if expiry:
        try:
            from datetime import datetime
            expire_at = datetime.strptime(expiry, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Format de date d'expiration invalide. Utilisez YYYY-MM-DD"
            )
    
    # Créer l'entrée en base de données
    doc = Document(
        type="administratif",
        filename=os.path.join("documents", safe_name),
        expire_at=expire_at
    )
    
    # Ajouter des métadonnées personnalisées au nom original
    doc.original_name = name
    doc.original_filename = file.filename
    
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    return doc


@router.get("/download/{document_id}")
def download_document(document_id: int, db: Session = Depends(get_db)):
    """Télécharge un document par son ID"""
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")
    
    file_path = os.path.join(os.getcwd(), "files", "uploads", doc.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fichier introuvable sur le serveur")
    
    from fastapi.responses import FileResponse
    return FileResponse(
        path=file_path,
        filename=getattr(doc, 'original_filename', os.path.basename(doc.filename)),
        media_type='application/octet-stream'
    )

