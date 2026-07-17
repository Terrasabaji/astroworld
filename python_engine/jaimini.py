"""
Jaimini Astrology Module

Implements core Jaimini techniques:
  - Chara Karakas (7- and 8-planet schemes)
  - Sthira (fixed) Karakas
  - Karakamsa (D9 sign of Atmakaraka)
  - Arudha Padas (AL, A2–A12, Upapada)
  - Rashi Drishti (Jaimini sign aspects)
  - Chara Dasha (sign-based mahadasha / antardasha)
"""
import datetime

SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

SIGN_LORDS = [
    "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
    "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
]

KARAKAS_7 = ["AK", "AmK", "BK", "MK", "PK", "GK", "DK"]
KARAKAS_8 = ["AK", "AmK", "BK", "MK", "PiK", "PK", "GK", "DK"]
KARAKA_FULL = {
    "AK": "Atmakaraka",
    "AmK": "Amatyakaraka",
    "BK": "Bhratrikaraka",
    "MK": "Matrikaraka",
    "PK": "Putrakaraka",
    "GK": "Gnatikaraka",
    "DK": "Darakaraka",
    "PiK": "Pitrikaraka",
}

STHIRA_KARAKAS = {
    "Sun": {"role": "Atma", "meaning": "Soul / self"},
    "Moon": {"role": "Manas", "meaning": "Mind / emotions"},
    "Mars": {"role": "Sharira", "meaning": "Physical energy / courage"},
    "Mercury": {"role": "Vachana", "meaning": "Speech / communication"},
    "Jupiter": {"role": "Jnana", "meaning": "Knowledge / wisdom"},
    "Venus": {"role": "Shukra", "meaning": "Progeny / relationships"},
    "Saturn": {"role": "Duhkha", "meaning": "Sorrow / longevity"},
    "Rahu": {"role": "Maya", "meaning": "Illusion / foreign matters"},
}

# Sign modality: 0=chara (movable), 1=sthira (fixed), 2=dvisvabhava (dual)
SIGN_MODALITY = [0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2]
CHARA_YEARS = {0: 12, 1: 7, 2: 8}  # years per sign type in Chara Dasha
TOTAL_CHARA_CYCLE = sum(CHARA_YEARS[m] for m in SIGN_MODALITY)  # 108

ARUDHA_NAMES = {
    1: "AL (Arudha Lagna)",
    2: "A2",
    3: "A3",
    4: "A4",
    5: "A5 (Mantra Pada)",
    6: "A6",
    7: "A7 (Darapada)",
    8: "A8",
    9: "A9",
    10: "A10",
    11: "A11",
    12: "UL (Upapada)",
}

SOLAR_YEAR_DAYS = 365.25


def _planet_sign_map(planets_list):
    """Return {planet_name: sign_index} for classical 7 planets + nodes."""
    return {p["name"]: p["sign_index"] for p in planets_list}


def compute_chara_karakas(planets_list, include_rahu=False):
    """Return {planet_name: karaka_abbr} sorted by degree-in-sign descending."""
    candidates = []
    for p in planets_list:
        n = p["name"]
        if n in ("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"):
            candidates.append((n, p["deg_in_sign"]))
        elif include_rahu and n == "Rahu":
            candidates.append((n, 30.0 - p["deg_in_sign"]))
    candidates.sort(key=lambda x: -x[1])
    names = KARAKAS_8 if include_rahu else KARAKAS_7
    return {n: names[i] for i, (n, _) in enumerate(candidates)}


def _karaka_detail(karakas_map, planets_list):
    """Build ordered list of karaka assignments with degrees."""
    by_abbr = {}
    for planet, abbr in karakas_map.items():
        p = next(x for x in planets_list if x["name"] == planet)
        by_abbr[abbr] = {
            "abbr": abbr,
            "full_name": KARAKA_FULL[abbr],
            "planet": planet,
            "sign": p["sign"],
            "sign_index": p["sign_index"],
            "deg_in_sign": p["deg_in_sign"],
            "d9_sign": p.get("d9_sign"),
            "d9_sign_index": p.get("d9_sign_index"),
        }
    order = KARAKAS_8 if "PiK" in karakas_map.values() else KARAKAS_7
    return [by_abbr[k] for k in order if k in by_abbr]


