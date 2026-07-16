"""
Comprehensive native status — Parashara, KP, and Jaimini synthesis across life areas.
Consumes calculate.py output (natal + optional transit) and optional Mooka prashna chart.
"""
from __future__ import annotations

import datetime as dt
from typing import Any, Dict, List, Optional, Tuple

SIGN_LORDS = [
    "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
    "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
]
MALEFICS = {"Sun", "Mars", "Saturn", "Rahu", "Ketu"}
BENEFICS = {"Moon", "Mercury", "Jupiter", "Venus"}
DUSTHANA = {6, 8, 12}
KP_DENIAL = {1, 6, 10, 12}

LIFE_AREAS = {
    "health": {
        "label": "Health",
        "houses": [1, 6, 8, 12],
        "karaka": "Sun",
        "jaimini_karaka": "AK",
        "description": "Vitality, disease, chronic issues, hospitalisation",
    },
    "wealth": {
        "label": "Wealth & Finance",
        "houses": [2, 6, 11],
        "karaka": "Jupiter",
        "jaimini_karaka": "AmK",
        "description": "Income, savings, gains, financial stability",
    },
    "children": {
        "label": "Children & Progeny",
        "houses": [2, 5, 11],
        "karaka": "Jupiter",
        "jaimini_karaka": "PK",
        "description": "Fertility, progeny, children's welfare",
    },
    "marriage": {
        "label": "Marriage & Relationship",
        "houses": [2, 7, 11],
        "karaka": "Venus",
        "jaimini_karaka": "DK",
        "description": "Partnership, marital harmony, union",
    },
    "career_education": {
        "label": "Career & Education",
        "houses": [2, 4, 5, 9, 10, 11],
        "karaka": "Mercury",
        "jaimini_karaka": "AmK",
        "description": "Learning, profession, status, earnings from work",
    },
    "property": {
        "label": "Property & Assets",
        "houses": [4, 11, 12],
        "karaka": "Mars",
        "jaimini_karaka": "MK",
        "description": "Land, home, vehicles, fixed assets",
    },
    "litigation": {
        "label": "Litigation & Disputes",
        "houses": [6, 7, 8],
        "karaka": "Mars",
        "jaimini_karaka": "GK",
        "description": "Legal matters, enemies, conflicts",
    },
    "relatives_health": {
        "label": "Close Relatives' Health",
        "houses": [3, 4, 6, 8, 9, 12],
        "karaka": "Moon",
        "jaimini_karaka": "GK",
        "description": "Mother (4th), father (9th), siblings (3rd) — health stress",
    },
    "profession_job": {
        "label": "Profession & Job",
        "houses": [6, 10, 11],
        "karaka": "Saturn",
        "jaimini_karaka": "AmK",
        "description": "Employment, service, promotions, workplace issues",
    },
}

MOOKA_CATEGORY_MAP = {
    "health": "health",
    "wealth": "finance",
    "children": "children",
    "marriage": "marriage",
    "career_education": "career",
    "property": "property",
    "litigation": "litigation",
    "relatives_health": "health",
    "profession_job": "career",
}

MOOKA_HOUSES = {
    "health": [1, 6, 8, 12],
    "marriage": [2, 7, 11],
    "career": [2, 6, 10, 11],
    "litigation": [6, 7, 8],
    "children": [2, 5, 11],
    "finance": [2, 6, 11],
    "property": [4, 11, 12],
    "education": [4, 5, 9],
}


def _planet_map(planets: List[dict]) -> Dict[str, dict]:
    return {p["name"]: p for p in planets}


def _whole_sign_house(body_sign: int, asc_sign: int) -> int:
    return ((body_sign - asc_sign) % 12) + 1


def _lord_of_house_whole(asc_sign: int, house: int) -> str:
    return SIGN_LORDS[(asc_sign + house - 1) % 12]


def _verdict_from_score(score: float) -> Tuple[str, str]:
    if score >= 62:
        return "Favorable", "good"
    if score >= 42:
        return "Mixed", "mid"
    return "Challenging", "bad"


def _clamp(v: float, lo: float = 0, hi: float = 100) -> float:
    return max(lo, min(hi, v))


def _method_direction(score: float) -> int:
    if score >= 58:
        return 1
    if score <= 42:
        return -1
    return 0


