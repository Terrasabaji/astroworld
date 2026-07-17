"""
Astro World — Chart-wide Yoga & Dosha analysis with active periods and cited remedies.
Consumes calculate.py JSON output.
"""
from __future__ import annotations

import datetime as dt
from typing import Any, Dict, List, Optional, Set, Tuple

import swisseph as swe

import calculate as calc
from remedy_catalog import remedies_for_conditions

SIGN_LORDS = calc.SIGN_LORDS
KENDRAS = {1, 4, 7, 10}
TRIKONAS = {1, 5, 9}
DUSTHANA = {6, 8, 12}
MALEFICS = {"Sun", "Mars", "Saturn", "Rahu", "Ketu"}
BENEFICS = {"Moon", "Mercury", "Jupiter", "Venus"}
EXALT = {"Sun": 0, "Moon": 1, "Mars": 9, "Mercury": 5, "Jupiter": 3, "Venus": 11, "Saturn": 6}
DEBIL = {"Sun": 6, "Moon": 7, "Mars": 3, "Mercury": 11, "Jupiter": 9, "Venus": 5, "Saturn": 0}
OWN = {
    "Sun": {4}, "Moon": {3}, "Mars": {0, 7}, "Mercury": {2, 5},
    "Jupiter": {8, 11}, "Venus": {1, 6}, "Saturn": {9, 10},
}
KUJA_HOUSES = {1, 2, 4, 7, 8, 12}
KUJA_HOUSE_WT = {1: 18, 2: 14, 4: 18, 7: 25, 8: 25, 12: 14}
KUJA_SIGN_CANCEL = {1: {0}, 2: {2, 5}, 4: {0, 7}, 7: {9, 3}, 8: {8, 11}, 12: {1, 6}}
VIM = calc.VIM_ORDER
VIM_YEARS = calc.VIM_YEARS
TOTAL_VIM = calc.TOTAL_VIM
SOLAR_YEAR = calc.SOLAR_YEAR_DAYS
DIGNITY_SCORE = {"exalted": 95, "own": 80, "neutral": 55, "debilitated": 25}
STRENGTH_LABELS = ((75, "Strong"), (50, "Moderate"), (0, "Weak"))


def _strength_label(score: float) -> str:
    for threshold, label in STRENGTH_LABELS:
        if score >= threshold:
            return label
    return "Weak"


def _parse_birth(chart: dict) -> dt.datetime:
    inp = chart["input"]
    d, t = inp["date"], inp["time"]
    y, mo, day = map(int, d.split("-"))
    parts = t.split(":")
    hh, mm = int(parts[0]), int(parts[1])
    ss = int(parts[2]) if len(parts) > 2 else 0
    return dt.datetime(y, mo, day, hh, mm, ss)


def _native_age_years(chart: dict, as_of: Optional[dt.datetime] = None) -> float:
    birth = _parse_birth(chart)
    now = as_of or dt.datetime.now()
    return (now - birth).days / SOLAR_YEAR


def _planet_map(chart: dict) -> Dict[str, dict]:
    return {p["name"]: p for p in chart["planets"]}


def _whole_sign_house(planet_sign: int, asc_sign: int) -> int:
    return (planet_sign - asc_sign) % 12 + 1


def _build_context(chart: dict) -> dict:
    asc_si = chart["ascendant"]["sign_index"]
    pmap = _planet_map(chart)
    houses = {}
    for name, p in pmap.items():
        si = p["sign_index"]
        houses[name] = _whole_sign_house(si, asc_si)
    lord_of = {}
    for h in range(1, 13):
        sign = (asc_si + h - 1) % 12
        lord_of[h] = SIGN_LORDS[sign]
    return {"asc_si": asc_si, "pmap": pmap, "houses": houses, "lord_of": lord_of}


def _dignity(planet: str, sign_index: int) -> str:
    if EXALT.get(planet) == sign_index:
        return "exalted"
    if DEBIL.get(planet) == sign_index:
        return "debilitated"
    if sign_index in OWN.get(planet, set()):
        return "own"
    return "neutral"


def _adviser_chart(chart: dict):
    from astro_adviser.ephemeris import compute_chart

    inp = chart["input"]
    d, t = inp["date"], inp["time"]
    y, mo, day = map(int, d.split("-"))
    parts = t.split(":")
    hh, mm = int(parts[0]), int(parts[1])
    ss = int(parts[2]) if len(parts) > 2 else 0
    local = dt.datetime(y, mo, day, hh, mm, ss)
    return compute_chart(
        local, float(inp["latitude"]), float(inp["longitude"]),
        float(inp["tz_offset"]), system="Parashara",
    )


def _compute_shadbala(chart: dict):
    try:
        from astro_adviser.shadbala import compute_shadbala
        return compute_shadbala(_adviser_chart(chart))
    except Exception:
        return None


def _house_modifier(house: int) -> int:
    if house in KENDRAS | TRIKONAS:
        return 15
    if house in DUSTHANA:
        return -20
    if house in {2, 11}:
        return 8
    return 0


def _planet_power(ctx: dict, planet: str, sb=None) -> dict:
    pmap = ctx["pmap"]
    if planet not in pmap:
        return {"score": 50, "label": "Variable", "dignity": "neutral", "house": None}
    p = pmap[planet]
    si = p["sign_index"]
    house = ctx["houses"][planet]
    dig = _dignity(planet, si)
    score = float(DIGNITY_SCORE.get(dig, 55))
    score += _house_modifier(house)
    if p.get("retrograde"):
        score += 5
    for b in BENEFICS:
        if b != planet and _aspects_planet(b, ctx["houses"][b], house):
            score += 4
    for m in MALEFICS:
        if m != planet and _aspects_planet(m, ctx["houses"][m], house):
            score -= 4
    rupas = ratio = sufficient = None
    phala = None
    if sb is not None:
        from astro_adviser.shadbala import period_phala
        ps = sb.planets.get(planet)
        if ps is not None:
            rupas = ps.rupas
            ratio = ps.ratio
            sufficient = ps.sufficient
            _, _, phala = period_phala(sb, planet)
            sb_score = min(100.0, max(20.0, 50.0 + ps.ratio * 35.0))
            score = 0.55 * score + 0.45 * sb_score
    score = max(0, min(100, round(score)))
    return {
        "score": score,
        "label": _strength_label(score),
        "dignity": dig,
        "house": house,
        "rupas": rupas,
        "ratio": ratio,
        "sufficient": sufficient,
        "phala": phala,
    }