def compute_karakamsa(karakas_map, planets_list):
    """Karakamsa = D9 sign of the Atmakaraka planet."""
    ak_planet = next((p for p, k in karakas_map.items() if k == "AK"), None)
    if not ak_planet:
        return None
    p = next(x for x in planets_list if x["name"] == ak_planet)
    return {
        "atmakaraka": ak_planet,
        "sign": p["d9_sign"],
        "sign_index": p["d9_sign_index"],
        "d9_longitude": p.get("d9_longitude"),
        "description": f"Navamsa sign of Atmakaraka ({ak_planet})",
    }


def _arudha_pada_sign(base_sign, lord_sign):
    """
    Compute Arudha Pada sign for a given base sign.
    Count from base sign to lord's sign, then same count from lord's sign.
    Exception: if pada falls in same sign or 7th from base, advance 10 signs.
    """
    count = (lord_sign - base_sign) % 12
    if count == 0:
        count = 12
    pada = (lord_sign + count) % 12
    seventh = (base_sign + 6) % 12
    if pada == base_sign or pada == seventh:
        pada = (pada + 10) % 12
    return pada


def compute_arudha_padas(ascendant, houses, planets_list):
    """Compute Arudha Lagna and bhava padas A2–A12 (including Upapada)."""
    pmap = _planet_sign_map(planets_list)
    padas = []

    for h in houses:
        house_num = h["house"]
        base_sign = h["sign_index"]
        lord = SIGN_LORDS[base_sign]
        lord_sign = pmap.get(lord)
        if lord_sign is None:
            continue
        pada_sign = _arudha_pada_sign(base_sign, lord_sign)
        padas.append({
            "house": house_num,
            "name": ARUDHA_NAMES.get(house_num, f"A{house_num}"),
            "base_sign": SIGNS[base_sign],
            "base_sign_index": base_sign,
            "sign_lord": lord,
            "lord_in_sign": SIGNS[lord_sign],
            "lord_sign_index": lord_sign,
            "pada_sign": SIGNS[pada_sign],
            "pada_sign_index": pada_sign,
        })

    # Arudha Lagna explicitly from lagna sign (may differ from whole-sign house 1 cusp)
    lagna_sign = ascendant["sign_index"]
    lagna_lord = SIGN_LORDS[lagna_sign]
    lagna_lord_sign = pmap.get(lagna_lord, lagna_sign)
    al_sign = _arudha_pada_sign(lagna_sign, lagna_lord_sign)

    return {
        "arudha_lagna": {
            "sign": SIGNS[al_sign],
            "sign_index": al_sign,
            "lagna_sign": SIGNS[lagna_sign],
            "lagna_lord": lagna_lord,
            "lord_in_sign": SIGNS[lagna_lord_sign],
        },
        "bhava_padas": padas,
    }


def _rashi_drishti_targets(sign_index):
    """Return list of sign indices aspected by sign_index (Jaimini Rashi Drishti)."""
    mod = SIGN_MODALITY[sign_index]
    if mod == 0:  # chara (movable): 5th, 8th, 11th signs
        offsets = [4, 7, 10]
    elif mod == 1:  # sthira (fixed): 4th, 7th, 10th signs
        offsets = [3, 6, 9]
    else:  # dual: other dual signs
        offsets = [3, 6, 9]
    return [(sign_index + o) % 12 for o in offsets]


def compute_rashi_drishti():
    """Full 12×12 Jaimini Rashi Drishti table."""
    table = []
    for si in range(12):
        targets = _rashi_drishti_targets(si)
        table.append({
            "sign": SIGNS[si],
            "sign_index": si,
            "modality": ["Chara", "Sthira", "Dvisvabhava"][SIGN_MODALITY[si]],
            "aspects": [SIGNS[t] for t in targets],
            "aspect_indices": targets,
        })
    return table


def _count_planets_in_kendras(from_sign, planets_list):
    """Count planets in kendras (1,4,7,10) from a given sign."""
    kendra_signs = {(from_sign + o) % 12 for o in (0, 3, 6, 9)}
    count = 0
    for p in planets_list:
        if p["name"] in ("Ketu",):
            continue
        if p["sign_index"] in kendra_signs:
            count += 1
    return count


def _chara_dasha_sequence(start_sign, forward=True):
    """Generate 12-sign Chara Dasha sequence from start_sign."""
    seq = []
    for i in range(12):
        if forward:
            seq.append((start_sign + i) % 12)
        else:
            seq.append((start_sign - i) % 12)
    return seq