def _conformity(method_scores: Dict[str, float]) -> Dict[str, Any]:
    dirs = [_method_direction(method_scores.get(m, 50)) for m in ("parashara", "kp", "jaimini")]
    nonzero = [d for d in dirs if d != 0]
    if len(nonzero) < 2:
        pct = 50
    else:
        agree = sum(1 for i in range(len(nonzero) - 1) if nonzero[i] == nonzero[i + 1])
        pct = int(round((agree / (len(nonzero) - 1)) * 100))
    label = "Strong agreement" if pct >= 80 else ("Moderate agreement" if pct >= 50 else "Divergent readings")
    return {"pct": pct, "label": label, "directions": {"parashara": dirs[0], "kp": dirs[1], "jaimini": dirs[2]}}


def _parashara_score(chart: dict, houses: List[int], karaka: str) -> Tuple[float, List[str]]:
    reasons: List[str] = []
    score = 52.0
    asc = chart["ascendant"]
    asc_sign = asc["sign_index"]
    pmap = _planet_map(chart["planets"])
    hl = {h: _lord_of_house_whole(asc_sign, h) for h in range(1, 13)}

    for h in houses:
        lord = hl[h]
        if lord not in pmap:
            continue
        pl = pmap[lord]
        ph = _whole_sign_house(pl["sign_index"], asc_sign)
        if ph in DUSTHANA:
            score -= 8
            reasons.append(f"{lord} (lord of H{h}) in dusthana H{ph} — strain on {h}th-house matters.")
        elif ph in houses:
            score += 6
            reasons.append(f"{lord} (lord of H{h}) in supporting H{ph} — links houses favourably.")
        occ = [p["name"] for p in chart["planets"] if _whole_sign_house(p["sign_index"], asc_sign) == h]
        mals = [p for p in occ if p in MALEFICS]
        bens = [p for p in occ if p in BENEFICS]
        if mals:
            score -= 5 * len(mals)
            reasons.append(f"Malefic(s) {', '.join(mals)} in H{h} — pressure on significations.")
        if bens:
            score += 4 * len(bens)
            reasons.append(f"Benefic(s) {', '.join(bens)} in H{h} — protection for significations.")

    if karaka in pmap:
        k = pmap[karaka]
        kh = _whole_sign_house(k["sign_index"], asc_sign)
        if kh in DUSTHANA:
            score -= 10
            reasons.append(f"Karaka {karaka} in dusthana H{kh} — weak significator.")
        elif kh in houses:
            score += 8
            reasons.append(f"Karaka {karaka} in relevant H{kh} — strong natural significator.")
        if k.get("retrograde"):
            score -= 3
            reasons.append(f"{karaka} retrograde — results delayed or internalised.")

    lagna_lord = hl[1]
    if lagna_lord in pmap and houses == LIFE_AREAS["health"]["houses"]:
        ll = pmap[lagna_lord]
        if _whole_sign_house(ll["sign_index"], asc_sign) in DUSTHANA:
            score -= 8
            reasons.append(f"Lagna lord {lagna_lord} in dusthana — constitutional vulnerability.")

    return _clamp(score), reasons[:6]


def _kp_sig_houses(kp_sigs: dict, planet: str) -> List[int]:
    entry = kp_sigs.get(planet) or {}
    return entry.get("all_signified_houses") or []


def _kp_score(chart: dict, houses: List[int], karaka: str) -> Tuple[float, List[str]]:
    reasons: List[str] = []
    score = 52.0
    inter = chart.get("kp_cuspal_interlink") or []
    kp_sigs = chart.get("kp_significators") or {}

    for h in houses:
        cusp = next((c for c in inter if c["house"] == h), None)
        if not cusp:
            continue
        sub = cusp.get("sub_lord")
        if not sub:
            continue
        sig = set(_kp_sig_houses(kp_sigs, sub))
        target = set(houses)
        denial = sig & KP_DENIAL
        support = sig & target
        if support:
            score += 7
            reasons.append(f"H{h} cusp sub-lord {sub} signifies {sorted(support)} — matter can fructify.")
        if denial:
            score -= 8
            reasons.append(f"H{h} cusp sub-lord {sub} signifies denial houses {sorted(denial)} — obstacles.")
        star = cusp.get("star_lord")
        if star and star in kp_sigs:
            star_sig = set(_kp_sig_houses(kp_sigs, star))
            if star_sig & target:
                score += 4
                reasons.append(f"H{h} star-lord {star} supports relevant houses {sorted(star_sig & target)}.")

    if karaka in kp_sigs:
        ks = set(_kp_sig_houses(kp_sigs, karaka))
        if ks & set(houses):
            score += 6
            reasons.append(f"Karaka {karaka} KP-signifies houses {sorted(ks & set(houses))}.")
        if ks & KP_DENIAL:
            score -= 5
            reasons.append(f"Karaka {karaka} also signifies denial houses {sorted(ks & KP_DENIAL)}.")

    return _clamp(score), reasons[:6]


