import os
import uuid
import shutil
from typing import Optional, List, Dict

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from pydantic import BaseModel
import unicodedata
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..db.models import Document, DAO, DaoLot, DaoPriceMO, DaoPriceMTX, DaoPriceEQU, DaoPriceSDP, DaoPriceSDPPost, DaoPriceSDPArticle, DaoPriceBDE, DaoTask, DaoSubtask
from ..services.nlp_processing import summarize as llm_summarize

from fastapi import Request
import time, json, requests
import logging

from html2docx import html2docx

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dao", tags=["DAO"])

class ExtractSummaryRequest(BaseModel):
    document_id: int
    keywords: Optional[str] = None

class GenerateDocxRequest(BaseModel):
    document_id: int
    content_markdown: str | None = None
    content_html: str | None = None

class OnlyOfficeConfigRequest(BaseModel):
    file_path: str
    title: str | None = None

class SaveDAORequest(BaseModel):
    document_id: int
    lots: Optional[List[Dict]] = None

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

    doc = Document(
        type="dao", 
        filename=os.path.join("dao", safe_name),
        original_filename=file.filename,  # Stocker le nom original du fichier
        original_name=file.filename  # Utiliser le nom original comme nom d'affichage par défaut
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "document_id": doc.id,
        "filename": doc.filename,
        "original_filename": doc.original_filename,
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
    # --- HTML to DOCX support ---
    content_html = getattr(payload, 'content_html', None)
    if content_html:
        d = docxlib.Document()
        html2docx(content_html, d)
        d.save(out_path)
    else:
        _markdown_to_docx(payload.content_markdown or "", out_path)
    rel_path = os.path.join("dao", "generated", out_name)
    return {"file_path": rel_path, "url": f"/uploads/{rel_path}"}

@router.get("/{document_id}/required_documents")
def required_documents(document_id: int, db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")

@router.post("/save")
def save_dao(payload: SaveDAORequest, db: Session = Depends(get_db), force: bool = False):
    """Persist a DAO structure into DB (DAO, lots, price tables, tasks).

    Payload: { document_id: int, lots: [{ lotName, priceMO: [...], priceMTX: [...], priceEQU: [...], priceSDP: [...], priceBDE: [...], tasks: [...] }, ...] }
    If a DAO already exists for the document and `force` is False -> 409 Conflict.
    If `force` is True, existing DAO and children are removed and replaced.
    """
    doc = db.get(Document, payload.document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")

    # Check existing DAO for this document
    existing = db.query(DAO).filter(DAO.document_id == payload.document_id).first()
    if existing and not force:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail=f"DAO déjà enregistré pour document_id={payload.document_id}. Pour écraser, réessayez avec ?force=true")

    try:
        # If overwriting, delete existing DAO cascade
        if existing:
            db.delete(existing)
            db.flush()

        # Create DAO row
        dao = DAO(document_id=payload.document_id, reference=getattr(payload, 'reference', None))
        db.add(dao)
        db.flush()

        lots = payload.lots or []
        from decimal import Decimal

        def to_decimal(v):
            if v is None or v == "":
                return None
            try:
                return Decimal(str(v))
            except Exception:
                return None

        created_lot_ids = []

        for lot_obj in lots:
            # accept different key names
            lot_name = (lot_obj.get('lotName') or lot_obj.get('name') or lot_obj.get('lot') or lot_obj.get('titre') or 'Lot')
            dlot = DaoLot(id_dao=dao.id, lot_name=lot_name)
            db.add(dlot)
            db.flush()

            created_lot_ids.append(dlot.id)

            # Main d'oeuvre
            for mo in lot_obj.get('priceMO') or lot_obj.get('price_mo') or lot_obj.get('mainOeuvre') or []:
                pm = DaoPriceMO(
                    id_lot=dlot.id,
                    poste=mo.get('poste') or mo.get('name') or '',
                    horaire_mensuel=to_decimal(mo.get('horaireMensuel') or mo.get('horaire_mensuel') or mo.get('horaire')),
                    charges=to_decimal(mo.get('charges')),
                    temps=to_decimal(mo.get('temps')),
                    salaire_horaire=to_decimal(mo.get('salaireHoraire') or mo.get('salaire_horaire')),
                    total=to_decimal(mo.get('total')),
                )
                db.add(pm)

            # Matériaux
            for mtx in lot_obj.get('priceMTX') or lot_obj.get('price_mtx') or lot_obj.get('materiaux') or []:
                m = DaoPriceMTX(
                    id_lot=dlot.id,
                    designation=mtx.get('designation') or mtx.get('name') or '',
                    quantite=to_decimal(mtx.get('quantite')),
                    prix_unitaire=to_decimal(mtx.get('prix_unitaire') or mtx.get('prixUnitaire')),
                    total=to_decimal(mtx.get('total')),
                )
                db.add(m)

            # Équipements
            for equ in lot_obj.get('priceEQU') or lot_obj.get('price_equ') or lot_obj.get('equipements') or []:
                e = DaoPriceEQU(
                    id_lot=dlot.id,
                    designation=equ.get('designation') or equ.get('name') or '',
                    quantite=to_decimal(equ.get('quantite')),
                    prix_unitaire=to_decimal(equ.get('prix_unitaire') or equ.get('prixUnitaire')),
                    total=to_decimal(equ.get('total')),
                )
                db.add(e)

            # Bordereau de prix
            for bde in lot_obj.get('priceBDE') or lot_obj.get('price_bde') or lot_obj.get('bde') or []:
                b = DaoPriceBDE(
                    id_lot=dlot.id,
                    poste=bde.get('poste') or bde.get('name') or '',
                    quantite=to_decimal(bde.get('quantite')),
                    prix_unitaire=to_decimal(bde.get('prix_unitaire') or bde.get('prixUnitaire')),
                    total=to_decimal(bde.get('total')),
                )
                db.add(b)

            # Sous-détail de prix (avec postes et articles)
            for sdp in lot_obj.get('priceSDP') or lot_obj.get('price_sdp') or lot_obj.get('sousDetailPrix') or []:
                s = DaoPriceSDP(
                    id_lot=dlot.id,
                    description=sdp.get('description') or sdp.get('titre') or None,
                    quantite=to_decimal(sdp.get('quantite')),
                    prix_unitaire=to_decimal(sdp.get('prix_unitaire') or sdp.get('prixUnitaire')),
                    total=to_decimal(sdp.get('total')),
                )
                db.add(s)
                db.flush()

                for post in sdp.get('posts') or sdp.get('posts_list') or post.get('posts') if False else sdp.get('posts') or []:
                    p = DaoPriceSDPPost(
                        id_sdp=s.id,
                        titre=post.get('titre') or post.get('title') or post.get('name') or ''
                    )
                    db.add(p)
                    db.flush()
                    for art in post.get('articles') or post.get('items') or []:
                        designation = art.get('designation') or art.get('name') or ''
                        quant_a = to_decimal(art.get('quantite'))
                        # Accept explicit prix_unitaire or any of the costNetPerUnit aliases from the frontend.
                        # read both a generic unit price and the explicit costNetPerUnit alias
                        pu_direct = to_decimal(art.get('prix_unitaire') or art.get('prixUnitaire') or art.get('pu'))
                        pu_net = to_decimal(art.get('costNetPerUnit') or art.get('cost_per_unit') or art.get('costPerUnit') or art.get('cost_net_per_unit'))
                        # prefer explicit prix_unitaire if provided, else use costNetPerUnit
                        pu = pu_direct if pu_direct is not None else pu_net
                        total_a = to_decimal(art.get('total'))
                        # persist optional workspace elements as JSON text (no computation based on them)
                        elements_payload = art.get('elements') if isinstance(art.get('elements'), (list, dict)) else None
                        a = DaoPriceSDPArticle(
                            id_post=p.id,
                            designation=designation,
                            numero=art.get('numero') or art.get('numero_article') or None,
                            quantite=quant_a,
                            unite=art.get('unite') or art.get('unit') or None,
                            prix_unitaire=pu,
                            # also store the explicit cost_net_per_unit column when provided
                            cost_net_per_unit=pu_net,
                            total=total_a,
                            coefficient_k=to_decimal(art.get('coefficientK') or art.get('coefficient_k')),
                            production_per_day=to_decimal(art.get('productionPerDay') or art.get('production_per_day')),
                            elements=(json.dumps(elements_payload, ensure_ascii=False) if elements_payload is not None else None),
                        )
                        db.add(a)

            # Tâches et sous-tâches
            for t in lot_obj.get('tasks') or lot_obj.get('taches') or []:
                task_id = t.get('id') or uuid.uuid4().hex
                task = DaoTask(id=task_id, titre=t.get('titre') or t.get('title') or '', ordre=t.get('ordre'), id_lot=dlot.id)
                db.add(task)
                db.flush()
                for st in t.get('subtasks') or t.get('sousTaches') or t.get('sub_tasks') or []:
                    st_id = st.get('id') or uuid.uuid4().hex
                    sub = DaoSubtask(id=st_id,
                                     titre=st.get('titre') or st.get('title') or '',
                                     done=bool(st.get('done')),
                                     ordre=st.get('ordre'),
                                     content_markdown=st.get('content_markdown') or st.get('content') or None,
                                     id_task=task.id)
                    db.add(sub)

        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Impossible d'enregistrer le DAO en base: {str(e)}")

    return {"status": "ok", "dao_id": dao.id, "lots_created": len(lots), "lot_ids": created_lot_ids}

import datetime

@router.post("/cleanup")
def cleanup_dao(days: int = 30, action: str = "archive", dry_run: bool = True):
    """Nettoyage / archivage des fichiers DAO.

    - days: fichiers plus anciens que ce nombre de jours seront traités.
    - action: 'archive' (déplace vers ./archive) ou 'delete' (supprime les fichiers).
    - dry_run: si True, ne fait que simuler et renvoie la liste des fichiers qui seraient affectés.

    Retourne un résumé des fichiers traités.
    """
    base_dir = os.path.join(os.getcwd(), "files", "uploads", "dao")
    if not os.path.exists(base_dir):
        return {"moved": [], "deleted": [], "skipped": [], "message": "Répertoire DAO introuvable"}

    cutoff = datetime.datetime.now() - datetime.timedelta(days=days)
    archive_dir = os.path.join(base_dir, "archive")
    os.makedirs(archive_dir, exist_ok=True)

    moved = []
    deleted = []
    skipped = []

    for name in os.listdir(base_dir):
        # Ignorer dossiers utilitaires
        if name in ("generated", "archive"):
            skipped.append({"path": name, "reason": "ignored_dir"})
            continue
        path = os.path.join(base_dir, name)
        if os.path.isdir(path):
            skipped.append({"path": name, "reason": "is_dir"})
            continue
        try:
            mtime = datetime.datetime.fromtimestamp(os.path.getmtime(path))
        except Exception:
            skipped.append({"path": name, "reason": "stat_failed"})
            continue
        if mtime < cutoff:
            if dry_run:
                if action == "delete":
                    deleted.append(path)
                else:
                    moved.append(path)
                continue
            # effectif
            try:
                if action == "delete":
                    os.remove(path)
                    deleted.append(path)
                else:
                    dest = os.path.join(archive_dir, name)
                    shutil.move(path, dest)
                    moved.append(dest)
            except Exception as e:
                skipped.append({"path": path, "reason": f"error:{str(e)}"})
        else:
            skipped.append({"path": path, "reason": "newer_than_cutoff"})

    return {"moved": moved, "deleted": deleted, "skipped": skipped, "dry_run": bool(dry_run), "days": days, "action": action}

@router.get("/{document_id}")
def get_dao(document_id: int, db: Session = Depends(get_db)):
    """Return persisted DAO and its lots for a given document_id."""
    dao = db.query(DAO).filter(DAO.document_id == document_id).first()
    if not dao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DAO introuvable")

    lots = []
    lot_objs = db.query(DaoLot).filter(DaoLot.id_dao == dao.id).all()
    for l in lot_objs:
        lot = {
            "id": l.id,
            "lot_name": l.lot_name,
            "created_at": getattr(l, 'created_at', None),
            "priceMO": [],
            "priceMTX": [],
            "priceEQU": [],
            "priceBDE": [],
            "priceSDP": [],
            "tasks": [],
        }
        # priceMO
        mos = db.query(DaoPriceMO).filter(DaoPriceMO.id_lot == l.id).all()
        for m in mos:
            lot["priceMO"].append({
                "id": m.id,
                "poste": m.poste,
                "horaire_mensuel": str(m.horaire_mensuel) if m.horaire_mensuel is not None else None,
                "charges": str(m.charges) if m.charges is not None else None,
                "temps": str(m.temps) if m.temps is not None else None,
                "salaire_horaire": str(m.salaire_horaire) if m.salaire_horaire is not None else None,
                "total": str(m.total) if m.total is not None else None,
            })
        # priceMTX
        mtxs = db.query(DaoPriceMTX).filter(DaoPriceMTX.id_lot == l.id).all()
        for m in mtxs:
            lot["priceMTX"].append({
                "id": m.id,
                "designation": m.designation,
                "quantite": str(m.quantite) if m.quantite is not None else None,
                "prix_unitaire": str(m.prix_unitaire) if m.prix_unitaire is not None else None,
                "total": str(m.total) if m.total is not None else None,
            })
        # priceEQU
        equs = db.query(DaoPriceEQU).filter(DaoPriceEQU.id_lot == l.id).all()
        for e in equs:
            lot["priceEQU"].append({
                "id": e.id,
                "designation": e.designation,
                "quantite": str(e.quantite) if e.quantite is not None else None,
                "prix_unitaire": str(e.prix_unitaire) if e.prix_unitaire is not None else None,
                "total": str(e.total) if e.total is not None else None,
                # additional persisted fields
                "materiel_id": int(e.materiel_id) if getattr(e, 'materiel_id', None) is not None else None,
                "dt_percent": str(e.dt_percent) if getattr(e, 'dt_percent', None) is not None else None,
                "dt_value": str(e.dt_value) if getattr(e, 'dt_value', None) is not None else None,
                "vr_plus_taxes": str(e.vr_plus_taxes) if getattr(e, 'vr_plus_taxes', None) is not None else None,
                "nj": str(e.nj) if getattr(e, 'nj', None) is not None else None,
                "amort_j": str(e.amort_j) if getattr(e, 'amort_j', None) is not None else None,
                "cc": str(e.cc) if getattr(e, 'cc', None) is not None else None,
                "cl": str(e.cl) if getattr(e, 'cl', None) is not None else None,
                "cpr": str(e.cpr) if getattr(e, 'cpr', None) is not None else None,
                "tlpr_percent": str(e.tlpr_percent) if getattr(e, 'tlpr_percent', None) is not None else None,
                "tlpr_value": str(e.tlpr_value) if getattr(e, 'tlpr_value', None) is not None else None,
                "cmo": str(e.cmo) if getattr(e, 'cmo', None) is not None else None,
                "tj": str(e.tj) if getattr(e, 'tj', None) is not None else None,
                "twm": str(e.twm) if getattr(e, 'twm', None) is not None else None,
                "total_h": str(e.total_h) if getattr(e, 'total_h', None) is not None else None,
            })
        # priceBDE
        bdes = db.query(DaoPriceBDE).filter(DaoPriceBDE.id_lot == l.id).all()
        for b in bdes:
            lot["priceBDE"].append({
                "id": b.id,
                "poste": b.poste,
                "quantite": str(b.quantite) if b.quantite is not None else None,
                "prix_unitaire": str(b.prix_unitaire) if b.prix_unitaire is not None else None,
                "total": str(b.total) if b.total is not None else None,
            })
        # priceSDP + posts/articles
        sdps = db.query(DaoPriceSDP).filter(DaoPriceSDP.id_lot == l.id).all()
        for s in sdps:
            s_obj = {
                "id": s.id,
                "description": s.description,
                "quantite": str(s.quantite) if s.quantite is not None else None,
                "prix_unitaire": str(s.prix_unitaire) if s.prix_unitaire is not None else None,
                "total": str(s.total) if s.total is not None else None,
                "posts": []
            }
            posts = db.query(DaoPriceSDPPost).filter(DaoPriceSDPPost.id_sdp == s.id).all()
            for p in posts:
                p_obj = {"id": p.id, "titre": p.titre, "numero": getattr(p, 'numero', None), "articles": []}
                arts = db.query(DaoPriceSDPArticle).filter(DaoPriceSDPArticle.id_post == p.id).all()
                for a in arts:
                    # try to parse persisted elements JSON, if present
                    try:
                        parsed_elements = json.loads(a.elements) if getattr(a, 'elements', None) else []
                    except Exception:
                        parsed_elements = []

                    # Prefer the explicit cost_net_per_unit column if present; mirror into prix_unitaire for frontend
                    persisted_net = getattr(a, 'cost_net_per_unit', None)
                    persisted_pu = getattr(a, 'prix_unitaire', None)
                    # final prix_unitaire to present: prefer stored prix_unitaire, else cost_net_per_unit
                    out_prix_unitaire = (str(persisted_pu) if persisted_pu is not None else (str(persisted_net) if persisted_net is not None else None))
                    out_cost_net = (str(persisted_net) if persisted_net is not None else (str(persisted_pu) if persisted_pu is not None else None))

                    p_obj["articles"].append({
                        "id": a.id,
                        "numero": getattr(a, 'numero', None),
                        "designation": a.designation,
                        "quantite": str(a.quantite) if a.quantite is not None else None,
                        "unite": getattr(a, 'unite', None),
                        "prix_unitaire": out_prix_unitaire,
                        "total": str(a.total) if a.total is not None else None,
                        # expose the persisted cost_net_per_unit under the costNetPerUnit alias for frontend compatibility
                        "costNetPerUnit": out_cost_net,
                        "coefficientK": str(getattr(a, 'coefficient_k', None)) if getattr(a, 'coefficient_k', None) is not None else None,
                        "productionPerDay": str(getattr(a, 'production_per_day', None)) if getattr(a, 'production_per_day', None) is not None else None,
                        "elements": parsed_elements,
                    })
                s_obj["posts"].append(p_obj)
            lot["priceSDP"].append(s_obj)
        # tasks
        tasks = db.query(DaoTask).filter(DaoTask.id_lot == l.id).all()
        for t in tasks:
            t_obj = {"id": t.id, "titre": t.titre, "ordre": t.ordre, "subtasks": []}
            subs = db.query(DaoSubtask).filter(DaoSubtask.id_task == t.id).all()
            for st in subs:
                t_obj["subtasks"].append({"id": st.id, "titre": st.titre, "done": bool(st.done), "ordre": st.ordre, "content_markdown": st.content_markdown})
            lot["tasks"].append(t_obj)

        lots.append(lot)

    return {"dao_id": dao.id, "document_id": dao.document_id, "lots": lots}


@router.get("/")
def list_daos(db: Session = Depends(get_db)):
    """Return list of persisted DAOs with their document metadata."""
    daos = db.query(DAO).all()
    out = []
    for d in daos:
        # Skip DAOs without valid document_id or without existing document
        if d.document_id is None:
            continue
        doc = db.get(Document, d.document_id)
        if doc is None:
            continue
        
        out.append({
            "dao_id": d.id,
            "document_id": d.document_id,
            "reference": getattr(d, 'reference', None),
            "original_name": getattr(doc, 'original_name', None),
            "original_filename": getattr(doc, 'original_filename', None),
            "filename": getattr(doc, 'filename', None),
        })
    return out


@router.delete("/cleanup_orphaned", status_code=status.HTTP_200_OK)
def cleanup_orphaned_daos(db: Session = Depends(get_db)):
    """Supprime les DAOs orphelins (sans document associé valide)."""
    # Trouver les DAOs orphelins
    orphaned_daos = db.query(DAO).filter(DAO.document_id.is_(None)).all()
    orphaned_count = len(orphaned_daos)
    
    if orphaned_count == 0:
        return {"message": "Aucun DAO orphelin trouvé", "deleted_count": 0}
    
    # Supprimer les DAOs orphelins (cascade supprimera automatiquement les lots et données associées)
    for dao in orphaned_daos:
        db.delete(dao)
    
    db.commit()
    
    return {"message": f"{orphaned_count} DAO(s) orphelin(s) supprimé(s)", "deleted_count": orphaned_count}


@router.get("/{document_id}/lots/{lot_id}/workforce")
def get_lot_workforce(document_id: int, lot_id: int, db: Session = Depends(get_db)):
    """Return the list of DaoPriceMO rows for a given document_id and lot_id.
    This uses the same serialization format as the main GET /{document_id} endpoint.
    """
    dao = db.query(DAO).filter(DAO.document_id == document_id).first()
    if not dao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DAO introuvable")

    lot = db.query(DaoLot).filter(DaoLot.id == lot_id, DaoLot.id_dao == dao.id).first()
    if not lot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lot introuvable pour ce DAO")

    mos = db.query(DaoPriceMO).filter(DaoPriceMO.id_lot == lot.id).all()
    out = []
    for m in mos:
        out.append({
            "id": m.id,
            "poste": m.poste,
            "horaire_mensuel": str(m.horaire_mensuel) if m.horaire_mensuel is not None else None,
            "charges": str(m.charges) if m.charges is not None else None,
            "temps": str(m.temps) if m.temps is not None else None,
            "salaire_horaire": str(m.salaire_horaire) if m.salaire_horaire is not None else None,
            "total": str(m.total) if m.total is not None else None,
        })

    return out


@router.put("/{document_id}/lots/{lot_id}/workforce")
def put_lot_workforce(document_id: int, lot_id: int, payload: List[Dict], db: Session = Depends(get_db)):
    """Replace DaoPriceMO rows for a given lot with the provided payload (list of objects).

    Expected payload item keys (any of): poste, horaireMensuel/horaire_mensuel/horaire, charges, temps, salaireHoraire/salaire_horaire/valeurHoraireMensuel, total
    Values will be converted to Decimal when possible.
    """
    dao = db.query(DAO).filter(DAO.document_id == document_id).first()
    if not dao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DAO introuvable")

    lot = db.query(DaoLot).filter(DaoLot.id == lot_id, DaoLot.id_dao == dao.id).first()
    if not lot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lot introuvable pour ce DAO")

    from decimal import Decimal

    def to_decimal(v):
        if v is None or v == "":
            return None
        try:
            return Decimal(str(v))
        except Exception:
            return None

    try:
        # Delete existing rows for this lot
        db.query(DaoPriceMO).filter(DaoPriceMO.id_lot == lot.id).delete(synchronize_session=False)

        # Insert new rows
        for mo in payload or []:
            poste = mo.get('poste') or mo.get('name') or ''
            horaire_mensuel = to_decimal(mo.get('horaireMensuel') or mo.get('horaire_mensuel') or mo.get('horaire'))
            charges = to_decimal(mo.get('charges'))
            temps = to_decimal(mo.get('temps'))
            salaire_horaire = to_decimal(mo.get('salaireHoraire') or mo.get('salaire_horaire') or mo.get('valeurHoraireMensuel') or mo.get('salaireMensuel'))
            total = to_decimal(mo.get('total'))

            pm = DaoPriceMO(
                id_lot=lot.id,
                poste=poste,
                horaire_mensuel=horaire_mensuel,
                charges=charges,
                temps=temps,
                salaire_horaire=salaire_horaire,
                total=total,
            )
            db.add(pm)

        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Impossible d'enregistrer la main d'oeuvre: {str(e)}")

    return {"status": "ok", "saved": len(payload or [])}

@router.get("/{document_id}/lots/{lot_id}/materials")
def get_lot_materials(document_id: int, lot_id: int, db: Session = Depends(get_db)):
    """Return the list of DaoPriceMTX rows for a given document_id and lot_id.
    Serialized fields include transport, taxes, perte_percent and perte_valeur.
    """
    dao = db.query(DAO).filter(DAO.document_id == document_id).first()
    if not dao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DAO introuvable")

    lot = db.query(DaoLot).filter(DaoLot.id == lot_id, DaoLot.id_dao == dao.id).first()
    if not lot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lot introuvable pour ce DAO")

    mtxs = db.query(DaoPriceMTX).filter(DaoPriceMTX.id_lot == lot.id).all()
    out = []
    for m in mtxs:
        out.append({
            "id": m.id,
            "designation": m.designation,
            "quantite": str(m.quantite) if m.quantite is not None else None,
            "prix_unitaire": str(m.prix_unitaire) if m.prix_unitaire is not None else None,
            "unite": m.unite,
            "origine": m.origine,
            "transport": str(m.transport) if getattr(m, 'transport', None) is not None else None,
            "taxes": str(m.taxes) if getattr(m, 'taxes', None) is not None else None,
            "perte_percent": str(m.perte_percent) if getattr(m, 'perte_percent', None) is not None else None,
            "perte_valeur": str(m.perte_valeur) if getattr(m, 'perte_valeur', None) is not None else None,
            "total": str(m.total) if m.total is not None else None,
        })

    return out


@router.put("/{document_id}/lots/{lot_id}/materials")
def put_lot_materials(document_id: int, lot_id: int, payload: List[Dict], db: Session = Depends(get_db)):
    """Replace DaoPriceMTX rows for a given lot with the provided payload (list of objects).

    Accepts flexible keys and persists transport/taxes/perte fields.
    """
    dao = db.query(DAO).filter(DAO.document_id == document_id).first()
    if not dao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DAO introuvable")

    lot = db.query(DaoLot).filter(DaoLot.id == lot_id, DaoLot.id_dao == dao.id).first()
    if not lot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lot introuvable pour ce DAO")

    from decimal import Decimal

    def to_decimal(v):
        if v is None or v == "":
            return None
        try:
            return Decimal(str(v))
        except Exception:
            return None

    try:
        db.query(DaoPriceMTX).filter(DaoPriceMTX.id_lot == lot.id).delete(synchronize_session=False)

        for m in payload or []:
            designation = m.get('designation') or m.get('description') or m.get('name') or ''
            quantite = to_decimal(m.get('quantite'))
            prix_unitaire = to_decimal(m.get('pu') or m.get('prix_unitaire') or m.get('price_unit') or m.get('prixUnitaire'))
            unite = m.get('unite') or m.get('unit') or None
            origine = m.get('origine') or m.get('origin') or None
            transport = to_decimal(m.get('transport') or m.get('frais_transport') or m.get('transport_fees'))
            taxes = to_decimal(m.get('taxes') or m.get('droits') or m.get('duties'))
            perte_percent = to_decimal(m.get('perte_percent') or m.get('ppercent') or m.get('pertePercent') or m.get('perte'))
            perte_valeur = to_decimal(m.get('perte_valeur') or m.get('pvaleur') or m.get('perteValeur'))
            total = to_decimal(m.get('total'))

            mm = DaoPriceMTX(
                id_lot=lot.id,
                designation=designation,
                quantite=quantite,
                prix_unitaire=prix_unitaire,
                unite=unite,
                origine=origine,
                transport=transport,
                taxes=taxes,
                perte_percent=perte_percent,
                perte_valeur=perte_valeur,
                total=total,
            )
            db.add(mm)

        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Impossible d'enregistrer les matériaux: {str(e)}")

    return {"status": "ok", "saved": len(payload or [])}

@router.put("/{document_id}/lots/{lot_id}/equipments")
def put_lot_equipments(document_id: int, lot_id: int, payload: List[Dict], db: Session = Depends(get_db)):
    """Replace DaoPriceEQU rows for a given lot with the provided payload (list of objects).

    Expected payload item keys (any of): designation/description/name, quantite, prix_unitaire/pu/prixUnitaire, total
    Values will be converted to Decimal when possible.
    """
    dao = db.query(DAO).filter(DAO.document_id == document_id).first()
    if not dao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DAO introuvable")

    lot = db.query(DaoLot).filter(DaoLot.id == lot_id, DaoLot.id_dao == dao.id).first()
    if not lot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lot introuvable pour ce DAO")

    from decimal import Decimal

    def to_decimal(v):
        if v is None or v == "":
            return None
        try:
            return Decimal(str(v))
        except Exception:
            return None

    try:
        # Delete existing equipment rows for this lot
        db.query(DaoPriceEQU).filter(DaoPriceEQU.id_lot == lot.id).delete(synchronize_session=False)

        # Insert new rows
        for e in payload or []:
            designation = e.get('designation') or e.get('description') or e.get('name') or ''
            # Accept multiple possible keys coming from frontend: prefer explicit quantite, else nj/nb_jours
            quantite = to_decimal(e.get('quantite') or e.get('nj') or e.get('nb_jours') or e.get('quantite_jours') or e.get('quantity') or e.get('quantite_valeur'))
            # prix_unitaire may be sent as prix_unitaire, vr, pu or price_unit
            prix_unitaire = to_decimal(e.get('prix_unitaire') or e.get('prixUnitaire') or e.get('pu') or e.get('vr') or e.get('price_unit') or e.get('unit_price') or e.get('valeur_unitaire'))
            # total may be sent as total, tj, total_h, total_jour
            total = to_decimal(e.get('total') or e.get('tj') or e.get('total_h') or e.get('total_jour') or e.get('montant') )

            # additional fields
            materiel_id = e.get('materiel_id') or e.get('materielId') or e.get('materiel') or None
            dt_percent = to_decimal(e.get('dt_percent') or e.get('dt') or e.get('dtPercent') )
            dt_value = to_decimal(e.get('dt_value') or e.get('dtValue') )
            vr_plus_taxes = to_decimal(e.get('vr_plus_taxes') or e.get('vrPlusTaxes') or e.get('vr_plus_taxes_value') )
            nj = to_decimal(e.get('nj') or e.get('nb_jours') or e.get('quantite'))
            amort_j = to_decimal(e.get('amort_j') or e.get('amort_jour') or e.get('amort_j_value'))
            cc = to_decimal(e.get('cc') or e.get('carburant') )
            cl = to_decimal(e.get('cl') or e.get('lub') or e.get('lubrifiant'))
            cpr = to_decimal(e.get('cpr') or e.get('pr') or e.get('pieces_rechange'))
            tlpr_percent = to_decimal(e.get('tlpr_percent') or e.get('tlpr') or e.get('taxe_l_pr_percent'))
            tlpr_value = to_decimal(e.get('tlpr_value') or e.get('tlprValue') )
            cmo = to_decimal(e.get('cmo') or e.get('main_oeuvre') or e.get('cmo_val'))
            tj = to_decimal(e.get('tj') or e.get('total_jour') or e.get('total'))
            twm = to_decimal(e.get('twm') or e.get('twm_hours') or e.get('twm_h'))
            total_h = to_decimal(e.get('total_h') or e.get('total_h_val') or e.get('totalHour'))

            ne = DaoPriceEQU(
                id_lot=lot.id,
                designation=designation,
                quantite=quantite,
                prix_unitaire=prix_unitaire,
                total=total,
                materiel_id=materiel_id,
                dt_percent=dt_percent,
                dt_value=dt_value,
                vr_plus_taxes=vr_plus_taxes,
                nj=nj,
                amort_j=amort_j,
                cc=cc,
                cl=cl,
                cpr=cpr,
                tlpr_percent=tlpr_percent,
                tlpr_value=tlpr_value,
                cmo=cmo,
                tj=tj,
                twm=twm,
                total_h=total_h,
            )
            db.add(ne)

        db.commit()
    except Exception as ex:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Impossible d'enregistrer les équipements: {str(ex)}")

    return {"status": "ok", "saved": len(payload or [])}

@router.put("/{document_id}/lots/{lot_id}/sdp")
def put_lot_sdp(document_id: int, lot_id: int, payload: List[Dict], db: Session = Depends(get_db)):
    """Replace DaoPriceSDP (sous-détail de prix) rows for a given lot with the provided payload (list of objects).

    Expected payload structure: [ { description?, quantite?, prix_unitaire?, total?, posts: [ { titre?, ordre?, articles: [ { designation?, quantite?, prix_unitaire?, total? }, ... ] }, ... ] }, ... ]
    """
    logger.info("put_lot_sdp called: document_id=%s lot_id=%s payload_items=%s", document_id, lot_id, len(payload or []))
    try:
        logger.debug("payload preview: %s", json.dumps((payload or [])[:5], ensure_ascii=False))
    except Exception:
        # don't fail on logging
        logger.debug("payload contains non-serializable items, skipping preview")

    dao = db.query(DAO).filter(DAO.document_id == document_id).first()
    if not dao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DAO introuvable")

    lot = db.query(DaoLot).filter(DaoLot.id == lot_id, DaoLot.id_dao == dao.id).first()
    if not lot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lot introuvable pour ce DAO")

    from decimal import Decimal

    def to_decimal(v):
        if v is None or v == "":
            return None
        try:
            return Decimal(str(v))
        except Exception:
            return None

    try:
        # Delete existing SDP entries (cascade will remove posts/articles)
        existing_sdps = db.query(DaoPriceSDP).filter(DaoPriceSDP.id_lot == lot.id).all()
        logger.debug("existing sdps count=%s", len(existing_sdps))
        for s in existing_sdps:
            db.delete(s)
        db.flush()

        saved = 0
        for sdp in payload or []:
            description = sdp.get('description') or sdp.get('titre') or sdp.get('name') or None
            quantite = to_decimal(sdp.get('quantite'))
            prix_unitaire = to_decimal(sdp.get('prix_unitaire') or sdp.get('prixUnitaire') or sdp.get('pu'))
            total = to_decimal(sdp.get('total'))

            s = DaoPriceSDP(
                id_lot=lot.id,
                description=description,
                quantite=quantite,
                prix_unitaire=prix_unitaire,
                total=total,
            )
            db.add(s)
            db.flush()

            for post in sdp.get('posts') or sdp.get('posts_list') or []:
                titre = post.get('titre') or post.get('title') or post.get('name') or ''
                # debug: log incoming post numéro if présent
                try:
                    logger.debug("persisting post for sdp_id=%s: titre=%s, numero=%s, keys=%s", s.id, titre, post.get('numero'), list(post.keys()))
                except Exception:
                    logger.debug("persisting post: unable to show numero or keys")
                p = DaoPriceSDPPost(id_sdp=s.id, titre=titre, ordre=post.get('ordre'), numero=post.get('numero') or post.get('numero_poste') or None)
                db.add(p)
                db.flush()

                for art in post.get('articles') or post.get('items') or []:
                    designation = art.get('designation') or art.get('name') or ''
                    quant_a = to_decimal(art.get('quantite'))
                    # Accept explicit prix_unitaire or client-provided aliases and persist directly
                    pu_direct = to_decimal(art.get('prix_unitaire') or art.get('prixUnitaire') or art.get('pu'))
                    pu_net = to_decimal(art.get('costNetPerUnit') or art.get('cost_per_unit') or art.get('costPerUnit') or art.get('cost_net_per_unit'))
                    pu = pu_direct if pu_direct is not None else pu_net
                    total_a = to_decimal(art.get('total'))
                    elements_payload = art.get('elements') if isinstance(art.get('elements'), (list, dict)) else None
                    a = DaoPriceSDPArticle(
                        id_post=p.id,
                        designation=designation,
                        numero=art.get('numero') or art.get('numero_article') or None,
                        quantite=quant_a,
                        unite=art.get('unite') or art.get('unit') or None,
                        prix_unitaire=pu,
                        # also store the explicit cost_net_per_unit column when provided
                        cost_net_per_unit=pu_net,
                        total=total_a,
                        coefficient_k=to_decimal(art.get('coefficientK') or art.get('coefficient_k')),
                        production_per_day=to_decimal(art.get('productionPerDay') or art.get('production_per_day')),
                        elements=(json.dumps(elements_payload, ensure_ascii=False) if elements_payload is not None else None),
                    )
                    db.add(a)

            saved += 1

        db.commit()
    except Exception as e:
        logger.exception("Failed to persist SDP for document_id=%s lot_id=%s", document_id, lot_id)
        db.rollback()
        # return a richer error to the caller for debugging (kept French message for consistency)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Impossible d'enregistrer le sous-détail de prix: {str(e)}")

    return {"status": "ok", "saved": saved}