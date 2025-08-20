import os
from typing import Optional

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


def summarize(text: str) -> str:
    """Summarize DAO text using GPT if configured, else return an empty string.

    Returns empty string on failure so callers can fallback to heuristic summary.
    """
    text = (text or "").strip()
    if not text:
        return ""

    client = _build_client()
    if client is None:
        return ""

    prompt = (
        "Tu es un assistant spécialisé en marchés publics francophones. "
        "Résume le DAO fourni en un aperçu structuré et concis (≤ 250 mots) en français, "
        "en mettant l'accent sur: objet, lots, exigences techniques, documents requis, garanties, échéances et critères clés. "
        "Réponds en Markdown avec des sections claires.\n\n"
        "Texte source (peut contenir du bruit):\n" + text[:12000]
    )

    try:
        # Use responses API for both OpenAI and compatible providers
        resp = client.responses.create(
            model=OPENAI_MODEL,
            input=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_output_tokens=400,
        )
        # Extract text depending on SDK shape
        content = resp.output_text if hasattr(resp, "output_text") else None
        if not content and hasattr(resp, "choices") and resp.choices:
            msg = resp.choices[0].message
            if isinstance(msg, dict):
                content = msg.get("content")  # type: ignore
            else:
                content = getattr(msg, "content", None)
        return content or ""
    except Exception:
        return ""