def _jaimini_karaka_planet(jaimini: dict, abbr: str) -> Optional[str]:
    for scheme in ("karakas_7_detail", "karakas_8_detail"):
        for row in jaimini.get(scheme) or []:
            if row.get("abbr") == abbr:
                return row.get("planet")
    return None


def _jaimini_score(chart: dict, jaimini: dict, houses: List[int], karaka_abbr: str) -> Tuple[float, List[str]]:
    reasons: List[str] = []
    score = 52.0
    if not jaimini:
        return score, ["Jaimini data unavailable."]

    asc_sign = chart["ascendant"]["sign_index"]
    pmap = _planet_map(chart["planets"])
    planet = _jaimini_karaka_planet(jaimini, karaka_abbr)
    if planet and planet in pmap:
        p = pmap[planet]
        ph = _whole_sign_house(p["sign_index"], asc_sign)
        reasons.append(f"Jaimini {karaka_abbr} = {planet} in {p['sign']} (H{ph}).")
        if ph in houses:
            score += 10
            reasons.append(f"{karaka_abbr} ({planet}) occupies a primary house for this matter.")
        if ph in DUSTHANA:
            score -= 9
            reasons.append(f"{karaka_abbr} in dusthana — Jaimini caution for this theme.")
        d9 = p.get("d9_sign")
        if d9:
            reasons.append(f"{karaka_abbr} Navamsa: {d9}.")

    arudha = jaimini.get("arudha_padas") or {}
    padas = arudha.get("bhava_padas") if isinstance(arudha, dict) else arudha
    if isinstance(padas, list):
        for ap in padas:
            if isinstance(ap, dict) and ap.get("house") in houses:
                score += 4
                reasons.append(f"Arudha {ap.get('name', 'pada')} (H{ap.get('house')}) highlights public dimension.")

    km = jaimini.get("karakamsa") or {}
    if km.get("sign"):
        reasons.append(f"Karakamsa (AK in D9): {km['sign']} — dharmic backdrop.")

    # Chara dasha relevance
    cd = jaimini.get("chara_dasha") or {}
    cur_md = next((m for m in cd.get("mds", []) if m.get("current")), None)
    if cur_md:
        md_sign = cur_md.get("sign", "")
        reasons.append(f"Chara MD: {md_sign} — conditional Jaimini timing active.")

    return _clamp(score), reasons[:6]


def _dasha_notes(chart_dasha: dict, houses: List[int], asc_sign: int, pmap: dict) -> List[str]:
    notes: List[str] = []
    if not chart_dasha:
        return notes
    hl = {h: _lord_of_house_whole(asc_sign, h) for h in range(1, 13)}
    area_lords = {hl[h] for h in houses if h in hl}
    for level, key in (("MD", "mds"), ("AD", "ads"), ("PD", "pds")):
        for row in chart_dasha.get(key) or []:
            if not row.get("current"):
                continue
            lord = row.get("lord")
            if lord in area_lords:
                notes.append(f"Vimshottari {level} lord {lord} rules a key house — period activates this theme.")
            elif lord in pmap and _whole_sign_house(pmap[lord]["sign_index"], asc_sign) in houses:
                notes.append(f"Vimshottari {level} lord {lord} occupies a relevant house — timing support.")
    bal = chart_dasha.get("balance_years")
    if bal is not None and chart_dasha.get("lord_at_birth"):
        notes.append(f"Birth dasha balance: {bal:.2f} yrs of {chart_dasha.get('lord_at_birth')}.")
    return notes[:4]


