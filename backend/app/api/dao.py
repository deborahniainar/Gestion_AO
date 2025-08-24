import os
import uuid
import shutil
from typing import Optional, List, Dict

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from pydantic import BaseModel
import unicodedata
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..db.models import Document
from ..services.nlp_processing import summarize as llm_summarize

from fastapi import Request
from jose import jwt
from ..core.config import ONLYOFFICE_URL, ONLYOFFICE_JWT, INTERNAL_BACKEND_URL
import time, json, requests

router = APIRouter(prefix="/dao", tags=["DAO"])

class ExtractSummaryRequest(BaseModel):
    document_id: int
    keywords: Optional[str] = None

class GenerateDocxRequest(BaseModel):
    document_id: int
    content_markdown: str | None = None

class OnlyOfficeConfigRequest(BaseModel):
    file_path: str
    title: str | None = None

@router.post("/upload")
def upload_dao(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if file is None or not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aucun fichier fourni")

    allowed_exts = {".pdf", ".docx"}
    _, ext = os.path.splitext(file.filename)
    if ext.lower() not in allowed_exts:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Formats autorisés: .pdf, .docx")

    upload_root = os.path.join(os.getcwd(), "files", "uploads", "dao")
    os.makedirs(upload_root, exist_ok=True)

    safe_name = f"{uuid.uuid4().hex}{ext.lower()}"
    dest_path = os.path.join(upload_root, safe_name)

    file.file.seek(0)
    with open(dest_path, "wb") as out:
        shutil.copyfileobj(file.file, out)

    doc = Document(type="dao", filename=os.path.join("dao", safe_name))
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "document_id": doc.id,
        "filename": doc.filename,
        "url": f"/uploads/{doc.filename}",
    }


