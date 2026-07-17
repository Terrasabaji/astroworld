"""Basic keyword NLP for mapping Prashna questions to houses."""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from .constants import CATEGORY_HOUSES, KEYWORD_MAP


def _normalize(text: str) -> str:
    cleaned = re.sub(r"[^a-z0-9\s\-]", " ", (text or "").lower())
    return re.sub(r"\s+", " ", cleaned).strip()


def map_query_to_houses(question_text: str, category_hint: Optional[str] = None) -> Dict[str, Any]:
    """
    Extract keywords from a free-text query and map to a primary category / houses.
    Falls back to category_hint when provided.
    """
    text = _normalize(question_text)
    hits: List[str] = []
    categories: Dict[str, int] = {}

    # Prefer multi-word keys first
    keys = sorted(KEYWORD_MAP.keys(), key=len, reverse=True)
    padded = f" {text} "
    for key in keys:
        token = f" {key} "
        if token in padded:
            cat = KEYWORD_MAP[key]
            hits.append(key)
            categories[cat] = categories.get(cat, 0) + 1
            # avoid double-counting shorter keys inside longer matches
            padded = padded.replace(token, " ")

    chosen = None
    if categories:
        chosen = sorted(categories.items(), key=lambda x: (-x[1], x[0]))[0][0]
    elif category_hint and category_hint in CATEGORY_HOUSES:
        chosen = category_hint
    else:
        chosen = "fortune"  # neutral open-ended fallback (9th) rather than forcing career

    spec = CATEGORY_HOUSES[chosen]
    return {
        "category": chosen,
        "label": spec["label"],
        "primary_house": spec["primary"],
        "favorable_houses": list(spec["favorable"]),
        "denial_houses": list(spec["denial"]),
        "karaka": spec["karaka"],
        "keywords": sorted(set(hits)),
        "question_text": question_text or "",
        "confidence": "high" if hits else ("medium" if category_hint else "low"),
    }
