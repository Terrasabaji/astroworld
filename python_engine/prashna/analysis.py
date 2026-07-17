"""Master Prashna analysis — Mooka + Manual (KP + Parashara)."""

from __future__ import annotations

from typing import Any, Dict, Optional

from .chart_builder import cast_prashna_chart
from .constants import CATEGORY_HOUSES
from .kp_engine import KP_Engine
from .mooka import deduce_mooka_question
from .nlp import map_query_to_houses
from .parashara_engine import Parashara_Engine


def _build_justification(
    mode: str,
    query_block: dict,
    promise: dict,
    timing: dict,
    parashara: dict,
) -> str:
    parts = []
    if mode == "mooka":
        parts.append(f"Mooka deduction: {query_block.get('deduced_query')}")
    else:
        parts.append(
            f"Parsed query maps to {query_block.get('label')} "
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
        parts.append(f"Timing: {timing['summary']}")

    if promise.get("retrograde_planets"):
        parts.append(
            "Retrogression flagged for: "
            + ", ".join(promise["retrograde_planets"])
            + "."
        )

    return " ".join(p for p in parts if p).strip()


def run_prashna_analysis(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Master entry point.

    input_data keys:
      mode: "mooka" | "manual" | "instant" (instant treated as manual without question)
      year, month, day, hour, minute, second
      latitude, longitude, tz_offset | tz_name
      question_text (manual)
      category (optional hint)
      horary_number (optional 1–249)
      place, name, altitude (optional)

    Returns structured JSON with promise, timing, and justification.
    """
    mode = (input_data.get("mode") or "manual").lower().strip()
    if mode == "instant":
        mode = "manual"

    chart = cast_prashna_chart(input_data)
    kp = KP_Engine(chart, input_data)
    para = Parashara_Engine(chart)

    if mode == "mooka":
        query_block = deduce_mooka_question(chart)
        parsed_query = None
        deduced_query = query_block.get("deduced_query")
        primary = int(query_block["primary_house"])
        favorable = list(query_block["favorable_houses"])
        denial = list(query_block["denial_houses"])
        karaka = query_block["karaka"]
        category = query_block["category"]
    else:
        qtext = input_data.get("question_text") or input_data.get("question") or ""
        hint = input_data.get("category")
        query_block = map_query_to_houses(qtext, category_hint=hint)
        # Allow explicit house override list
        if input_data.get("primary_house"):
            primary = int(input_data["primary_house"])
            # synthesize from CATEGORY if possible
            matched = next(
                (c for c, s in CATEGORY_HOUSES.items() if s["primary"] == primary),
                None,
            )
            if matched:
                query_block = {
                    **query_block,
                    **CATEGORY_HOUSES[matched],
                    "category": matched,
                    "primary_house": primary,
                    "favorable_houses": list(CATEGORY_HOUSES[matched]["favorable"]),
                    "denial_houses": list(CATEGORY_HOUSES[matched]["denial"]),
                    "karaka": CATEGORY_HOUSES[matched]["karaka"],
                    "question_text": qtext,
                }
            else:
                query_block["primary_house"] = primary
                query_block["favorable_houses"] = [primary, 2, 11]
                query_block["denial_houses"] = [((primary - 2) % 12) + 1, 8, 12]
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

    yes_no = "YES" if promise.get("the_promise_result") else "NO"
    if promise.get("status") == "delayed_until_direct":
        yes_no = "YES (delayed)"
    elif promise.get("status") in ("mixed_lean_yes", "mixed_lean_no"):
        yes_no = "MIXED — lean " + ("YES" if promise.get("the_promise_result") else "NO")

    return {
        "mode": mode,
        "parsed_query": parsed_query,
        "deduced_query": deduced_query,
        "category": category,
        "primary_house": primary,
        "the_promise_result": bool(promise.get("the_promise_result")),
        "promise_status": promise.get("status"),
        "yes_no": yes_no,
        "timing_prediction": timing.get("summary"),
        "timing": timing,
        "astrological_justification": justification,
        "kp": {
            "promise": promise,
            "ruling_planets": timing.get("ruling_planets"),
            "four_fold_sample": {
                name: kp.four_fold_significators(name)
                for name in (promise.get("cuspal_sub_lord"), promise.get("csl_star_lord"))
                if name
            },
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