@router.post("/extract_summary")
def extract_summary(payload: ExtractSummaryRequest, db: Session = Depends(get_db)):
    doc = db.get(Document, payload.document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")

    full_path = os.path.join(os.getcwd(), "files", "uploads", doc.filename)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fichier non trouvé sur le serveur")

    text = ""
    try:
        if doc.filename.lower().endswith(".pdf"):
            import fitz  # PyMuPDF

            with fitz.open(full_path) as pdf:
                # Parcourir TOUTES les pages du PDF
                for i in range(pdf.page_count):
                    page = pdf.load_page(i)
                    text += page.get_text()

            # Fallback OCR si très peu de texte (PDF scanné)
            if len(text.strip()) < 500:
                try:
                    import pytesseract  # type: ignore
                    from PIL import Image  # type: ignore

                    ocr_text = []
                    with fitz.open(full_path) as pdf:
                        for i in range(pdf.page_count):
                            page = pdf.load_page(i)
                            pix = page.get_pixmap(dpi=200)
                            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                            ocr_text.append(pytesseract.image_to_string(img, lang="fra+eng"))
                    text = "\n".join(ocr_text)
                except Exception:
                    pass
        else:
            # .docx: lecture basique si python-docx dispo, sinon stub
            try:
                import docx  # type: ignore

                d = docx.Document(full_path)
                text = "\n".join(p.text for p in d.paragraphs)
            except Exception:
                text = ""
    except Exception:
        text = ""

    summary = ""
    if text:
        trimmed = text.strip().replace("\r", " ")
        # Essayer GPT d'abord si dispo
        llm_summary = llm_summarize(trimmed)
        if llm_summary:
            summary = llm_summary

        # Heuristique simple: si keywords fournis, privilégier les phrases contenant un mot-clé
        if payload.keywords:
            keys = [k.strip().lower() for k in payload.keywords.split(",") if k.strip()]
            sentences = [s.strip() for s in trimmed.split(".") if s.strip()]
            selected = [s for s in sentences if any(k in s.lower() for k in keys)]
            if selected:
                summary = ". ".join(selected[:6])
        if not summary:
            summary = (trimmed[:1200] + "…") if len(trimmed) > 1200 else trimmed
    else:
        summary = "Le présent Appel d'Offre concerne …"  # valeur par défaut si extraction impossible

    # Construire un tableau markdown par rubriques
    def normalize(s: str) -> str:
        s = s.lower()
        s = unicodedata.normalize('NFD', s)
        s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
        return s

    # Catégories par défaut et synonymes
    default_categories: Dict[str, List[str]] = {
        "répartition": ["repartition", "repartition", "distribution"],
        "lots": ["lot", "lots"],
        "garanties": ["garantie", "garanties", "caution", "surete", "sûrete", "bid bond"],
        "offres": ["offre", "offres", "proposition"],
        "technique": ["technique", "techniques"],
        "financière": ["financiere", "financière", "prix", "cout", "coût", "budget"],
        "personnels": ["personnel", "ressources humaines", "rh"],
        "materiels": ["materiel", "matériel", "equipement", "équipement"],
        "dates clés": ["date", "echeance", "échéance", "deadline", "limite", "ouverture"],
        "estimation": ["estimation", "estimatif", "quantitatif", "dqe", "devis"],
        "coûts": ["cout", "coût", "couts", "coûts", "montant", "prix"],
        "travaux": ["travaux", "chantier", "realisation", "réalisation", "execution", "exécution"],
    }

    # Déterminer les catégories à partir des mots-clés fournis ou utiliser les défauts
    category_order: List[str]
    if payload.keywords:
        provided = [k.strip() for k in payload.keywords.split(",") if k.strip()]
        category_order = provided
        # compléter avec défauts si inconnu
        for cat in provided:
            key = normalize(cat)
            if cat not in default_categories and key not in default_categories:
                default_categories[cat] = [key]
    else:
        category_order = list(default_categories.keys())

    # Indexation des phrases et lignes
    raw_text = (text or "")
    sentences_orig = [s.strip() for s in raw_text.replace("\n", " ").split(".") if s.strip()]
    sentences_norm = [normalize(s) for s in sentences_orig]
    lines_orig = [ln.strip() for ln in raw_text.splitlines() if ln.strip()]
    lines_norm = [normalize(ln) for ln in lines_orig]

    # Extracteurs dédiés par heuristiques simples
    import re

    def uniq_top(items, limit=5):
        seen = set()
        out = []
        for it in items:
            key = it.strip()
            if not key:
                continue
            if key in seen:
                continue
            seen.add(key)
            out.append(key)
            if len(out) >= limit:
                break
        return out

    # Lots: lignes de type "Lot 1: ..." ou "LOT 2 - ..."
    def extract_lots() -> list[str]:
        pat = re.compile(r"\b(?:lot)\s*(\d+)\s*[:\-–]\s*(.+)", re.IGNORECASE)
        matches = []
        for ln in lines_orig:
            m = pat.search(ln)
            if m:
                num, title = m.group(1), m.group(2)
                matches.append(f"Lot {num}: {title.strip()}")
        return uniq_top(matches, 8)

    # Dates clés: lignes contenant un mot-clé de date + motif date
    date_kw = ["date", "limite", "ouverture", "remise", "validite", "validité", "delai", "délai", "echeance", "échéance", "deadline"]
    date_pat = re.compile(r"\b(\d{1,2}[\/.\- ](?:\d{1,2}|[A-Za-z]{3,})[\/.\- ]\d{2,4})\b")
    def extract_dates() -> list[str]:
        results = []
        for ln, ln_norm in zip(lines_orig, lines_norm):
            if any(kw in ln_norm for kw in date_kw):
                found = date_pat.findall(ln)
                if found:
                    results.append(ln)
        return uniq_top(results, 10)

    # Montants/Pourcentages: garanties / coûts
    amt_pat = re.compile(r"\b\d{1,3}(?:[ .]\d{3})*(?:,\d+)?\s*(?:MAD|DH|DHS|EUR|FCFA|DA)?\b", re.IGNORECASE)
    pct_pat = re.compile(r"\b\d+(?:[.,]\d+)?\s*%\b")
    def extract_garanties() -> list[str]:
        kws = ["garantie", "garanties", "caution", "surete", "sûrete", "bid bond", "securite", "sécurité"]
        out = []
        for ln, ln_norm in zip(lines_orig, lines_norm):
            if any(k in ln_norm for k in kws):
                if amt_pat.search(ln) or pct_pat.search(ln):
                    out.append(ln)
        return uniq_top(out, 6)

    def extract_costs() -> list[str]:
        kws = ["cout", "coût", "montant", "prix", "budget", "total", "global"]
        out = []
        for ln, ln_norm in zip(lines_orig, lines_norm):
            if any(k in ln_norm for k in kws):
                if amt_pat.search(ln) or pct_pat.search(ln):
                    out.append(ln)
        return uniq_top(out, 8)

    def extract_offre(section: str) -> list[str]:
        # section: 'technique' ou 'financiere'
        kw = normalize(section)
        out = []
        for ln, ln_norm in zip(lines_orig, lines_norm):
            if f"offre {kw}" in ln_norm or kw in ln_norm:
                out.append(ln)
        return uniq_top(out, 8)

    def extract_personnels() -> list[str]:
        kws = ["personnel", "ingenieur", "ingénieur", "chef de projet", "technicien", "cv", "experience", "qualification"]
        out = []
        for ln, ln_norm in zip(lines_orig, lines_norm):
            if any(normalize(k) in ln_norm for k in kws):
                out.append(ln)
        return uniq_top(out, 8)

    def extract_materiels() -> list[str]:
        kws = ["materiel", "matériel", "equipement", "équipement", "camion", "pelle", "grue", "betonniere", "bétonnière"]
        out = []
        for ln, ln_norm in zip(lines_orig, lines_norm):
            if any(normalize(k) in ln_norm for k in kws):
                out.append(ln)
        return uniq_top(out, 8)

    rows: List[str] = []
    rows.append("| Rubrique | Extraits |")
    rows.append("|---|---|")

    for cat in category_order:
        synonyms = default_categories.get(cat, default_categories.get(normalize(cat), [normalize(cat)]))
        matches: List[str] = []
        cat_norm = normalize(cat)
        # Extracteurs spécialisés par catégorie
        if cat_norm in {"lots", "lot"}:
            matches = extract_lots()
        elif cat_norm in {"dates cles", "dates clés", "date cles", "date clés", "dates", "date"}:
            matches = extract_dates()
        elif cat_norm in {"garanties", "garantie", "caution"}:
            matches = extract_garanties()
        elif cat_norm in {"couts", "coûts", "cout", "coût", "estimation"}:
            matches = extract_costs()
        elif cat_norm in {"technique"}:
            matches = extract_offre("technique")
        elif cat_norm in {"financiere", "financière"}:
            matches = extract_offre("financiere")
        elif cat_norm in {"personnels", "personnel"}:
            matches = extract_personnels()
        elif cat_norm in {"materiels", "materiel", "matériel"}:
            matches = extract_materiels()

        # Fallback générique si rien trouvé: phrases contenant les synonymes
        if not matches:
            for orig, norm in zip(sentences_orig, sentences_norm):
                if any(term in norm for term in synonyms):
                    matches.append(orig)
                if len(matches) >= 5:
                    break
        if matches:
            cell = " \\n".join(m.strip() for m in matches)
        else:
            cell = "—"
        # Échapper les pipe '|' dans le contenu
        cell = cell.replace("|", "\|")
        rows.append(f"| {cat} | {cell} |")

    table_markdown = "\n".join(rows)

    return {"summary": summary, "table_markdown": table_markdown, "sections": rows}
    
import docx as docxlib

def _markdown_to_docx(content: str, out_path: str) -> None:
    d = docxlib.Document()
    if not content:
        d.add_paragraph("Document vide")
        d.save(out_path)
        return
    lines = content.splitlines()
    table_rows = []
    for ln in lines:
        if ln.strip().startswith("|") and ln.strip().endswith("|"):
            table_rows.append([c.strip() for c in ln.strip().strip("|").split("|")])
        else:
            if table_rows:
                cols = max(len(r) for r in table_rows)
                t = d.add_table(rows=len(table_rows), cols=cols)
                t.style = "Table Grid"
                for i, row in enumerate(table_rows):
                    for j, cell in enumerate(row):
                        t.cell(i, j).text = cell
                table_rows = []
            d.add_paragraph(ln)
    if table_rows:
        cols = max(len(r) for r in table_rows)
        t = d.add_table(rows=len(table_rows), cols=cols)
        t.style = "Table Grid"
        for i, row in enumerate(table_rows):
            for j, cell in enumerate(row):
                t.cell(i, j).text = cell
    d.save(out_path)

@router.post("/generate_docx")
def generate_docx(payload: GenerateDocxRequest, db: Session = Depends(get_db)):
    doc_obj = db.get(Document, payload.document_id)
    if not doc_obj:
        raise HTTPException(status_code=404, detail="Document introuvable")
    out_dir = os.path.join(os.getcwd(), "files", "uploads", "dao", "generated")
    os.makedirs(out_dir, exist_ok=True)
    out_name = f"{uuid.uuid4().hex}.docx"
    out_path = os.path.join(out_dir, out_name)
    _markdown_to_docx(payload.content_markdown or "", out_path)
    rel_path = os.path.join("dao", "generated", out_name)
    return {"file_path": rel_path, "url": f"/uploads/{rel_path}"}

@router.post("/onlyoffice/config")
def onlyoffice_config(payload: OnlyOfficeConfigRequest):
    file_url = f"{INTERNAL_BACKEND_URL}/uploads/{payload.file_path}"
    key = f"{payload.file_path}:{int(time.time())}"
    config = {
        "document": {
            "fileType": "docx",
            "key": key,
            "title": payload.title or "document.docx",
            "url": file_url,
        },
        "editorConfig": {
            "callbackUrl": f"{INTERNAL_BACKEND_URL}/dao/onlyoffice/callback?path={payload.file_path}",
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

@router.get("/{document_id}/required_documents")
def required_documents(document_id: int, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")

    # Stub: liste générique; à spécialiser après extraction réelle
    docs = [
        {"type": "Lettre de soumission", "obligatoire": True, "description": "Modèle signé et cacheté"},
        {"type": "Garantie de soumission", "obligatoire": True, "description": "Conforme au DAO"},
        {"type": "Attestation CNSS", "obligatoire": True, "description": "Valide"},
        {"type": "Attestation fiscale", "obligatoire": True, "description": "Valide"},
        {"type": "Références similaires", "obligatoire": False, "description": "3 projets récents"},
    ]
    return docs


