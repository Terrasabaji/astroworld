"""Master Prashna analysis — ONLY two types: Mooka and Manual."""

from __future__ import annotations

from typing import Any, Dict

from .chart_builder import cast_prashna_chart
from .constants import CATEGORY_HOUSES
from .kp_engine import KP_Engine
from .mooka import deduce_mooka_question
from .nlp import map_query_to_houses
from .parashara_engine import Parashara_Engine

VALID_MODES = frozenset({"mooka", "manual"})


def _build_justification(
    mode: str,
    query_block: dict,
    promise: dict,
    timing: dict,
    parashara: dict,
) -> str:
    parts = []
    if mode == "mooka":
        parts.append(f"Mooka Prashna deduced query: {query_block.get('deduced_query')}")
        if query_block.get("notes"):
            parts.append(" ".join(query_block["notes"]))
    else:
        parts.append(
            f"Manual Prashna parsed query maps to {query_block.get('label')} "
            f"(primary house {query_block.get('primary_house')}; "
            f"keywords: {', '.join(query_block.get('keywords') or []) or 'none'})."
        )

    parts.append(promise.get("reason") or "")

    taj = parashara.get("tajika") or {}
    if taj.get("notes"):
        parts.append(" ".join(taj["notes"]))

    kar = parashara.get("karaka_dignity") or {}
    if kar.get("planet"):
        parts.append(
            f"Karaka {kar['planet']} in D1 is {kar.get('d1_status')} ({kar.get('d1_sign')}) "
            f"and in D9 is {kar.get('d9_status')} ({kar.get('d9_sign')})."
        )

    al = parashara.get("arudha_lagna") or {}
    if al.get("note"):
        parts.append(al["note"])

    if timing.get("summary"):
        parts.append(f"Timing (DBA/RPs): {timing['summary']}")

    return " ".join(p for p in parts if p).strip()


def run_prashna_analysis(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Master entry point for Prashna.

    ONLY two modes are accepted:
      - mooka  : silent question (timestamp + coordinates; no question text)
      - manual : explicit question text + timestamp + coordinates
                 (+ optional KP horary number 1–249)

    Returns JSON with:
      parsed_query / deduced_query,
      the_promise_result (bool),
      timing_prediction,
      astrological_justification
    """
    mode = (input_data.get("mode") or "manual").lower().strip()
    if mode not in VALID_MODES:
        raise ValueError(
            "Prashna supports only two types: mode='mooka' or mode='manual'."
        )

    chart = cast_prashna_chart(input_data)
    kp = KP_Engine(chart, input_data)
    para = Parashara_Engine(chart)

    if mode == "mooka":
        # MODULE 1 — Silent Question
        if (input_data.get("question_text") or input_data.get("question") or "").strip():
            raise ValueError(
                "Mooka Prashna must not include a question text. "
                "Use mode='manual' for an explicit question."
            )
        query_block = deduce_mooka_question(chart)
        parsed_query = None
        deduced_query = query_block.get("deduced_query")
        primary = int(query_block["primary_house"])
        favorable = list(query_block["favorable_houses"])
        denial = list(query_block["denial_houses"])
        karaka = query_block["karaka"]
        category = query_block["category"]
    else:
        # MODULE 2 — Explicit Question
        qtext = (input_data.get("question_text") or input_data.get("question") or "").strip()
        hint = input_data.get("category")
        if not qtext and not (hint and hint in CATEGORY_HOUSES):
            raise ValueError(
                "Manual Prashna requires question_text (or a valid category hint)."
            )

        query_block = map_query_to_houses(qtext, category_hint=hint)
        if input_data.get("primary_house"):
            primary = int(input_data["primary_house"])
            matched = next(
                (c for c, s in CATEGORY_HOUSES.items() if s["primary"] == primary),
                None,
            )
            if matched:
                spec = CATEGORY_HOUSES[matched]
                query_block = {
                    **query_block,
                    "category": matched,
                    "label": spec["label"],
                    "primary_house": primary,
                    "favorable_houses": list(spec["favorable"]),
                    "denial_houses": list(spec["denial"]),
                    "karaka": spec["karaka"],
                    "question_text": qtext,
                }
            else:
                query_block["primary_house"] = primary
                query_block["favorable_houses"] = [primary, ((primary) % 12) + 1, 11]
                query_block["denial_houses"] = [_twelfth(primary), 8, 12]

        parsed_query = {
            "question_text": qtext,
            "category": query_block.get("category"),
            "label": query_block.get("label"),
            "keywords": query_block.get("keywords") or [],
            "primary_house": query_block.get("primary_house"),
            "favorable_houses": query_block.get("favorable_houses"),
            "denial_houses": query_block.get("denial_houses"),
            "karaka": query_block.get("karaka"),
            "confidence": query_block.get("confidence"),
        }
        deduced_query = None
        primary = int(query_block["primary_house"])
        favorable = list(query_block["favorable_houses"])
        denial = list(query_block["denial_houses"])
        karaka = query_block["karaka"]
        category = query_block.get("category")

    # Shared KP + Parashara engines for both types
    promise = kp.evaluate_promise(primary, favorable, denial)
    timing = kp.timing_prediction(favorable, promise)
    parashara = para.evaluate(primary, karaka)
    justification = _build_justification(
        mode,
        {**query_block, "deduced_query": deduced_query},
        promise,
        timing,
        parashara,
    )

    return {
        # Required master fields
        "parsed_query": parsed_query,
        "deduced_query": deduced_query,
        "the_promise_result": bool(promise.get("the_promise_result")),
        "timing_prediction": timing.get("summary"),
        "astrological_justification": justification,
        # Supporting detail
        "mode": mode,
        "prashna_type": "Mooka Prashna" if mode == "mooka" else "Manual Prashna",
        "category": category,
        "primary_house": primary,
        "promise_status": promise.get("status"),
        "delay_status": promise.get("delay_status"),
        "timing": timing,
        "kp": {
            "promise": promise,
            "ruling_planets": timing.get("ruling_planets"),
            "four_fold_csl_star_lord": promise.get("four_fold_star_lord"),
            "node_proxies": {
                "Rahu": kp.node_proxies("Rahu"),
                "Ketu": kp.node_proxies("Ketu"),
            },
        },
        "parashara": parashara,
        "mooka": query_block if mode == "mooka" else None,
        "chart": {
            "input": chart.input,
            "ascendant": chart.ascendant.raw,
            "planets": [
                {
                    "name": p.name,
                    "longitude": p.longitude,
                    "sign": p.sign,
                    "house": p.house,
                    "nakshatra": p.nakshatra,
                    "sign_lord": p.sign_lord,
                    "star_lord": p.star_lord,
                    "sub_lord": p.sub_lord,
                    "retrograde": p.retrograde,
                    "d9_sign": p.d9_sign,
                }
                for p in chart.planets
            ],
            "houses": [
                {
                    "house": h.number,
                    "longitude": h.longitude,
                    "sign": h.sign,
                    "sign_lord": h.sign_lord,
                    "star_lord": h.star_lord,
                    "sub_lord": h.sub_lord,
                }
                for h in chart.houses
            ],
            "horary_number": chart.horary_number,
            "horary_ascendant": chart.horary_ascendant,
            "engine": chart.raw.get("engine"),
        },
    }


def _twelfth(house: int) -> int:
    return ((house - 2) % 12) + 1
