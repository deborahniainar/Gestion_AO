import os
import uuid
import shutil
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from pydantic import BaseModel
import unicodedata
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..db.models import Document
from ..services.nlp_processing import summarize as llm_summarize, extract_structured_info, generate_markdown_table, extract_key_phrases

from fastapi import Request
from jose import jwt
from ..core.config import ONLYOFFICE_URL, ONLYOFFICE_JWT, INTERNAL_BACKEND_URL
import time, json, requests
import re

router = APIRouter(prefix="/dao", tags=["DAO"])

class ExtractSummaryRequest(BaseModel):
    document_id: int
    keywords: Optional[str] = None
    extraction_mode: Optional[str] = "smart"  # "smart", "structured", "keywords"

class GenerateDocxRequest(BaseModel):
    document_id: int
    content_markdown: str | None = None

class RequiredDocumentsResponse(BaseModel):
    documents: List[Dict[str, Any]]

@router.post("/upload")
def upload_dao(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload a DAO document (PDF or DOCX)"""
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nom de fichier manquant")

    # Validation des extensions
    allowed_exts = [".pdf", ".docx"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Format non supporté. Formats autorisés: {', '.join(allowed_exts)}"
        )

    # Génération d'un nom unique
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    upload_dir = os.path.join(os.getcwd(), "files", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'enregistrement: {str(e)}"
        )

    # Enregistrement en base
    doc = Document(
        type="dao",  # Type requis par le modèle
        filename=unique_filename
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "message": "Document téléversé avec succès",
        "document_id": doc.id,
        "filename": doc.filename,
        "url": f"/uploads/{doc.filename}",
    }


@router.post("/extract_summary")
def extract_summary(payload: ExtractSummaryRequest, db: Session = Depends(get_db)):
    """Extract summary and structured information from DAO document"""
    doc = db.get(Document, payload.document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")

    full_path = os.path.join(os.getcwd(), "files", "uploads", doc.filename)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fichier non trouvé sur le serveur")

    # Extraction du texte selon le mode demandé
    # Déterminer le type de fichier à partir de l'extension
    file_ext = os.path.splitext(doc.filename)[1].lower()
    file_type = file_ext[1:] if file_ext else "pdf"  # Retirer le point, défaut pdf
    text = extract_text_from_file(full_path, file_type)
    
    if not text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
            detail="Impossible d'extraire le texte du document"
        )

    # Initialiser les variables
    extracted_info = {}
    table_markdown = ""
    summary = ""
    
    # Traitement selon le mode d'extraction
    if payload.extraction_mode == "structured":
        # Extraction structurée complète
        extracted_info = extract_structured_info(text)
        table_markdown = generate_markdown_table(extracted_info)
        summary = llm_summarize(text) if not table_markdown else ""
        
    elif payload.extraction_mode == "keywords" and payload.keywords:
        # Extraction basée sur les mots-clés
        keywords_list = [k.strip() for k in payload.keywords.split(",") if k.strip()]
        key_phrases = extract_key_phrases(text, keywords_list)
        summary = "\n\n".join([f"**{k}:** {p}" for k, p in zip(keywords_list, key_phrases)])
        table_markdown = ""
        
    else:
        # Mode smart (par défaut) - combine les approches
        extracted_info = extract_structured_info(text)
        table_markdown = generate_markdown_table(extracted_info)
        summary = llm_summarize(text)
        
        # Si pas de résumé LLM, utiliser l'extraction structurée
        if not summary and extracted_info:
            summary = f"**Objet:** {extracted_info.get('objet', 'Non spécifié')}\n\n"
            summary += f"**Client:** {extracted_info.get('client', 'Non spécifié')}\n\n"
            summary += f"**Date limite:** {extracted_info.get('date_limite', 'Non spécifiée')}\n\n"
            summary += f"**Montant estimé:** {extracted_info.get('montant_estime', 'Non spécifié')}"

    return {
        "summary": summary,
        "table_markdown": table_markdown,
        "extraction_mode": payload.extraction_mode,
        "text_length": len(text),
        "extracted_info": extracted_info if payload.extraction_mode == "structured" else None
    }


def extract_text_from_file(file_path: str, file_type: str) -> str:
    """Extract text from PDF or DOCX file with improved error handling"""
    text = ""
    
    try:
        if file_type.lower() == "pdf":
            import fitz  # PyMuPDF

            with fitz.open(file_path) as pdf:
                # Extraction de toutes les pages
                for i in range(pdf.page_count):
                    page = pdf.load_page(i)
                    page_text = page.get_text()
                    text += page_text + "\n"

                # Vérification de la qualité du texte extrait
            if len(text.strip()) < 500:
                    # Tentative OCR si peu de texte (PDF scanné)
                try:
                    import pytesseract
                    from PIL import Image

                    ocr_text = []
                    with fitz.open(file_path) as pdf:
                        for i in range(pdf.page_count):
                            page = pdf.load_page(i)
                            pix = page.get_pixmap(dpi=300)  # Augmentation de la résolution
                            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                            ocr_text.append(pytesseract.image_to_string(img, lang="fra+eng"))
                        
                    text = "\n".join(ocr_text)
                except ImportError:
                    print("Pytesseract non disponible pour l'OCR")
                except Exception as e:
                    print(f"Erreur OCR: {e}")
                        
        elif file_type.lower() == "docx":
            try:
                import docx
                
                doc = docx.Document(file_path)
                paragraphs = []
                for p in doc.paragraphs:
                    if p.text.strip():
                        paragraphs.append(p.text.strip())
                
                # Extraction des tableaux
                for table in doc.tables:
                    for row in table.rows:
                        row_text = []
                        for cell in row.cells:
                            if cell.text.strip():
                                row_text.append(cell.text.strip())
                        if row_text:
                            paragraphs.append(" | ".join(row_text))
                
                text = "\n".join(paragraphs)
                
            except ImportError:
                print("python-docx non disponible")
            except Exception as e:
                print(f"Erreur lecture DOCX: {e}")
                
    except Exception as e:
        print(f"Erreur extraction texte: {e}")
        return ""
    
    # Nettoyage du texte
    text = text.strip()
    text = text.replace("\r", "\n")
    text = re.sub(r'\n{3,}', '\n\n', text)  # Suppression des sauts de ligne multiples
    
    return text


@router.get("/{document_id}/required_documents")
def get_required_documents(document_id: int, db: Session = Depends(get_db)):
    """Get list of required documents for a DAO"""
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")
    
    # Simulation de documents requis (à remplacer par une vraie logique métier)
    required_docs = [
        {
            "type": "Lettre de soumission",
            "description": "Lettre de candidature signée avec engagement",
            "obligatoire": True
        },
        {
            "type": "Attestation d'assurance",
            "description": "Attestation d'assurance décennale et responsabilité civile",
            "obligatoire": True
        },
        {
            "type": "Attestation de qualification",
            "description": "Attestation de qualification professionnelle",
            "obligatoire": True
        },
        {
            "type": "Références techniques",
            "description": "Liste des références techniques similaires (3 dernières années)",
            "obligatoire": False
        },
        {
            "type": "Organisation du chantier",
            "description": "Plan d'organisation du chantier et planning prévisionnel",
            "obligatoire": False
        }
    ]
    
    return required_docs


@router.post("/generate_docx")
def generate_docx(payload: GenerateDocxRequest, db: Session = Depends(get_db)):
    """Generate DOCX file from markdown content"""
    doc = db.get(Document, payload.document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")
    
    if not payload.content_markdown:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Contenu markdown requis")
    
    try:
        # Génération du fichier DOCX
        output_filename = f"dao_{doc.id}_{int(time.time())}.docx"
        output_path = os.path.join(os.getcwd(), "files", "generated", output_filename)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        _markdown_to_docx(payload.content_markdown, output_path)
        
        return {
            "message": "Document DOCX généré avec succès",
            "file_path": output_path,
            "filename": output_filename
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération: {str(e)}"
        )


def _markdown_to_docx(content: str, out_path: str) -> None:
    """Convert markdown content to DOCX file"""
    try:
        import docx
        from docx.shared import Inches
        
        doc = docx.Document()
        
        # Titre principal
        title = doc.add_heading("Résumé du DAO", 0)
        title.alignment = 1  # Centré
        
        # Ajout du contenu markdown
        lines = content.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if line.startswith('#'):
                # Titres
                level = line.count('#')
                if level <= 6:
                    doc.add_heading(line.lstrip('#').strip(), level)
            elif line.startswith('|'):
                # Tableaux markdown
                if '|' in line and line.count('|') > 1:
                    cells = [cell.strip() for cell in line.split('|')[1:-1]]
                    if len(cells) > 1:
                        table = doc.add_table(rows=1, cols=len(cells))
                        table.style = 'Table Grid'
                        for i, cell_text in enumerate(cells):
                            table.cell(0, i).text = cell_text
            elif line.startswith('- ') or line.startswith('* '):
                # Listes à puces
                doc.add_paragraph(line[2:], style='List Bullet')
            elif line.startswith('1. '):
                # Listes numérotées
                doc.add_paragraph(line[3:], style='List Number')
            else:
                # Paragraphe normal
                doc.add_paragraph(line)
        
        doc.save(out_path)
        
    except ImportError:
        raise Exception("python-docx non disponible")
    except Exception as e:
        raise Exception(f"Erreur conversion DOCX: {str(e)}")


@router.post("/onlyoffice/config")
def onlyoffice_config(file_path: str, title: str = None):
    file_url = f"{INTERNAL_BACKEND_URL}/uploads/{file_path}"
    key = f"{file_path}:{int(time.time())}"
    config = {
        "document": {
            "fileType": "docx",
            "key": key,
            "title": title or "document.docx",
            "url": file_url,
        },
        "editorConfig": {
            "callbackUrl": f"{INTERNAL_BACKEND_URL}/dao/onlyoffice/callback?path={file_path}",
            "lang": "fr",
            "mode": "edit",
            "customization": {"autosave": True, "forcesave": True}
        }
    }
    token = jwt.encode(config, ONLYOFFICE_JWT, algorithm="HS256")
    return {"docServerUrl": ONLYOFFICE_URL, "config": config, "token": token}

@router.post("/onlyoffice/callback")
async def onlyoffice_callback(request: Request, path: str):
    data = await request.json()
    status_code = data.get("status")
    if status_code in (2, 6):  # saved/force-saved
        url = data.get("url")
        if not url:
            return {"error": "no url"}
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        abs_path = os.path.join(os.getcwd(), "files", "uploads", path)
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        with open(abs_path, "wb") as f:
            f.write(r.content)
        return {"result": "saved"}
    return {"result": "ignored", "status": status_code}