def _dasha_lord_strength(lord: str, ctx: dict, sb=None) -> dict:
    if lord in ("Rahu", "Ketu"):
        disp = SIGN_LORDS[ctx["pmap"][lord]["sign_index"]]
        inner = _dasha_lord_strength(disp, ctx, sb)
        score = round(inner["score"] * 0.85)
        return {
            "lord": lord,
            "dispositor": disp,
            "score": score,
            "label": _strength_label(score),
            "rupas": inner.get("rupas"),
            "ratio": inner.get("ratio"),
            "sufficient": inner.get("sufficient"),
            "phala": f"Node — acts via {disp} ({inner.get('phala') or inner['label']})",
            "dignity": inner.get("dignity"),
            "house": inner.get("house"),
        }
    power = _planet_power(ctx, lord, sb)
    return {"lord": lord, **power}


def _item_strength(item: dict, ctx: dict, sb, active_dasha_lords: Set[str]) -> Optional[dict]:
    lords = [p for p in (item.get("activating_lords") or []) if p in ctx["pmap"]]
    if not lords:
        return None
    powers = [_planet_power(ctx, p, sb) for p in lords]
    avg = sum(p["score"] for p in powers) / len(powers)
    if item.get("kind") == "dosha" and item.get("severity") == "mild":
        avg *= 0.65
    elif item.get("kind") == "dosha" and item.get("severity") in ("strong", "high"):
        avg = min(100.0, avg * 1.1)
    activated = bool(active_dasha_lords & set(lords))
    if activated:
        avg = min(100.0, avg + 12.0)
    score = round(avg)
    factors = [f"{lords[i]}: {powers[i]['label']} ({powers[i]['score']}) — {powers[i]['dignity']}, {powers[i]['house']}H"
               for i in range(len(lords))]
    if activated:
        factors.append("Running MD/AD activates this combination now")
    return {
        "score": score,
        "label": _strength_label(score),
        "activated_now": activated,
        "planets": {lords[i]: powers[i] for i in range(len(lords))},
        "factors": factors,
    }


def _period_strength(md: str, ad: str, ctx: dict, sb) -> dict:
    md_s = _dasha_lord_strength(md, ctx, sb)
    ad_s = _dasha_lord_strength(ad, ctx, sb)
    combined = round((md_s["score"] + ad_s["score"]) / 2)
    return {
        "combined_score": combined,
        "combined_label": _strength_label(combined),
        "md": md_s,
        "ad": ad_s,
    }


GAND_MOOL_NAK = {0, 8, 9, 17, 18, 26}  # Ashwini, Ashlesha, Magha, Jyeshtha, Mula, Revati


def _conjunct(ctx, a: str, b: str) -> bool:
    return ctx["houses"][a] == ctx["houses"][b]


def _linked(ctx: dict, a: str, b: str) -> bool:
    if _conjunct(ctx, a, b):
        return True
    ha, hb = ctx["houses"][a], ctx["houses"][b]
    return _aspects_planet(a, ha, hb) or _aspects_planet(b, hb, ha)


def _planets_in_house_from_moon(ctx: dict, offset: int, exclude: Optional[Set[str]] = None) -> List[str]:
    """offset 1 = same as moon house, 2 = 2nd from moon, etc."""
    moon_h = ctx["houses"]["Moon"]
    target = ((moon_h - 1 + offset - 1) % 12) + 1
    skip = exclude or set()
    return [n for n in ctx["pmap"] if n not in skip and n not in ("Rahu", "Ketu") and ctx["houses"][n] == target]


def _aspects_mars(from_h: int, to_h: int) -> bool:
    diffs = {4, 7, 8}
    return ((to_h - from_h) % 12 + 1) in diffs or (from_h - to_h) % 12 + 1 in diffs


def _aspects_jupiter(from_h: int, to_h: int) -> bool:
    return ((to_h - from_h) % 12 + 1) in {5, 7, 9}


def _aspects_saturn(from_h: int, to_h: int) -> bool:
    return ((to_h - from_h) % 12 + 1) in {3, 7, 10}


def _aspects_planet(planet: str, from_h: int, to_h: int) -> bool:
    if from_h == to_h:
        return True
    if planet == "Mars":
        return _aspects_mars(from_h, to_h)
    if planet == "Jupiter":
        return _aspects_jupiter(from_h, to_h)
    if planet == "Saturn":
        return _aspects_saturn(from_h, to_h)
    return (abs(from_h - to_h) % 12) == 6 or from_h == to_h  # 7th only for Sun/Moon etc.


def _expand_dasha_periods(chart: dict, lords: Set[str], ctx: dict = None, sb=None,
                          years_ahead: int = 90) -> List[dict]:
    """MD–AD windows where any listed lord runs."""
    mds = chart.get("dasha", {}).get("mds", [])
    if not mds:
        return []
    now = dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)
    end_limit = now + dt.timedelta(days=years_ahead * 365)
    periods = []
    for md in mds:
        md_lord = md["lord"]
        md_start = dt.datetime.fromisoformat(md["start"].replace("Z", ""))
        md_end = dt.datetime.fromisoformat(md["end"].replace("Z", ""))
        if md_end < now - dt.timedelta(days=365 * 5):
            continue
        if md_start > end_limit:
            break
        md_years = md.get("years") or VIM_YEARS[md_lord]
        ad_start = md_start
        ad_idx = VIM.index(md_lord)
        for j in range(9):
            ad_lord = VIM[(ad_idx + j) % 9]
            ad_years = md_years * VIM_YEARS[ad_lord] / TOTAL_VIM
            ad_end = ad_start + dt.timedelta(days=ad_years * SOLAR_YEAR)
            if md_lord in lords or ad_lord in lords:
                if ad_end > now - dt.timedelta(days=365 * 10) and ad_start < end_limit:
                    entry = {
                        "md": md_lord, "ad": ad_lord,
                        "start": ad_start.date().isoformat(),
                        "end": ad_end.date().isoformat(),
                        "active_now": ad_start <= now < ad_end,
                    }
                    if ctx is not None:
                        entry["strength"] = _period_strength(md_lord, ad_lord, ctx, sb)
                    periods.append(entry)
            ad_start = ad_end
    return periods[:40]


