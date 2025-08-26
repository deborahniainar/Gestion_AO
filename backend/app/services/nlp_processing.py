import os
from typing import Optional, Dict, List, Any
import json
import re
from typing import Optional, Dict, List, Any
import json
import re

from ..core.config import settings

_OPENAI_AVAILABLE = bool(settings.OPENAI_API_KEY)

try:
    # Lazy import to keep startup fast if not used
    from openai import OpenAI  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    OpenAI = None  # type: ignore
    _OPENAI_AVAILABLE = False


def _build_client() -> Optional["OpenAI"]:
    if not _OPENAI_AVAILABLE or OpenAI is None:
        return None
    if settings.OPENAI_BASE_URL:
        return OpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)
    return OpenAI(api_key=settings.OPENAI_API_KEY)


def extract_structured_info(text: str) -> Dict[str, Any]:
  """Extract structured information from DAO text using GPT."""
  text = (text or "").strip()
  if not text:
    return {}

  client = _build_client()
  if client is None:
    print("OpenAI client not available, using fallback")
    # Fallback: Basic text processing when OpenAI is not available
    return _extract_structured_info_fallback(text)

  print(f"Using OpenAI model: {settings.OPENAI_MODEL}")
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
    resp = client.chat.completions.create(
      model=settings.OPENAI_MODEL,
      messages=[{"role": "user", "content": prompt}],
      temperature=0.1,
      max_tokens=800,
    )
    
    content = resp.choices[0].message.content if resp.choices else None
    
    if content:
      print(f"OpenAI response received, content length: {len(content)}")
      # Nettoyer le JSON et le parser
      json_str = re.search(r'\{.*\}', content, re.DOTALL)
      if json_str:
        return json.loads(json_str.group())
  except Exception as e:
    print(f"Erreur extraction structurée: {e}")
  
  # Fallback: Basic text processing when OpenAI fails
  return _extract_structured_info_fallback(text)

def _extract_structured_info_fallback(text: str) -> Dict[str, Any]:
  """Fallback method to extract structured information without OpenAI."""
  # Basic regex-based extraction
  result = {}
  
  # Extract objet (look for common patterns)
  objet_match = re.search(r"(?:objet|objet du march[eé]|objet de l'appel d'offre)[:\s]*([^\n\r.]{10,200})", text, re.IGNORECASE)
  if objet_match:
    result["objet"] = objet_match.group(1).strip()
  
  # Extract client
  client_match = re.search(r"(?:client|ma[iî]tre d'ouvrage|acheteur)[:\s]*([^\n\r.]{5,100})", text, re.IGNORECASE)
  if client_match:
    result["client"] = client_match.group(1).strip()
  
  # Extract date limite
  date_match = re.search(r"(?:date limite|cl[oô]ture|fin de d[eé]p[oô]t)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s*(?:janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre)\s*\d{2,4})", text, re.IGNORECASE)
  if date_match:
    result["date_limite"] = date_match.group(1).strip()
  
  # Extract montant
  montant_match = re.search(r"(?:montant|prix|co[uû]t)[:\s]*([0-9\s.,]+(?:euros?|€|dh|dhs?|mad))", text, re.IGNORECASE)
  if montant_match:
    result["montant_estime"] = montant_match.group(1).strip()
  
  # Extract lots
  lots_matches = re.findall(r"(?:lot\s*[0-9]+|lot\s+[a-z])[^\n\r.]{5,100}", text, re.IGNORECASE)
  if lots_matches:
    result["lots"] = [lot.strip() for lot in lots_matches[:5]]  # Limit to 5 lots
  
  # Extract documents requis (common ones)
  docs = []
  if re.search(r"lettre\s+de\s+soumission", text, re.IGNORECASE):
    docs.append("Lettre de soumission")
  if re.search(r"d[eé]claration\s+d'honneur", text, re.IGNORECASE):
    docs.append("Déclaration d'honneur")
  if re.search(r"attestation\s+d'assurance", text, re.IGNORECASE):
    docs.append("Attestation d'assurance")
  if re.search(r"qualification|agr[eé]ment", text, re.IGNORECASE):
    docs.append("Attestation de qualification")
  if docs:
    result["documents_requis"] = docs
  
  return result


def summarize(text: str) -> str:
  """Summarize DAO text using GPT if configured, else return a basic summary."""
  text = (text or "").strip()
  if not text:
      return ""

  client = _build_client()
  if client is None:
      print("OpenAI client not available for summarization, using fallback")
      # Fallback: Basic summary when OpenAI is not available
      return _summarize_fallback(text)

  print(f"Using OpenAI model for summarization: {settings.OPENAI_MODEL}")
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
    resp = client.chat.completions.create(
      model=settings.OPENAI_MODEL,
      messages=[{"role": "user", "content": prompt}],
      temperature=0.2,
      max_tokens=600,
    )
    
    content = resp.choices[0].message.content if resp.choices else None
    if content:
      print(f"OpenAI summary response received, content length: {len(content)}")
    return content or ""
  except Exception as e:
    print(f"Erreur résumé: {e}")
    # Fallback: Basic summary when OpenAI fails
    return _summarize_fallback(text)


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


def _summarize_fallback(text: str) -> str:
    """Fallback method to create a basic summary without OpenAI."""
    # Extract first few sentences as a basic summary
    sentences = re.split(r'[.!?]+', text)
    summary_sentences = []
    
    # Add the first few non-empty sentences
    for sentence in sentences:
        sentence = sentence.strip()
        if sentence and len(sentence) > 20:
            summary_sentences.append(sentence)
            if len(summary_sentences) >= 5:  # Limit to 5 sentences
                break
    
    if not summary_sentences:
        return "Résumé non disponible."
    
    # Create a simple markdown summary
    summary = "# Résumé du DAO\n\n"
    summary += "## Extrait du document\n\n"
    for i, sentence in enumerate(summary_sentences, 1):
        summary += f"{i}. {sentence}.\n"
    
    return summary