def _chara_dasha_notes(jaimini: dict) -> List[str]:
    notes: List[str] = []
    cd = (jaimini or {}).get("chara_dasha") or {}
    for md in cd.get("mds") or []:
        if md.get("current"):
            notes.append(f"Chara Mahadasha: {md.get('sign')} ({md.get('start', '')} – {md.get('end', '')}).")
    for ad in cd.get("ads") or []:
        if ad.get("current"):
            notes.append(f"Chara Antardasha: {ad.get('sign')} under {ad.get('md_sign', '')}.")
    return notes[:3]


def _transit_notes(natal: dict, transit: Optional[dict], houses: List[int]) -> List[str]:
    if not transit:
        return []
    notes: List[str] = []
    asc_sign = natal["ascendant"]["sign_index"]
    slow = ("Saturn", "Rahu", "Ketu", "Jupiter", "Mars")
    for p in transit.get("planets") or []:
        if p["name"] not in slow:
            continue
        th = _whole_sign_house(p["sign_index"], asc_sign)
        if th in houses:
            tag = "pressure" if p["name"] in ("Saturn", "Rahu", "Ketu") else "activation"
            notes.append(f"Transit {p['name']} over natal H{th} — {tag} for this matter.")
    return notes[:4]


def _mooka_score_houses(chart: dict) -> Dict[int, float]:
    scores = {h: 0.0 for h in range(1, 13)}
    asc = chart["ascendant"]
    pmap = _planet_map(chart["planets"])
    kp_sigs = chart.get("kp_significators") or {}

    def add_sig(planet: str, w: float) -> None:
        if not planet:
            return
        for h in _kp_sig_houses(kp_sigs, planet):
            scores[h] += w

    add_sig(asc.get("sub_lord"), 5.0)
    moon = pmap.get("Moon")
    if moon:
        asc_sign = asc["sign_index"]
        mh = _whole_sign_house(moon["sign_index"], asc_sign)
        scores[mh] += 3.0
        add_sig(moon.get("nakshatra_lord"), 2.5)
        add_sig(moon.get("sub_lord"), 2.0)

    for h in range(1, 13):
        for p in chart["planets"]:
            if _whole_sign_house(p["sign_index"], asc["sign_index"]) == h:
                scores[h] += 1.0
    return scores


def analyze_mooka_prashna(mooka_chart: dict) -> Dict[str, Any]:
    house_scores = _mooka_score_houses(mooka_chart)
    cat_scores: Dict[str, float] = {}
    for cat, hs in MOOKA_HOUSES.items():
        cat_scores[cat] = sum(house_scores.get(h, 0) for h in hs)

    ranked = sorted(cat_scores.items(), key=lambda x: -x[1])
    top = [{"category": c, "score": round(s, 2)} for c, s in ranked if s > 0][:5]
    headline = "Dominant concern at cast moment: " + (top[0]["category"].replace("_", " ").title() if top else "unclear")
    return {
        "headline": headline,
        "candidates": top,
        "house_scores": {str(k): round(v, 2) for k, v in house_scores.items()},
        "cast_note": "Mooka Prashna chart cast at the moment of analysis (silent query).",
    }


def _area_verdict(method_scores: Dict[str, float]) -> Tuple[str, str, float]:
    avg = sum(method_scores.values()) / len(method_scores)
    return _verdict_from_score(avg) + (avg,)


def analyze_life_area(area_id: str, natal: dict, transit: Optional[dict]) -> dict:
    spec = LIFE_AREAS[area_id]
    houses = spec["houses"]
    jaimini = natal.get("jaimini") or {}
    pmap = _planet_map(natal["planets"])
    asc_sign = natal["ascendant"]["sign_index"]

    p_score, p_reasons = _parashara_score(natal, houses, spec["karaka"])
    k_score, k_reasons = _kp_score(natal, houses, spec["karaka"])
    j_score, j_reasons = _jaimini_score(natal, jaimini, houses, spec["jaimini_karaka"])

    method_scores = {"parashara": p_score, "kp": k_score, "jaimini": j_score}
    verdict, cls, avg = _area_verdict(method_scores)
    conformity = _conformity(method_scores)

    return {
        "id": area_id,
        "label": spec["label"],
        "description": spec["description"],
        "verdict": verdict,
        "verdict_class": cls,
        "score": round(avg, 1),
        "houses": houses,
        "methods": {
            "parashara": {"score": round(p_score, 1), "verdict": _verdict_from_score(p_score)[0], "reasons": p_reasons},
            "kp": {"score": round(k_score, 1), "verdict": _verdict_from_score(k_score)[0], "reasons": k_reasons},
            "jaimini": {"score": round(j_score, 1), "verdict": _verdict_from_score(j_score)[0], "reasons": j_reasons},
        },
        "conformity": conformity,
        "dasha_notes": _dasha_notes(natal.get("dasha"), houses, asc_sign, pmap),
        "chara_dasha_notes": _chara_dasha_notes(jaimini),
        "transit_notes": _transit_notes(natal, transit, houses),
        "conditional_dasha": "Vimshottari for Parashara/KP timing; Chara Dasha (Jaimini) for sign-based conditional periods.",
    }