def _sade_sati_timeline(chart: dict, span_years: int = 90) -> List[dict]:
    moon_si = _planet_map(chart)["Moon"]["sign_index"]
    birth = dt.datetime.fromisoformat(chart["input"]["birth_utc"])
    lat = chart["input"]["latitude"]
    lon = chart["input"]["longitude"]
    tz = chart["input"]["tz_offset"]
    ay = chart["input"].get("ayanamsa", "lahiri")
    swe.set_sid_mode(calc.AYANAMSA_MAP.get(ay, calc.AYANAMSA_MAP["lahiri"]), 0, 0)
    flag = swe.FLG_SIDEREAL | swe.FLG_TRUEPOS
    if calc._HAS_SWIEPH_DATA:
        flag |= swe.FLG_SWIEPH
    else:
        flag |= swe.FLG_MOSEPH

    phases = []
    step = 7  # days
    cur = birth
    end = birth + dt.timedelta(days=span_years * 365)
    last_phase = None
    phase_start = None

    while cur < end:
        (_, jd_ut) = swe.utc_to_jd(cur.year, cur.month, cur.day, 12, 0, 0, 1)
        jd_ut -= tz / 24.0
        res, _ = swe.calc_ut(jd_ut, swe.SATURN, flag)
        sat_si = int(res[0] // 30)
        diff = (sat_si - moon_si) % 12
        if diff == 11:
            phase = "rising"
        elif diff == 0:
            phase = "peak"
        elif diff == 1:
            phase = "setting"
        elif diff == 3:
            phase = "ardha_ashtama"
        elif diff == 7:
            phase = "ashtama_shani"
        else:
            phase = None
        if phase != last_phase:
            if last_phase and phase_start:
                phases.append({
                    "phase": last_phase,
                    "start": phase_start.date().isoformat(),
                    "end": cur.date().isoformat(),
                    "active_now": phase_start <= dt.datetime.now(dt.timezone.utc).replace(tzinfo=None) < cur,
                })
            phase_start = cur
            last_phase = phase
        cur += dt.timedelta(days=step)
    if last_phase and phase_start:
        phases.append({
            "phase": last_phase,
            "start": phase_start.date().isoformat(),
            "end": end.date().isoformat(),
            "active_now": phase_start <= dt.datetime.now(dt.timezone.utc).replace(tzinfo=None) < end,
        })
    return [p for p in phases if p["phase"] in ("rising", "peak", "setting", "ardha_ashtama", "ashtama_shani")]


def _item(kind: str, id_: str, name: str, present: bool, detail: str,
          lords: List[str], condition_ids: List[str], severity: str = "moderate",
          **extra) -> dict:
    row = {
        "kind": kind,
        "id": id_,
        "name": name,
        "present": present,
        "detail": detail,
        "severity": severity,
        "activating_lords": lords,
        "condition_ids": condition_ids,
        "active_periods": [],
        "remedies": [],
    }
    row.update(extra)
    return row


def _analyze_kuja(ctx: dict) -> Optional[dict]:
    """Full Kuja/Mangal dosha with classical cancellations (ported from kuja.js)."""
    pmap = ctx["pmap"]
    ms = pmap["Mars"]["sign_index"]
    mars_h = ctx["houses"]["Mars"]
    refs = {
        "Lagna": ctx["asc_si"],
        "Moon": pmap["Moon"]["sign_index"],
        "Venus": pmap["Venus"]["sign_index"],
    }
    hits = []
    intensity = 0
    for label, rsi in refs.items():
        h = _whole_sign_house(ms, rsi)
        if h in KUJA_HOUSES:
            hits.append({"ref": label, "house": h})
            intensity += KUJA_HOUSE_WT[h]
    intensity = min(100, intensity)
    if not hits:
        return None

    reasons: List[str] = []
    reduction = 0.0
    if ms in OWN["Mars"]:
        reasons.append(f"Mars in own sign ({pmap['Mars']['sign']})")
        reduction = max(reduction, 0.9)
    if ms == EXALT["Mars"]:
        reasons.append("Mars exalted in Capricorn")
        reduction = max(reduction, 1.0)
    for hit in hits:
        if ms in KUJA_SIGN_CANCEL.get(hit["house"], set()):
            reasons.append(
                f"Mars in {pmap['Mars']['sign']} in {hit['house']}H from {hit['ref']} — classical cancellation"
            )
            reduction = max(reduction, 0.85)
    for b in ("Jupiter", "Venus"):
        bh = ctx["houses"][b]
        if bh == mars_h:
            reasons.append(f"{b} conjunct Mars")
            reduction = max(reduction, 0.8)
        elif _aspects_planet(b, bh, mars_h):
            reasons.append(f"{b} aspects Mars")
            reduction = max(reduction, 0.7)
    if ctx["houses"]["Moon"] == mars_h:
        reasons.append("Moon conjunct Mars")
        reduction = max(reduction, 0.45)
    if _aspects_planet("Saturn", ctx["houses"]["Saturn"], mars_h):
        reasons.append("Saturn aspects Mars (restraint)")
        reduction = max(reduction, 0.4)
    if _dignity("Mars", ms) == "debilitated":
        reasons.append("Mars debilitated (too weak to fully inflict)")
        reduction = max(reduction, 0.5)

    net_intensity = round(intensity * (1 - reduction))
    cancelled = net_intensity < 12
    if net_intensity >= 45:
        level = "Strong Kuja Dosha"
        severity = "strong"
    elif net_intensity >= 22:
        level = "Moderate Kuja Dosha"
        severity = "moderate"
    elif cancelled:
        level = "Kuja Dosha Cancelled (Bhanga)"
        severity = "mild"
    else:
        level = "Mild Kuja Dosha"
        severity = "mild"

    from_text = ", ".join(f"{h['house']}H from {h['ref']}" for h in hits)
    detail = (
        f"Mars in Manglik houses: {from_text}. "
        f"Gross intensity {intensity}/100, net {net_intensity}/100 after {round(reduction * 100)}% cancellation."
    )
    if reasons:
        detail += f" Cancellations: {'; '.join(reasons)}."

    if cancelled:
        return _item(
            "note", "kuja_bhanga", "Kuja Dosha Cancelled (Bhanga)", True,
            detail, ["Mars"], ["kuja_dosha"], "low",
            kuja={
                "intensity": intensity,
                "net_intensity": net_intensity,
                "cancelled": True,
                "reduction_pct": round(reduction * 100),
                "reasons": reasons,
                "hits": hits,
                "level": level,
                "mars_sign": pmap["Mars"]["sign"],
                "mars_house": mars_h,
            },
        )

    return _item(
        "dosha", "kuja_dosha", "Kuja (Mangal) Dosha", True,
        detail, ["Mars"], ["kuja_dosha", "mangal_dosha"], severity,
        kuja={
            "intensity": intensity,
            "net_intensity": net_intensity,
            "cancelled": False,
            "reduction_pct": round(reduction * 100),
            "reasons": reasons,
            "hits": hits,
            "level": level,
            "mars_sign": pmap["Mars"]["sign"],
            "mars_house": mars_h,
        },
    )


def _house_from_moon(ctx: dict, planet: str) -> int:
    moon_si = ctx["pmap"]["Moon"]["sign_index"]
    pl_si = ctx["pmap"][planet]["sign_index"]
    return (pl_si - moon_si) % 12 + 1


def _exalt_lord_for_sign(sign_index: int) -> Optional[str]:
    for pl, si in EXALT.items():
        if si == sign_index:
            return pl
    return None


def _analyze_neecha(chart: dict, ctx: dict) -> Tuple[List[dict], List[dict]]:
    """Full Neecha / Neecha Bhanga analysis (ported from neecha.js)."""
    yogas: List[dict] = []
    doshas: List[dict] = []
    pmap = ctx["pmap"]
    H = ctx["houses"]
    moon_si = pmap["Moon"]["sign_index"]

    for pl in ("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"):
        si = pmap[pl]["sign_index"]
        if _dignity(pl, si) != "debilitated":
            continue
        disp = SIGN_LORDS[si]
        exalt_lord = _exalt_lord_for_sign(si)
        p_house = H[pl]
        reasons: List[str] = []

        if H[disp] in KENDRAS:
            reasons.append(f"dispositor {disp} in kendra from Lagna")
        if _house_from_moon(ctx, disp) in KENDRAS:
            reasons.append(f"dispositor {disp} in kendra from Moon")

        if exalt_lord:
            if H[exalt_lord] in KENDRAS:
                reasons.append(f"{exalt_lord} (exalted in {pmap[pl]['sign']}) in kendra from Lagna")
            elif _house_from_moon(ctx, exalt_lord) in KENDRAS:
                reasons.append(f"{exalt_lord} (exalted in {pmap[pl]['sign']}) in kendra from Moon")

        if H[disp] == p_house and disp != pl:
            reasons.append(f"conjunct dispositor {disp}")
        elif _aspects_planet(disp, H[disp], p_house):
            reasons.append(f"aspected by dispositor {disp}")

        if exalt_lord and exalt_lord != pl:
            if H[exalt_lord] == p_house:
                reasons.append(f"conjunct {exalt_lord} (exalted in this sign)")
            elif _aspects_planet(exalt_lord, H[exalt_lord], p_house):
                reasons.append(f"aspected by {exalt_lord} (exalted in this sign)")

        if _dignity(disp, pmap[disp]["sign_index"]) == "exalted":
            reasons.append(f"dispositor {disp} is exalted")
        if exalt_lord and _dignity(exalt_lord, pmap[exalt_lord]["sign_index"]) == "exalted":
            reasons.append(f"{exalt_lord} is exalted")

        d9_si = pmap[pl].get("d9_sign_index")
        d9_dig = _dignity(pl, d9_si) if d9_si is not None else None
        navamsa_sign = pmap[pl].get("d9_sign")
        if d9_si is not None:
            if d9_dig == "exalted":
                reasons.append("attains exaltation in Navamsa (D9)")
            elif d9_dig == "own":
                reasons.append("occupies own sign in Navamsa (D9)")
            if d9_si == si:
                reasons.append("Vargottama (same sign in D1 & D9)")
            disp_d9 = pmap[disp].get("d9_sign_index")
            if disp_d9 is not None:
                dd = _dignity(disp, disp_d9)
                if dd in ("exalted", "own"):
                    reasons.append(f"dispositor {disp} is {dd} in Navamsa")

        neecha_meta = {
            "planet": pl,
            "debil_sign": pmap[pl]["sign"],
            "dispositor": disp,
            "exalt_lord": exalt_lord,
            "navamsa_sign": navamsa_sign,
            "navamsa_dignity": d9_dig,
            "cancelled": bool(reasons),
            "reasons": reasons,
        }

        lords = [pl, disp]
        if exalt_lord and exalt_lord not in lords:
            lords.append(exalt_lord)

        if reasons:
            yogas.append(_item(
                "yoga", f"neecha_bhanga_{pl.lower()}", f"Neecha Bhanga Raja Yoga ({pl})", True,
                f"{pl} debilitated in {pmap[pl]['sign']} but cancelled: {'; '.join(reasons)}.",
                lords, ["neecha_bhanga_raja_yoga", "debilitated_planet"], "benefic",
                neecha=neecha_meta,
            ))
        else:
            doshas.append(_item(
                "dosha", f"{pl.lower()}_debilitated", f"{pl} Debilitated (Neecha)", True,
                f"{pl} in {pmap[pl]['sign']} with no classical cancellation — weakness in its significations.",
                [pl], [f"{pl.lower()}_weak", "debilitated_planet"], "moderate",
                neecha=neecha_meta,
            ))

    return yogas, doshas


def _kemadruma_analysis(ctx: dict) -> Optional[dict]:
    H = ctx["houses"]
    pmap = ctx["pmap"]
    m_h = H["Moon"]
    h2 = (m_h % 12) + 1
    h12 = ((m_h - 2) % 12) + 1
    flank = [n for n in pmap if n not in ("Rahu", "Ketu") and H[n] in {h2, h12}]
    if flank:
        return None

    bhanga: List[str] = []
    if H["Moon"] in KENDRAS:
        bhanga.append("Moon in kendra from Lagna")
    for pl in pmap:
        if pl in ("Rahu", "Ketu", "Sun"):
            continue
        if _house_from_moon(ctx, pl) in KENDRAS:
            bhanga.append(f"{pl} in kendra from Moon")
            break
    for b in ("Jupiter", "Venus"):
        if _linked(ctx, b, "Moon"):
            bhanga.append(f"{b} aspects/conjoins Moon — Kemadruma Bhanga")
    if _conjunct(ctx, "Moon", "Sun"):
        bhanga.append("Moon with Sun (Amavasya-adjacent cancellation in some traditions)")

    if bhanga:
        return _item(
            "yoga", "kemadruma_bhanga", "Kemadruma Bhanga", True,
            f"Kemadruma cancelled: {'; '.join(bhanga)}.",
            ["Moon", "Jupiter"], ["kemadruma_yoga"], "benefic",
            kemadruma={"cancelled": True, "reasons": bhanga},
        )
    return _item(
        "yoga", "kemadruma", "Kemadruma Yoga", True,
        "No planets in 2nd or 12th from Moon — emotional/financial fluctuations unless remedied.",
        ["Moon"], ["kemadruma_yoga"], "challenging",
        kemadruma={"cancelled": False, "reasons": []},
    )


def _moon_yogas(ctx: dict) -> List[dict]:
    yogas: List[dict] = []
    second = _planets_in_house_from_moon(ctx, 2, {"Sun"})
    twelfth = _planets_in_house_from_moon(ctx, 12, {"Sun"})
    if second and twelfth:
        lords = list(set(second + twelfth))
        yogas.append(_item(
            "yoga", "durudhara", "Durudhara Yoga", True,
            f"Planets in 2nd ({', '.join(second)}) and 12th ({', '.join(twelfth)}) from Moon — self-made prosperity.",
            lords + ["Moon"], ["dhana_yoga"], "benefic",
        ))
    elif second:
        yogas.append(_item(
            "yoga", "sunapha", "Sunapha Yoga", True,
            f"Planets in 2nd from Moon ({', '.join(second)}) — wealth through own effort.",
            second + ["Moon"], ["dhana_yoga"], "benefic",
        ))
    elif twelfth:
        yogas.append(_item(
            "yoga", "anapha", "Anapha Yoga", True,
            f"Planets in 12th from Moon ({', '.join(twelfth)}) — comfort, charity, spiritual gains.",
            twelfth + ["Moon"], ["dhana_yoga"], "benefic",
        ))

    tenth_from_moon = ((ctx["houses"]["Moon"] - 1 + 9) % 12) + 1
    amala = [p for p in BENEFICS if ctx["houses"][p] == tenth_from_moon]
    if amala:
        yogas.append(_item(
            "yoga", "amala", "Amala Yoga", True,
            f"Benefic(s) {', '.join(amala)} in 10th from Moon — spotless reputation and dharmic conduct.",
            amala + ["Moon"], ["raja_yoga"], "benefic",
        ))

    if _conjunct(ctx, "Moon", "Mars"):
        yogas.append(_item(
            "yoga", "chandra_mangala", "Chandra-Mangala Yoga", True,
            "Moon and Mars conjoined — wealth through enterprise; can also intensify Manglik traits.",
            ["Moon", "Mars"], ["kuja_dosha", "dhana_yoga"], "moderate",
        ))

    return yogas


def _analyze_accident_risk(ctx: dict) -> Optional[dict]:
    H = ctx["houses"]
    score = 0.0
    factors: List[str] = []

    def add(w: float, text: str):
        nonlocal score
        score += w
        factors.append(text)

    if _linked(ctx, "Mars", "Rahu"):
        add(2.5, "Mars linked with Rahu — sudden/vehicular injury risk")
    if _linked(ctx, "Mars", "Ketu"):
        add(2.5, "Mars linked with Ketu — cuts, wounds, surgery")
    if _linked(ctx, "Mars", "Saturn"):
        add(2.2, "Mars linked with Saturn — falls, fractures")

    if H["Mars"] in DUSTHANA:
        add(1.5, f"Mars in dusthana ({H['Mars']}H)")

    for n in ("Rahu", "Ketu"):
        if H[n] in {1, 4, 8}:
            add(1.2, f"{n} in {H[n]}H (sudden/violent events)")

    occ8 = [p for p in MALEFICS if H[p] == 8]
    if occ8:
        add(len(occ8) * 1.0, f"8th house malefics: {', '.join(occ8)}")
    occ6 = [p for p in MALEFICS if H[p] == 6]
    if occ6:
        add(len(occ6) * 0.8, f"6th house malefics: {', '.join(occ6)}")

    ll = ctx["lord_of"][1]
    for m in ("Mars", "Saturn", "Rahu", "Ketu"):
        if H[m] == 1 or _aspects_planet(m, H[m], 1):
            add(0.8, f"{m} afflicts Lagna")
        if m != ll and _linked(ctx, m, ll):
            add(0.7, f"{m} afflicts Lagna lord {ll}")

    l8 = ctx["lord_of"][8]
    if H[l8] in DUSTHANA:
        add(0.8, f"8th lord {l8} in dusthana ({H[l8]}H)")

    if score < 2.5:
        return None

    if score >= 7:
        level, severity = "High", "high"
    elif score >= 4.5:
        level, severity = "Elevated", "strong"
    elif score >= 2.5:
        level, severity = "Moderate", "moderate"
    else:
        level, severity = "Low", "low"

    lords = list({p for p in ("Mars", "Rahu", "Ketu", "Saturn", l8, ll) if p in ctx["pmap"]})
    return _item(
        "dosha", "accident_proneness", "Accident / Sudden Harm Yoga", True,
        f"Classical injury indicators score {score:.1f}/10+ — {level} risk. "
        + ("; ".join(factors[:4]) + ("…" if len(factors) > 4 else "")),
        lords, ["accident_proneness", "multiple_afflictions", "mars_affliction", "rahu_affliction"], severity,
        accident={"score": round(score, 1), "level": level, "factors": factors},
    )


def _gand_mool(ctx: dict, chart: dict) -> Optional[dict]:
    moon = ctx["pmap"]["Moon"]
    ni = moon.get("nakshatra_index")
    if ni not in GAND_MOOL_NAK:
        return None
    return _item(
        "dosha", "gand_mool", "Gand Mool (Gandanta) Dosha", True,
        f"Moon in {moon.get('nakshatra')} — Gand Mool nakshatra; requires classical shanti in infancy/troublesome periods.",
        ["Moon"], ["gand_mool", "balarishta", "multiple_afflictions"], "moderate",
        gand_mool={"nakshatra": moon.get("nakshatra"), "nakshatra_index": ni},
    )


def detect_yogas(chart: dict, ctx: dict) -> List[dict]:
    yogas = []
    H = ctx["houses"]
    pmap = ctx["pmap"]

    if _conjunct(ctx, "Sun", "Mercury"):
        yogas.append(_item("yoga", "budha_aditya", "Budha-Aditya Yoga", True,
                           "Sun and Mercury conjoined — intelligence and administrative skill.",
                           ["Sun", "Mercury"], ["budha_aditya"], "benefic"))

    jup_h = (H["Jupiter"] - H["Moon"]) % 12 + 1
    if jup_h in KENDRAS:
        yogas.append(_item("yoga", "gaja_kesari", "Gaja-Kesari Yoga", True,
                           f"Jupiter in kendra ({jup_h}H) from Moon — wisdom and reputation.",
                           ["Jupiter", "Moon"], ["gaja_kesari", "raja_yoga"], "benefic"))

    good = KENDRAS | TRIKONAS | {2}
    if all(H[p] in good for p in ("Mercury", "Jupiter", "Venus")):
        yogas.append(_item("yoga", "saraswati", "Saraswati Yoga", True,
                           "Mercury, Jupiter, Venus in kendra/trikona/2nd — learning and arts.",
                           ["Mercury", "Jupiter", "Venus"], ["saraswati_yoga"], "benefic"))

    mahapurusha = {"Mars": "Ruchaka", "Mercury": "Bhadra", "Jupiter": "Hamsa", "Venus": "Malavya", "Saturn": "Sasa"}
    for pl, yname in mahapurusha.items():
        if H[pl] in KENDRAS and _dignity(pl, pmap[pl]["sign_index"]) in ("exalted", "own"):
            yogas.append(_item("yoga", f"mahapurusha_{pl.lower()}", f"{yname} Yoga (Pancha-Mahapurusha)", True,
                               f"{pl} strong in kendra — leadership in its domain.",
                               [pl], ["pancha_mahapurusha", "raja_yoga"], "benefic"))

    kl = {ctx["lord_of"][h] for h in KENDRAS}
    tl = {ctx["lord_of"][h] for h in TRIKONAS}
    for a in kl:
        for b in tl:
            if a != b and _conjunct(ctx, a, b):
                yogas.append(_item("yoga", "raja_yoga", "Raja Yoga", True,
                                   f"Kendra lord {a} conjoins trikona lord {b} — rise in status.",
                                   [a, b], ["raja_yoga"], "benefic"))
                break

    kem = _kemadruma_analysis(ctx)
    if kem:
        yogas.append(kem)

    yogas.extend(_moon_yogas(ctx))

    # Adhi Yoga — benefics occupy 6th, 7th, and 8th from Moon
    adhi_houses = {6, 7, 8}
    covered = set()
    adhi_lords = []
    for p in BENEFICS:
        hm = _house_from_moon(ctx, p)
        if hm in adhi_houses:
            covered.add(hm)
            adhi_lords.append(p)
    if covered == adhi_houses:
        yogas.append(_item(
            "yoga", "adhi_yoga", "Adhi Yoga", True,
            f"Benefics {', '.join(sorted(set(adhi_lords)))} cover 6th, 7th & 8th from Moon — leadership, comfort, victory over enemies.",
            list(set(adhi_lords)) + ["Moon"], ["raja_yoga", "dhana_yoga"], "benefic",
        ))

    # Viparita Raja Yoga — dusthana lord in another dusthana
    for h in DUSTHANA:
        lord = ctx["lord_of"][h]
        if H[lord] in DUSTHANA and H[lord] != h:
            yogas.append(_item(
                "yoga", f"viparita_raja_{h}", f"Viparita Raja Yoga ({h}th lord)", True,
                f"Lord of {h}H ({lord}) placed in {H[lord]}H — success through adversity, reversal of fortune.",
                [lord], ["raja_yoga"], "benefic",
            ))

    # Subha Kartari — benefics in both 2nd and 12th from Moon
    m_h = H["Moon"]
    h2 = (m_h % 12) + 1
    h12 = ((m_h - 2) % 12) + 1
    b2 = [p for p in BENEFICS if p != "Moon" and H[p] == h2]
    b12 = [p for p in BENEFICS if p != "Moon" and H[p] == h12]
    if b2 and b12:
        lords = list(set(b2 + b12))
        yogas.append(_item(
            "yoga", "subha_kartari", "Subha Kartari Yoga", True,
            f"Benefics flank the Moon ({', '.join(lords)} in 2nd/12th from Moon) — protection and support.",
            lords + ["Moon"], ["raja_yoga"], "benefic",
        ))

    # Kala Sarpa — all planets in one hemisphere between Rahu and Ketu
    rahu_lon = pmap["Rahu"]["longitude"]
    ketu_lon = pmap["Ketu"]["longitude"]

    def in_arc(lon, start, end):
        lon, start, end = lon % 360, start % 360, end % 360
        if start < end:
            return start < lon < end
        return lon > start or lon < end

    arc1 = all(in_arc(pmap[n]["longitude"], rahu_lon, ketu_lon)
               for n in pmap if n not in ("Rahu", "Ketu"))
    arc2 = all(in_arc(pmap[n]["longitude"], ketu_lon, rahu_lon)
               for n in pmap if n not in ("Rahu", "Ketu"))
    between = arc1 or arc2
    if between:
        yogas.append(_item("yoga", "kala_sarpa", "Kala Sarpa Yoga", True,
                           "All planets hemmed between Rahu and Ketu — karmic intensity, sudden events.",
                           ["Rahu", "Ketu"], ["kala_sarpa"], "challenging"))

    # Dhana Yoga — lords of 2 & 11 linked to gain houses
    wealth_lords = {ctx["lord_of"][2], ctx["lord_of"][11]}
    gain_houses = {H[l] for l in wealth_lords}
    if gain_houses & {2, 5, 9, 10, 11}:
        yogas.append(_item("yoga", "dhana_yoga", "Dhana Yoga", True,
                           "Lords of 2nd & 11th linked to gain/fortune houses — supports wealth accumulation.",
                           list(wealth_lords), ["dhana_yoga", "raja_yoga"], "benefic"))

    return yogas


def detect_doshas(chart: dict, ctx: dict) -> List[dict]:
    doshas = []
    H = ctx["houses"]
    pmap = ctx["pmap"]

    # Kuja / Mangal dosha (full cancellation logic)
    kuja = _analyze_kuja(ctx)
    if kuja:
        doshas.append(kuja)

    # Pitru dosha sketch: Sun afflicted + Rahu with Sun or 9th lord weak
    ninth_lord = ctx["lord_of"][9]
    sun_h = H["Sun"]
    if sun_h in DUSTHANA or _conjunct(ctx, "Sun", "Rahu") or _dignity("Sun", pmap["Sun"]["sign_index"]) == "debilitated":
        doshas.append(_item("dosha", "pitru_dosha", "Pitru / Sun affliction", True,
                           f"Sun in {sun_h}H or with Rahu / debilitated — ancestral karmic stress.",
                           ["Sun", "Rahu", ninth_lord], ["pitru_dosha", "sun_affliction"], "moderate"))

    # Saturn afflict Lagna lord
    ll = ctx["lord_of"][1]
    if _dignity(ll, pmap[ll]["sign_index"]) == "debilitated" or H[ll] in DUSTHANA:
        doshas.append(_item("dosha", "lagna_lord_afflicted", "Lagna Lord Afflicted", True,
                           f"Lagna lord {ll} weak or in dusthana ({H[ll]}H).",
                           [ll], ["saturn_affliction", "multiple_afflictions"], "moderate"))

    # Rahu/Ketu on angles
    for n in ("Rahu", "Ketu"):
        if H[n] in {1, 4, 7, 10}:
            doshas.append(_item("dosha", f"{n.lower()}_kendra", f"{n} in Kendra", True,
                               f"{n} in {H[n]}H — sudden karmic events on angular houses.",
                               [n], ["rahu_affliction" if n == "Rahu" else "ketu_affliction", "kala_sarpa"], "moderate"))

    accident = _analyze_accident_risk(ctx)
    if accident:
        doshas.append(accident)

    gand = _gand_mool(ctx, chart)
    if gand:
        doshas.append(gand)

    # Papa Kartari — malefics flanking Moon
    m_h = H["Moon"]
    flank = {((m_h % 12) + 1), ((m_h - 2) % 12) + 1}
    papa = [p for p in MALEFICS if p not in ("Rahu", "Ketu") and H[p] in flank]
    if len(papa) >= 2:
        doshas.append(_item(
            "dosha", "papa_kartari", "Papa Kartari (Moon hemmed)", True,
            f"Malefics {', '.join(papa)} in 2nd/12th from Moon — mental pressure, blocked lunar expression.",
            papa + ["Moon"], ["kemadruma_yoga", "multiple_afflictions"], "moderate",
        ))

    # Vish Yoga — Moon with Saturn without strong benefic relief
    if _conjunct(ctx, "Moon", "Saturn"):
        relief = any(_linked(ctx, b, "Moon") for b in ("Jupiter", "Venus"))
        if not relief:
            doshas.append(_item("dosha", "vish_yoga", "Vish Yoga", True,
                               "Moon conjoined Saturn without Jupiter/Venus relief — sorrow, delays, emotional heaviness.",
                               ["Moon", "Saturn"], ["saturn_affliction", "multiple_afflictions"], "moderate"))

    return doshas


def detect_balarishta(chart: dict, ctx: dict, age_years: float) -> List[dict]:
    if age_years >= 15:
        return [{
            "kind": "note",
            "id": "balarishta_na",
            "name": "Balarishta analysis",
            "present": False,
            "detail": f"Native is {age_years:.1f} years old — Balarishta assessment applies only under age 15.",
            "severity": "info",
            "activating_lords": [],
            "condition_ids": [],
            "active_periods": [],
            "remedies": [],
        }]

    flags = []
    H = ctx["houses"]
    pmap = ctx["pmap"]
    score = 0

    if H["Moon"] in DUSTHANA:
        flags.append("Moon in dusthana (6/8/12)")
        score += 2
    if _dignity("Moon", pmap["Moon"]["sign_index"]) == "debilitated":
        flags.append("Moon debilitated")
        score += 2
    ll = ctx["lord_of"][1]
    if H[ll] in {6, 8, 12}:
        flags.append(f"Lagna lord {ll} in dusthana")
        score += 2
    malefics_lagna = [m for m in MALEFICS if H[m] == 1]
    if len(malefics_lagna) >= 2:
        flags.append(f"Multiple malefics in Lagna: {', '.join(malefics_lagna)}")
        score += 2
    moon_nak = pmap["Moon"]["nakshatra_index"]
    if moon_nak in {8, 17, 18}:  # Ashlesha, Jyeshtha, Mula (0-based: 8,17,18)
        flags.append(f"Moon in {pmap['Moon']['nakshatra']} (Gandanta-prone nakshatra)")
        score += 1
    for m in MALEFICS:
        if _aspects_planet(m, H[m], H["Moon"]) and m != "Moon":
            flags.append(f"{m} aspects Moon")
            score += 1

    severity = "high" if score >= 5 else "moderate" if score >= 3 else "low"
    present = score >= 3
    return [_item(
        "dosha", "balarishta", "Balarishta (infant/child affliction)", present,
        ("Indicators: " + "; ".join(flags) if flags else "No major classical Balarishta combinations found.")
        + " — use with pediatric care; remedies are propitiatory, not medical substitutes.",
        ["Moon", "Saturn", "Mars"], ["balarishta"],
        severity,
    )]


def analyze_chart(chart: dict, native_name: Optional[str] = None) -> dict:
    ctx = _build_context(chart)
    age = _native_age_years(chart)
    yogas = detect_yogas(chart, ctx)
    doshas = detect_doshas(chart, ctx)
    neecha_yogas, neecha_doshas = _analyze_neecha(chart, ctx)
    yogas.extend(neecha_yogas)
    doshas.extend(neecha_doshas)
    balarishta = detect_balarishta(chart, ctx, age)
    special = _sade_sati_timeline(chart)

    sade_active = [p for p in special if p.get("active_now") and p["phase"] in ("rising", "peak", "setting")]
    if sade_active:
        ph = sade_active[0]
        doshas.append(_item("dosha", "sade_sati", "Sade Sati", True,
                           f"Saturn {ph['phase']} phase ({ph['start']} to {ph['end']}) relative to natal Moon.",
                           ["Saturn", "Moon"], ["sade_sati"], "strong"))
    ashtama = [p for p in special if p.get("active_now") and p["phase"] == "ashtama_shani"]
    if ashtama:
        ph = ashtama[0]
        doshas.append(_item("dosha", "ashtama_shani", "Ashtama Shani", True,
                           f"Saturn transiting 8th from Moon ({ph['start']} to {ph['end']}).",
                           ["Saturn"], ["ashtama_shani", "sade_sati"], "moderate"))

    sb = _compute_shadbala(chart)
    dasha_now = chart.get("dasha", {})
    active_dasha_lords: Set[str] = set()
    for key in ("md", "ad", "pd"):
        entry = None
        if key == "md":
            entry = next((m for m in dasha_now.get("mds", []) if m.get("current")), None)
        elif key == "ad":
            entry = next((a for a in dasha_now.get("ads", []) if a.get("current")), None)
        else:
            entry = next((p for p in dasha_now.get("pds", []) if p.get("current")), None)
        if entry and entry.get("lord"):
            active_dasha_lords.add(entry["lord"])

    all_items = yogas + doshas + balarishta
    for item in all_items:
        if not item.get("present", True) and item["kind"] != "note":
            continue
        lords = set(item.get("activating_lords") or [])
        if lords:
            item["active_periods"] = _expand_dasha_periods(chart, lords, ctx, sb)
        item["strength"] = _item_strength(item, ctx, sb, active_dasha_lords)
        cids = item.get("condition_ids") or []
        item["remedies"] = remedies_for_conditions(cids, list(lords))

    current_dasha = {}
    for key, src in (("md", dasha_now.get("mds", [])), ("ad", dasha_now.get("ads", [])),
                     ("pd", dasha_now.get("pds", []))):
        entry = next((x for x in src if x.get("current")), None)
        if entry:
            current_dasha[key] = {
                **entry,
                "strength": _dasha_lord_strength(entry["lord"], ctx, sb),
            }

    active_yogas = [
        {"id": y["id"], "name": y["name"], "strength": y.get("strength")}
        for y in yogas if y.get("present") and y.get("strength", {}).get("activated_now")
    ]
    active_doshas = [
        {"id": d["id"], "name": d["name"], "strength": d.get("strength")}
        for d in doshas + balarishta if d.get("present") and d.get("strength", {}).get("activated_now")
    ]

    return {
        "native": {
            "name": native_name or chart["input"].get("name") or chart["input"].get("place", "Native"),
            "place": chart["input"].get("place"),
            "birth": chart["input"]["date"],
            "time": chart["input"]["time"],
            "age_years": round(age, 2),
            "balarishta_applicable": age < 15,
        },
        "summary": {
            "yogas_count": sum(1 for y in yogas if y.get("present")),
            "doshas_count": sum(1 for d in doshas if d.get("present")) + sum(1 for b in balarishta if b.get("present")),
            "sade_sati_active": bool(sade_active),
            "active_yogas_count": len(active_yogas),
            "active_doshas_count": len(active_doshas),
        },
        "current_dasha": current_dasha,
        "active_now": {
            "yogas": active_yogas,
            "doshas": active_doshas,
            "dasha_lords": sorted(active_dasha_lords),
        },
        "yogas": yogas,
        "doshas": doshas + balarishta,
        "special_periods": {
            "sade_sati_timeline": special,
            "description": "Saturn phases relative to natal Moon: rising (12th), peak (1st), setting (2nd), ardha_ashtama (4th), ashtama_shani (8th).",
        },
    }
