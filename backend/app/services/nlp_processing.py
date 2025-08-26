import os
from typing import Optional, Dict, List, Any
import json
import re

from ..core.config import OPENAI_API_KEY, OPENAI_MODEL, OPENAI_BASE_URL

_OPENAI_AVAILABLE = bool(OPENAI_API_KEY)

try:
    # Lazy import to keep startup fast if not used
    from openai import OpenAI  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    OpenAI = None  # type: ignore
    _OPENAI_AVAILABLE = False


def _build_client() -> Optional["OpenAI"]:
    if not _OPENAI_AVAILABLE or OpenAI is None:
        return None
    if OPENAI_BASE_URL:
        return OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)
    return OpenAI(api_key=OPENAI_API_KEY)


def extract_structured_info(text: str) -> Dict[str, Any]:
    """Extract structured information from DAO text using GPT."""
    text = (text or "").strip()
    if not text:
        return {}

    client = _build_client()
    if client is None:
        return {}

    prompt = """
    Tu es un expert en marchés publics francophones. Analyse le DAO fourni et extrait les informations structurées suivantes au format JSON :

    {
        "objet": "Description concise de l'objet du marché",
        "client": "Nom du client/maître d'ouvrage",
        "date_limite": "Date limite de soumission (format YYYY-MM-DD)",
        "montant_estime": "Montant estimé du marché",
        "lots": ["Liste des lots ou sections"],
        "exigences_techniques": ["Exigences techniques principales"],
        "documents_requis": ["Documents à fournir obligatoirement"],
        "garanties": ["Types de garanties demandées"],
        "criteres_evaluation": ["Critères d'évaluation"],
        "duree_travaux": "Durée estimée des travaux",
        "lieu_execution": "Lieu d'exécution des travaux",
        "conditions_particulieres": ["Conditions particulières importantes"]
    }

    Règles :
    - Réponds UNIQUEMENT en JSON valide
    - Si une information n'est pas trouvée, utilise null
    - Pour les listes, limite à 5 éléments maximum
    - Extrais les montants en euros
    - Identifie les dates au format français ou international
    - Sois précis et factuel

    Texte du DAO :
    """ + text[:15000]

    try:
        resp = client.responses.create(
            model=OPENAI_MODEL,
            input=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_output_tokens=800,
        )
        
        content = resp.output_text if hasattr(resp, "output_text") else None
        if not content and hasattr(resp, "choices") and resp.choices:
            msg = resp.choices[0].message
            if isinstance(msg, dict):
                content = msg.get("content")
            else:
                content = getattr(msg, "content", None)
        
        if content:
            # Nettoyer le JSON et le parser
            json_str = re.search(r'\{.*\}', content, re.DOTALL)
            if json_str:
                return json.loads(json_str.group())
    except Exception as e:
        print(f"Erreur extraction structurée: {e}")
    
    return {}


def summarize(text: str) -> str:
    """Summarize DAO text using GPT if configured, else return an empty string."""
    text = (text or "").strip()
    if not text:
        return ""

    client = _build_client()
    if client is None:
        return ""

    prompt = """
    Tu es un assistant spécialisé en marchés publics francophones. 
    
    RÉSUMÉ EXECUTIF (≤ 200 mots) :
    - Objet principal du marché
    - Client/maître d'ouvrage
    - Montant estimé et durée
    - Date limite de soumission
    - Points critiques à retenir
    
    INFORMATIONS TECHNIQUES (≤ 150 mots) :
    - Exigences techniques principales
    - Spécifications importantes
    - Contraintes particulières
    
    DOCUMENTS ET GARANTIES (≤ 100 mots) :
    - Documents obligatoires
    - Garanties demandées
    - Critères d'évaluation
    
    Réponds en Markdown avec des sections claires et des puces pour la lisibilité.
    
    Texte source :
    """ + text[:12000]

    try:
        resp = client.responses.create(
            model=OPENAI_MODEL,
            input=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_output_tokens=600,
        )
        
        content = resp.output_text if hasattr(resp, "output_text") else None
        if not content and hasattr(resp, "choices") and resp.choices:
            msg = resp.choices[0].message
            if isinstance(msg, dict):
                content = msg.get("content")
            else:
                content = getattr(msg, "content", None)
        return content or ""
    except Exception as e:
        print(f"Erreur résumé: {e}")
        return ""


def extract_key_phrases(text: str, keywords: List[str]) -> List[str]:
    """Extract key phrases containing specific keywords."""
    if not text or not keywords:
        return []
    
    sentences = re.split(r'[.!?]+', text)
    key_phrases = []
    
    for sentence in sentences:
        sentence = sentence.strip()
        if any(keyword.lower() in sentence.lower() for keyword in keywords):
            if len(sentence) > 20 and len(sentence) < 200:
                key_phrases.append(sentence)
    
    return key_phrases[:10]  # Limiter à 10 phrases


def generate_markdown_table(extracted_info: Dict[str, Any]) -> str:
    """Generate a markdown table from extracted information."""
    if not extracted_info:
        return ""
    
    table_rows = ["| Rubrique | Détails |", "|---|---|"]
    
    # Mapping des rubriques avec leurs clés
    rubriques = {
        "📋 Objet": "objet",
        "👤 Client": "client", 
        "⏰ Date limite": "date_limite",
        "💰 Montant estimé": "montant_estime",
        "📦 Lots": "lots",
        "🔧 Exigences techniques": "exigences_techniques",
        "📄 Documents requis": "documents_requis",
        "🛡️ Garanties": "garanties",
        "📊 Critères d'évaluation": "criteres_evaluation",
        "⏱️ Durée des travaux": "duree_travaux",
        "📍 Lieu d'exécution": "lieu_execution",
        "⚡ Conditions particulières": "conditions_particulieres"
    }
    
    for rubrique, key in rubriques.items():
        value = extracted_info.get(key)
        if value:
            if isinstance(value, list):
                cell_content = " • " + " • ".join(str(item) for item in value[:3])
            else:
                cell_content = str(value)
            
            # Échapper les caractères spéciaux markdown
            cell_content = cell_content.replace("|", "\\|").replace("\n", " ")
            table_rows.append(f"| {rubrique} | {cell_content} |")
    
    return "\n".join(table_rows)

