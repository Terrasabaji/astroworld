"""MODULE 1 — Mooka Prashna (silent question deduction)."""

from __future__ import annotations

from typing import Any, Dict, List

from .constants import CATEGORY_HOUSES, MOOKA_LABELS
from .models import Chart


def _add_houses(scores: Dict[int, float], houses: List[int], weight: float) -> None:
    for h in houses:
        if 1 <= h <= 12:
            scores[h] = scores.get(h, 0.0) + weight


def _sig_houses(chart: Chart, planet_name: str) -> List[int]:
    block = chart.significators.get(planet_name) or {}
    return list(block.get("all_signified_houses") or [])


def deduce_mooka_question(chart: Chart) -> Dict[str, Any]:
    """
    Cross-reference Moon sign/star/sub lords and Lagna sub-lord significations
    to deduce the querent's silent concern.
    """
    scores = {h: 0.0 for h in range(1, 13)}
    moon = chart.planet("Moon")
    asc = chart.ascendant

    notes: List[str] = []

    # Lagna Sub Lord — strongest silent indicator
    if asc.sub_lord:
        hs = _sig_houses(chart, asc.sub_lord)
        _add_houses(scores, hs, 5.0)
        notes.append(
            f"Lagna sub-lord {asc.sub_lord} signifies houses {hs or '—'}."
        )

    if moon:
        # Moon's occupied house (mind)
        scores[moon.house] = scores.get(moon.house, 0.0) + 3.0
        notes.append(f"Moon occupies house {moon.house} ({moon.sign}).")

        # Moon sign lord
        if moon.sign_lord:
            hs = _sig_houses(chart, moon.sign_lord)
            _add_houses(scores, hs, 2.0)
            notes.append(f"Moon sign-lord {moon.sign_lord} signifies {hs or '—'}.")

        # Moon star lord
        if moon.star_lord:
            hs = _sig_houses(chart, moon.star_lord)
            _add_houses(scores, hs, 3.0)
            notes.append(f"Moon star-lord {moon.star_lord} signifies {hs or '—'}.")

        # Moon sub lord
        if moon.sub_lord:
            hs = _sig_houses(chart, moon.sub_lord)
            _add_houses(scores, hs, 2.5)
            notes.append(f"Moon sub-lord {moon.sub_lord} signifies {hs or '—'}.")

    # Score categories
    cat_scores: Dict[str, float] = {}
    for cat, spec in CATEGORY_HOUSES.items():
        cat_scores[cat] = sum(scores.get(h, 0.0) for h in spec["favorable"])

    ranked = sorted(cat_scores.items(), key=lambda x: -x[1])
    top = [
        {
            "category": c,
            "label": CATEGORY_HOUSES[c]["label"],
            "score": round(s, 2),
            "question": MOOKA_LABELS.get(c, CATEGORY_HOUSES[c]["label"]),
            "primary_house": CATEGORY_HOUSES[c]["primary"],
            "favorable_houses": list(CATEGORY_HOUSES[c]["favorable"]),
            "denial_houses": list(CATEGORY_HOUSES[c]["denial"]),
            "karaka": CATEGORY_HOUSES[c]["karaka"],
        }
        for c, s in ranked
        if s > 0
    ][:5]

    best = top[0] if top else {
        "category": "career",
        "label": CATEGORY_HOUSES["career"]["label"],
        "score": 0.0,
        "question": MOOKA_LABELS["career"],
        "primary_house": 10,
        "favorable_houses": CATEGORY_HOUSES["career"]["favorable"],
        "denial_houses": CATEGORY_HOUSES["career"]["denial"],
        "karaka": "Sun",
    }

    deduced = best["question"]
    return {
        "mode": "mooka",
        "deduced_query": deduced,
        "category": best["category"],
        "label": best["label"],
        "primary_house": best["primary_house"],
        "favorable_houses": list(best["favorable_houses"]),
        "denial_houses": list(best["denial_houses"]),
        "karaka": best["karaka"],
        "candidates": top,
        "house_scores": {str(k): round(v, 2) for k, v in scores.items()},
        "moon": {
            "sign": moon.sign if moon else None,
            "sign_lord": moon.sign_lord if moon else None,
            "star_lord": moon.star_lord if moon else None,
            "sub_lord": moon.sub_lord if moon else None,
            "house": moon.house if moon else None,
            "nakshatra": moon.nakshatra if moon else None,
        },
        "lagna_sub_lord": asc.sub_lord,
        "notes": notes,
    }