def _adviser_excerpt(adviser: Optional[dict]) -> Optional[dict]:
    if not adviser or adviser.get("error"):
        return None
    edu = adviser.get("education") or {}
    car = adviser.get("career") or {}
    streams = edu.get("streams") or []
    first_stream = streams[0] if streams and isinstance(streams[0], dict) else {}
    fields = car.get("fields") or []
    return {
        "education_promised": edu.get("promised"),
        "education_summary": first_stream.get("title"),
        "career_fields": [f.get("title") for f in fields[:3] if isinstance(f, dict)],
        "job_vs_business": car.get("job_vs_business"),
        "current_dasha": adviser.get("current_dasha"),
    }


def build_comprehensive_report(
    natal: dict,
    *,
    transit: Optional[dict] = None,
    mooka_chart: Optional[dict] = None,
    adviser: Optional[dict] = None,
    native_name: str = "Native",
    generated_at: Optional[str] = None,
) -> dict:
    areas = [analyze_life_area(aid, natal, transit) for aid in LIFE_AREAS]
    method_avgs = []
    for a in areas:
        for m in a["methods"].values():
            method_avgs.append(_method_direction(m["score"]))
    agree = sum(1 for i in range(len(method_avgs) - 1) if method_avgs[i] == method_avgs[i + 1] and method_avgs[i] != 0)
    denom = max(1, sum(1 for x in method_avgs if x != 0) - 1)
    overall_conformity = int(round((agree / denom) * 100)) if denom else 50

    challenging = [a for a in areas if a["verdict_class"] == "bad"]
    favorable = [a for a in areas if a["verdict_class"] == "good"]

    dasha = natal.get("dasha") or {}
    jaimini = natal.get("jaimini") or {}
    cur_md = next((m for m in dasha.get("mds") or [] if m.get("current")), None)
    cur_ad = next((a for a in dasha.get("ads") or [] if a.get("current")), None)
    cur_pd = next((p for p in dasha.get("pds") or [] if p.get("current")), None)

    return {
        "generated_at": generated_at or dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        "native_name": native_name,
        "summary": {
            "headline": f"Comprehensive status for {native_name}",
            "favorable_count": len(favorable),
            "challenging_count": len(challenging),
            "mixed_count": len(areas) - len(favorable) - len(challenging),
            "method_conformity_pct": overall_conformity,
            "top_concerns": [a["label"] for a in sorted(areas, key=lambda x: x["score"])[:3]],
            "top_strengths": [a["label"] for a in sorted(areas, key=lambda x: -x["score"])[:3]],
        },
        "life_areas": areas,
        "dasha": {
            "vimshottari": {
                "lord_at_birth": dasha.get("lord_at_birth"),
                "balance_years": dasha.get("balance_years"),
                "current_md": cur_md,
                "current_ad": cur_ad,
                "current_pd": cur_pd,
            },
            "chara": {
                "current_md": next((m for m in (jaimini.get("chara_dasha") or {}).get("mds") or [] if m.get("current")), None),
                "current_ad": next((a for a in (jaimini.get("chara_dasha") or {}).get("ads") or [] if a.get("current")), None),
            },
            "conditional_note": "Vimshottari Mahadasha/Antardasha used for Parashara & KP; Chara Dasha (Jaimini) applied as conditional sign-based timing.",
        },
        "transits": {
            "available": transit is not None,
            "input": (transit or {}).get("input"),
            "notes": "Gochara at cast moment evaluated against natal whole-sign houses for slow planets.",
        },
        "mooka_prashna": analyze_mooka_prashna(mooka_chart) if mooka_chart else None,
        "adviser": _adviser_excerpt(adviser),
    }