def compute_chara_dasha(ascendant, planets_list, birth_dt_utc):
    """
    Chara Dasha: sign-based periods.
    Starting sign = stronger of lagna vs 7th (by planet count in kendras).
    Direction: forward for odd signs, backward for even signs.
    """
    lagna_si = ascendant["sign_index"]
    seventh_si = (lagna_si + 6) % 12

    lagna_strength = _count_planets_in_kendras(lagna_si, planets_list)
    seventh_strength = _count_planets_in_kendras(seventh_si, planets_list)

    if seventh_strength > lagna_strength:
        start_sign = seventh_si
        start_reason = "7th house stronger (more planets in kendras)"
    else:
        start_sign = lagna_si
        start_reason = "Lagna stronger (more planets in kendras)"

    # Odd signs (1,3,5…) dash forward; even signs (2,4,6…) dash backward.
    # 0-based: Aries(0)=odd → forward; Taurus(1)=even → backward.
    forward = (start_sign % 2) == 0

    sequence = _chara_dasha_sequence(start_sign, forward)

    mds = []
    cur_start = birth_dt_utc
    for i, si in enumerate(sequence):
        years = CHARA_YEARS[SIGN_MODALITY[si]]
        end = cur_start + datetime.timedelta(days=years * SOLAR_YEAR_DAYS)
        mds.append({
            "sign": SIGNS[si],
            "sign_index": si,
            "modality": ["Chara", "Sthira", "Dvisvabhava"][SIGN_MODALITY[si]],
            "years": float(years),
            "start": cur_start.isoformat(),
            "end": end.isoformat(),
            "sequence_order": i + 1,
        })
        cur_start = end

    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    current_md_idx = None
    for i, md in enumerate(mds):
        s = datetime.datetime.fromisoformat(md["start"])
        e = datetime.datetime.fromisoformat(md["end"])
        if s <= now < e:
            current_md_idx = i
            md["current"] = True
            break

    ads = []
    current_ad_idx = None
    if current_md_idx is not None:
        md = mds[current_md_idx]
        md_years = md["years"]
        md_start = datetime.datetime.fromisoformat(md["start"])
        cur = md_start
        for ad_i, si in enumerate(sequence):
            ad_years = md_years * CHARA_YEARS[SIGN_MODALITY[si]] / TOTAL_CHARA_CYCLE
            end = cur + datetime.timedelta(days=ad_years * SOLAR_YEAR_DAYS)
            entry = {
                "md_sign": md["sign"],
                "sign": SIGNS[si],
                "sign_index": si,
                "years": round(ad_years, 6),
                "start": cur.isoformat(),
                "end": end.isoformat(),
            }
            if cur <= now < end:
                entry["current"] = True
                current_ad_idx = ad_i
            ads.append(entry)
            cur = end

    return {
        "start_sign": SIGNS[start_sign],
        "start_sign_index": start_sign,
        "start_reason": start_reason,
        "direction": "forward" if forward else "backward",
        "lagna_strength": lagna_strength,
        "seventh_strength": seventh_strength,
        "sequence": [SIGNS[s] for s in sequence],
        "mds": mds,
        "ads": ads,
        "now_utc": now.isoformat(),
    }


def compute_jaimini(ascendant, houses, planets_list, birth_dt_utc):
    """
    Main entry: compute all Jaimini features and return a unified dict.
    """
    karakas_7 = compute_chara_karakas(planets_list, include_rahu=False)
    karakas_8 = compute_chara_karakas(planets_list, include_rahu=True)

    return {
        "karaka_full": KARAKA_FULL,
        "karakas_7": karakas_7,
        "karakas_8": karakas_8,
        "karakas_7_detail": _karaka_detail(karakas_7, planets_list),
        "karakas_8_detail": _karaka_detail(karakas_8, planets_list),
        "karakamsa": compute_karakamsa(karakas_7, planets_list),
        "karakamsa_8": compute_karakamsa(karakas_8, planets_list),
        "arudha_padas": compute_arudha_padas(ascendant, houses, planets_list),
        "rashi_drishti": compute_rashi_drishti(),
        "sthira_karakas": STHIRA_KARAKAS,
        "chara_dasha": compute_chara_dasha(ascendant, planets_list, birth_dt_utc),
    }
