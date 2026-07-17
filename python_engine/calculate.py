#!/usr/bin/env python3
"""
Siddhanta Calculation Engine (Swiss Ephemeris)

JSON stdin -> JSON stdout.

Returns:
  input        : normalized inputs + JD + ayanamsa value
  ascendant    : full body row for lagna
  midheaven    : full body row for MC
  planets      : 9 primary planets + Ketu
  houses       : 12 cusps with KP sub-lord
  d9           : Navamsa longitudes and sign for each planet
  dasha        : Vimshottari MD list + expanded AD/PD for currently running periods
  engine       : swe version + ephemeris used
"""
import sys
import os
import json
import datetime
import swisseph as swe
try:
    import pytz
except ImportError:
    pytz = None

# Point Swiss Ephemeris to bundled .se1 data files.
# Falls back to Moshier analytic if files aren't found.
EPHE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ephe")
_HAS_SWIEPH_DATA = os.path.isfile(os.path.join(EPHE_PATH, "sepl_18.se1"))
if _HAS_SWIEPH_DATA:
    swe.set_ephe_path(EPHE_PATH)

AYANAMSA_MAP = {
    # Vedic / Indian ayanamsas (most commonly used in Jyotish)
    "lahiri":              swe.SIDM_LAHIRI,               # 1  - Chitrapaksha official
    "lahiri_1940":         swe.SIDM_LAHIRI_1940,          # 43
    "lahiri_vp285":        swe.SIDM_LAHIRI_VP285,         # 44
    "lahiri_icrc":         swe.SIDM_LAHIRI_ICRC,          # 46
    "raman":               swe.SIDM_RAMAN,                # 3
    "krishnamurti":        swe.SIDM_KRISHNAMURTI,         # 5   (KP)
    "krishnamurti_vp291":  swe.SIDM_KRISHNAMURTI_VP291,   # 45
    "kp":                  swe.SIDM_KRISHNAMURTI,         # alias
    "yukteshwar":          swe.SIDM_YUKTESHWAR,           # 7
    "jn_bhasin":           swe.SIDM_JN_BHASIN,            # 8
    "suryasiddhanta":      swe.SIDM_SURYASIDDHANTA,       # 21
    "suryasiddhanta_msun": swe.SIDM_SURYASIDDHANTA_MSUN,  # 22
    "aryabhata":           swe.SIDM_ARYABHATA,            # 23
    "aryabhata_msun":      swe.SIDM_ARYABHATA_MSUN,       # 24
    "aryabhata_522":       swe.SIDM_ARYABHATA_522,        # 37
    "ss_revati":           swe.SIDM_SS_REVATI,            # 25
    "ss_citra":            swe.SIDM_SS_CITRA,             # 26
    "true_citra":          swe.SIDM_TRUE_CITRA,           # 27
    "true_revati":         swe.SIDM_TRUE_REVATI,          # 28
    "true_pushya":         swe.SIDM_TRUE_PUSHYA,          # 29  (PVRN Rao)
    "true_mula":           swe.SIDM_TRUE_MULA,            # 35  (Chandra Hari)
    "true_sheoran":        swe.SIDM_TRUE_SHEORAN,         # 39
    "deluce":              swe.SIDM_DELUCE,               # 2
    "ushashashi":          swe.SIDM_USHASHASHI,           # 4
    "djwhal_khul":         swe.SIDM_DJWHAL_KHUL,          # 6
    # Western / astronomical / historical
    "fagan_bradley":       swe.SIDM_FAGAN_BRADLEY,        # 0
    "hipparchos":          swe.SIDM_HIPPARCHOS,           # 15
    "sassanian":           swe.SIDM_SASSANIAN,            # 16
    "aldebaran_15tau":     swe.SIDM_ALDEBARAN_15TAU,      # 14
    "j2000":               swe.SIDM_J2000,                # 18
    "j1900":               swe.SIDM_J1900,                # 19
    "b1950":               swe.SIDM_B1950,                # 20
    # Galactic-referenced
    "galcent_0sag":        swe.SIDM_GALCENT_0SAG,         # 17
    "galcent_rgilbrand":   swe.SIDM_GALCENT_RGILBRAND,    # 30
    "galequ_iau1958":      swe.SIDM_GALEQU_IAU1958,       # 31
    "galequ_true":         swe.SIDM_GALEQU_TRUE,          # 32
    "galequ_mula":         swe.SIDM_GALEQU_MULA,          # 33
    # Babylonian variants
    "babyl_kugler1":       swe.SIDM_BABYL_KUGLER1,        # 9
    "babyl_kugler2":       swe.SIDM_BABYL_KUGLER2,        # 10
    "babyl_kugler3":       swe.SIDM_BABYL_KUGLER3,        # 11
    "babyl_huber":         swe.SIDM_BABYL_HUBER,          # 12
    "babyl_etpsc":         swe.SIDM_BABYL_ETPSC,          # 13
    "babyl_britton":       swe.SIDM_BABYL_BRITTON,        # 38
}

PLANETS = [
    ("Sun",     swe.SUN),     ("Moon",    swe.MOON),
    ("Mars",    swe.MARS),    ("Mercury", swe.MERCURY),
    ("Jupiter", swe.JUPITER), ("Venus",   swe.VENUS),
    ("Saturn",  swe.SATURN),  ("Rahu",    swe.TRUE_NODE),  # True node (Jagannatha Hora default)
]

SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo",
         "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]

SIGN_LORDS = ["Mars","Venus","Mercury","Moon","Sun","Mercury",
              "Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"]

NAKSHATRAS = [
    ("Ashwini","Ketu"),("Bharani","Venus"),("Krittika","Sun"),
    ("Rohini","Moon"),("Mrigashira","Mars"),("Ardra","Rahu"),
    ("Punarvasu","Jupiter"),("Pushya","Saturn"),("Ashlesha","Mercury"),
    ("Magha","Ketu"),("Purva Phalguni","Venus"),("Uttara Phalguni","Sun"),
    ("Hasta","Moon"),("Chitra","Mars"),("Swati","Rahu"),
    ("Vishakha","Jupiter"),("Anuradha","Saturn"),("Jyeshtha","Mercury"),
    ("Mula","Ketu"),("Purva Ashadha","Venus"),("Uttara Ashadha","Sun"),
    ("Shravana","Moon"),("Dhanishta","Mars"),("Shatabhisha","Rahu"),
    ("Purva Bhadrapada","Jupiter"),("Uttara Bhadrapada","Saturn"),("Revati","Mercury"),
]

VIM_ORDER = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"]
VIM_YEARS = {"Ketu":7,"Venus":20,"Sun":6,"Moon":10,"Mars":7,
             "Rahu":18,"Jupiter":16,"Saturn":19,"Mercury":17}
TOTAL_VIM = 120
NAK_SPAN = 360.0 / 27.0
SOLAR_YEAR_DAYS = 365.25


def dms(v):
    sign = -1 if v < 0 else 1
    v = abs(v)
    d = int(v); mf = (v - d) * 60; m = int(mf); s = (mf - m) * 60
    return sign*d, m, round(s, 2)


def fmt_dms_in_sign(lon):
    lon = lon % 360.0
    si = int(lon // 30); within = lon - si*30
    d,m,s = dms(within)
    return si, within, f"{d:02d}\u00b0{m:02d}'{s:05.2f}\""


def nakshatra_info(lon):
    lon = lon % 360.0
    ni = int(lon // NAK_SPAN)
    within = lon - ni*NAK_SPAN
    pada = int(within // (NAK_SPAN/4)) + 1
    name, lord = NAKSHATRAS[ni]
    return {"nakshatra": name, "nakshatra_lord": lord, "pada": pada,
            "nakshatra_index": ni, "deg_within_nakshatra": within}


def _vimshottari_lord_in_span(offset, span, start_lord):
    """Lord at offset within span, subdivided from start_lord. Returns (lord, offset_in_lord, lord_span)."""
    start = VIM_ORDER.index(start_lord)
    cur = 0.0
    for i in range(9):
        pl = VIM_ORDER[(start + i) % 9]
        part = span * (VIM_YEARS[pl] / TOTAL_VIM)
        if offset < cur + part:
            return pl, offset - cur, part
        cur += part
    pl = VIM_ORDER[(start + 8) % 9]
    part = span * (VIM_YEARS[pl] / TOTAL_VIM)
    return pl, offset - (span - part), part


def kp_lord_chain(lon, depth=5):
    """KP Vimshottari lord chain: star lord + (depth-1) sub divisions."""
    lon = lon % 360.0
    ni = int(lon // NAK_SPAN)
    offset = lon - ni * NAK_SPAN
    span = NAK_SPAN
    lord = NAKSHATRAS[ni][1]
    chain = [lord]
    for _ in range(1, depth):
        lord, offset, span = _vimshottari_lord_in_span(offset, span, lord)
        chain.append(lord)
    return chain


def kp_sublord(lon):
    lon = lon % 360.0
    chain = kp_lord_chain(lon, 5)
    return {
        "sign_lord": SIGN_LORDS[int(lon // 30)],
        "star_lord": chain[0],
        "sub_lord": chain[1],
        "sub_sub_lord": chain[2],
        "sub_sub_sub_lord": chain[3],
        "sub_sub_sub_sub_lord": chain[4],
        "kp_lords": chain,
    }


def body_row(name, lon, speed=None, retro=False):
    si, within, ds = fmt_dms_in_sign(lon)
    row = {"name": name, "longitude": round(lon % 360.0, 6),
           "sign": SIGNS[si], "sign_index": si, "deg_in_sign": round(within, 6),
           "dms": ds, "retrograde": retro,
           "speed": None if speed is None else round(speed, 6)}
    row.update(nakshatra_info(lon))
    row.update(kp_sublord(lon))
    # Navamsa (D9): longitude * 9 mod 360 -> sign
    nav = (lon * 9.0) % 360.0
    nsi = int(nav // 30)
    row["d9_sign"] = SIGNS[nsi]
    row["d9_sign_index"] = nsi
    row["d9_longitude"] = round(nav, 6)
    return row


def vimshottari_dasha(moon_long, birth_dt_utc):
    """Return MD list, plus expanded AD for current MD, plus PD for current AD."""
    lon = moon_long % 360.0
    ni = int(lon // NAK_SPAN)
    within = lon - ni*NAK_SPAN
    lord = NAKSHATRAS[ni][1]
    consumed_frac = within / NAK_SPAN
    # Balance = remaining fraction of lord's period at birth
    balance_years = (1.0 - consumed_frac) * VIM_YEARS[lord]
    balance_days = balance_years * SOLAR_YEAR_DAYS

    start_idx = VIM_ORDER.index(lord)
    mds = []
    cur_start = birth_dt_utc
    # First MD (partial - the balance one)
    first_end = cur_start + datetime.timedelta(days=balance_days)
    mds.append({"lord": lord, "years": round(balance_years, 6),
                "start": cur_start.isoformat(), "end": first_end.isoformat(),
                "is_balance": True})
    cur_start = first_end
    # Remaining 8 full MDs
    for k in range(1, 9):
        pl = VIM_ORDER[(start_idx + k) % 9]
        yrs = VIM_YEARS[pl]
        end = cur_start + datetime.timedelta(days=yrs * SOLAR_YEAR_DAYS)
        mds.append({"lord": pl, "years": float(yrs),
                    "start": cur_start.isoformat(), "end": end.isoformat(),
                    "is_balance": False})
        cur_start = end

    # Find current MD based on today's UTC
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    current_md_idx = None
    for i, md in enumerate(mds):
        s = datetime.datetime.fromisoformat(md["start"])
        e = datetime.datetime.fromisoformat(md["end"])
        if s <= now < e:
            current_md_idx = i
            md["current"] = True
            break

    # Expand ADs for current MD
    ads = []
    current_ad_idx = None
    if current_md_idx is not None:
        md = mds[current_md_idx]
        md_lord = md["lord"]
        md_years = md["years"]
        md_start = datetime.datetime.fromisoformat(md["start"])
        start_ad_idx = VIM_ORDER.index(md_lord)
        cur = md_start
        for k in range(9):
            pl = VIM_ORDER[(start_ad_idx + k) % 9]
            ad_years = md_years * (VIM_YEARS[pl] / TOTAL_VIM)
            end = cur + datetime.timedelta(days=ad_years * SOLAR_YEAR_DAYS)
            entry = {"md_lord": md_lord, "lord": pl, "years": round(ad_years, 6),
                     "start": cur.isoformat(), "end": end.isoformat()}
            if cur <= now < end:
                entry["current"] = True
                current_ad_idx = k
            ads.append(entry)
            cur = end

    # Expand PDs for current AD
    pds = []
    if current_ad_idx is not None:
        ad = ads[current_ad_idx]
        ad_lord = ad["lord"]
        ad_years = ad["years"]
        ad_start = datetime.datetime.fromisoformat(ad["start"])
        start_pd_idx = VIM_ORDER.index(ad_lord)
        cur = ad_start
        for k in range(9):
            pl = VIM_ORDER[(start_pd_idx + k) % 9]
            pd_years = ad_years * (VIM_YEARS[pl] / TOTAL_VIM)
            end = cur + datetime.timedelta(days=pd_years * SOLAR_YEAR_DAYS)
            entry = {"ad_lord": ad_lord, "lord": pl, "years": round(pd_years, 6),
                     "start": cur.isoformat(), "end": end.isoformat()}
            if cur <= now < end:
                entry["current"] = True
            pds.append(entry)
            cur = end

    return {
        "nakshatra_at_birth": NAKSHATRAS[ni][0],
        "lord_at_birth": lord,
        "balance_years": round(balance_years, 6),
        "mds": mds,
        "current_md_index": current_md_idx,
        "ads": ads,
        "pds": pds,
        "now_utc": now.isoformat(),
    }


# ==================================================================
# Divisional Charts (Shodasha Vargas per Parashari)
# ==================================================================
# Each function takes (rasi_sign_index 0-11, deg_in_sign 0-30) and returns
# the divisional sign index (0-11).

def d1(rasi, deg):       return rasi
def d2(rasi, deg):
    is_odd = (rasi % 2 == 0)   # Aries(0) is 1st sign (odd)
    if deg < 15:  return 4 if is_odd else 3   # Leo or Cancer
    else:         return 3 if is_odd else 4

def d3(rasi, deg):
    return (rasi + (int(deg // 10)) * 4) % 12  # +0, +4, +8

def d4(rasi, deg):
    return (rasi + int(deg // 7.5) * 3) % 12   # +0, +3, +6, +9

def d7(rasi, deg):
    idx = int(deg / (30.0 / 7.0))
    start = rasi if rasi % 2 == 0 else (rasi + 6) % 12
    return (start + idx) % 12

def d9(rasi, deg):
    idx = int(deg / (30.0 / 9.0))
    # Movable (0,3,6,9), Fixed (1,4,7,10), Dual (2,5,8,11)
    if rasi % 3 == 0:   start = rasi
    elif rasi % 3 == 1: start = (rasi + 8) % 12
    else:               start = (rasi + 4) % 12
    return (start + idx) % 12

def d10(rasi, deg):
    idx = int(deg / 3.0)
    start = rasi if rasi % 2 == 0 else (rasi + 8) % 12
    return (start + idx) % 12

def d12(rasi, deg):
    return (rasi + int(deg / 2.5)) % 12

def d16(rasi, deg):
    idx = int(deg / (30.0 / 16.0))
    if rasi % 3 == 0:   start = 0    # Aries
    elif rasi % 3 == 1: start = 4    # Leo
    else:               start = 8    # Sagittarius
    return (start + idx) % 12

def d20(rasi, deg):
    idx = int(deg / 1.5)
    if rasi % 3 == 0:   start = 0    # Aries
    elif rasi % 3 == 1: start = 8    # Sagittarius
    else:               start = 4    # Leo
    return (start + idx) % 12

def d24(rasi, deg):
    idx = int(deg / 1.25)
    start = 4 if rasi % 2 == 0 else 3   # Odd -> Leo, Even -> Cancer
    return (start + idx) % 12

def d27(rasi, deg):
    idx = int(deg / (30.0 / 27.0))
    # By element: Fire=Aries, Earth=Cancer, Air=Libra, Water=Capricorn
    element = rasi % 4
    start = {0: 0, 1: 3, 2: 6, 3: 9}[element]
    return (start + idx) % 12

def d30(rasi, deg):
    if rasi % 2 == 0:  # Odd (male) signs
        if   deg <  5: return 0     # Mars  -> Aries
        elif deg < 10: return 10    # Saturn-> Aquarius
        elif deg < 18: return 8     # Jup   -> Sagittarius
        elif deg < 25: return 2     # Merc  -> Gemini
        else:          return 6     # Venus -> Libra
    else:              # Even (female) signs
        if   deg <  5: return 1     # Venus -> Taurus
        elif deg < 12: return 5     # Merc  -> Virgo
        elif deg < 20: return 11    # Jup   -> Pisces
        elif deg < 25: return 9     # Saturn-> Capricorn
        else:          return 7     # Mars  -> Scorpio

def d40(rasi, deg):
    idx = int(deg / 0.75)
    start = 0 if rasi % 2 == 0 else 6    # Odd->Aries, Even->Libra
    return (start + idx) % 12

def d45(rasi, deg):
    idx = int(deg / (30.0 / 45.0))
    if rasi % 3 == 0:   start = 0
    elif rasi % 3 == 1: start = 4
    else:               start = 8
    return (start + idx) % 12

def d60(rasi, deg):
    return (rasi + int(deg / 0.5)) % 12

VARGA_FNS = {
    "D1": d1, "D2": d2, "D3": d3, "D4": d4, "D7": d7, "D9": d9,
    "D10": d10, "D12": d12, "D16": d16, "D20": d20, "D24": d24,
    "D27": d27, "D30": d30, "D40": d40, "D45": d45, "D60": d60,
}
VARGA_NAMES = {
    "D1":"Rashi","D2":"Hora","D3":"Drekkana","D4":"Chaturthamsa",
    "D7":"Saptamsa","D9":"Navamsa","D10":"Dashamsha","D12":"Dwadashamsha",
    "D16":"Shodasamsha","D20":"Vimshamsha","D24":"Chaturvimshamsha",
    "D27":"Bhamsha","D30":"Trimshamsha","D40":"Khavedamsha",
    "D45":"Akshavedamsha","D60":"Shashtiamsha",
}


def compute_all_vargas(bodies_with_asc):
    """For each body, compute the sign index in each of the 16 divisional charts.
    Returns: {"D1": {"Ascendant": 2, "Sun": 10, ...}, "D9": {...}, ...}"""
    out = {}
    for d_key, fn in VARGA_FNS.items():
        row = {}
        for body in bodies_with_asc:
            row[body["name"]] = fn(body["sign_index"], body["deg_in_sign"])
        out[d_key] = row
    return out


# ==================================================================
# KP Significators & Cuspal Interlink
# ==================================================================
# Ashtakavarga (Bhinnashtakavarga per planet + Sarvashtakavarga)
# ==================================================================
# Classical Parashari benefic-point rules. For each of 7 planets P, and for each
# of its 8 "contributors" C (Sun/Moon/Mars/Merc/Jup/Ven/Sat + Ascendant), a bindu
# is added to signs at the listed house-offsets (1-12) counted FROM C's natal sign.
# Total per planet's BAV: 39-56 bindus. Sum of all 7 BAVs = 337 (SAV total).

BAV_RULES = {
    "Sun": {
        "Sun":       [1,2,4,7,8,9,10,11],
        "Moon":      [3,6,10,11],
        "Mars":      [1,2,4,7,8,9,10,11],
        "Mercury":   [3,5,6,9,10,11,12],
        "Jupiter":   [5,6,9,11],
        "Venus":     [6,7,12],
        "Saturn":    [1,2,4,7,8,9,10,11],
        "Ascendant": [3,4,6,10,11,12],
    },
    "Moon": {
        "Sun":       [3,6,7,8,10,11],
        "Moon":      [1,3,6,7,10,11],
        "Mars":      [2,3,5,6,9,10,11],
        "Mercury":   [1,3,4,5,7,8,10,11],
        "Jupiter":   [1,4,7,8,10,11,12],
        "Venus":     [3,4,5,7,9,10,11],
        "Saturn":    [3,5,6,11],
        "Ascendant": [3,6,10,11],
    },
    "Mars": {
        "Sun":       [3,5,6,10,11],
        "Moon":      [3,6,11],
        "Mars":      [1,2,4,7,8,10,11],
        "Mercury":   [3,5,6,11],
        "Jupiter":   [6,10,11,12],
        "Venus":     [6,8,11,12],
        "Saturn":    [1,4,7,8,9,10,11],
        "Ascendant": [1,3,6,10,11],
    },
    "Mercury": {
        "Sun":       [5,6,9,11,12],
        "Moon":      [2,4,6,8,10,11],
        "Mars":      [1,2,4,7,8,9,10,11],
        "Mercury":   [1,3,5,6,9,10,11,12],
        "Jupiter":   [6,8,11,12],
        "Venus":     [1,2,3,4,5,8,9,11],
        "Saturn":    [1,2,4,7,8,9,10,11],
        "Ascendant": [1,2,4,6,8,10,11],
    },
    "Jupiter": {
        "Sun":       [1,2,3,4,7,8,9,10,11],
        "Moon":      [2,5,7,9,11],
        "Mars":      [1,2,4,7,8,10,11],
        "Mercury":   [1,2,4,5,6,9,10,11],
        "Jupiter":   [1,2,3,4,7,8,10,11],
        "Venus":     [2,5,6,9,10,11],
        "Saturn":    [3,5,6,12],
        "Ascendant": [1,2,4,5,6,7,9,10,11],
    },
    "Venus": {
        "Sun":       [8,11,12],
        "Moon":      [1,2,3,4,5,8,9,11,12],
        "Mars":      [3,5,6,9,11,12],
        "Mercury":   [3,5,6,9,11],
        "Jupiter":   [5,8,9,10,11],
        "Venus":     [1,2,3,4,5,8,9,10,11],
        "Saturn":    [3,4,5,8,9,10,11],
        "Ascendant": [1,2,3,4,5,8,9,11],
    },
    "Saturn": {
        "Sun":       [1,2,4,7,8,10,11],
        "Moon":      [3,6,11],
        "Mars":      [3,5,6,10,11,12],
        "Mercury":   [6,8,9,10,11,12],
        "Jupiter":   [5,6,11,12],
        "Venus":     [6,11,12],
        "Saturn":    [3,5,6,11],
        "Ascendant": [1,3,4,6,10,11],
    },
}


def compute_ashtakavarga(planets_list, ascendant):
    """Compute Bhinnashtakavarga (per-planet 12-sign bindu vector) and
    Sarvashtakavarga (12-sign aggregate). Also returns the contribution matrix
    (per planet: 8 contributors x 12 signs)."""
    # Locate each contributor's sign
    positions = {b["name"]: b["sign_index"] for b in planets_list}
    positions["Ascendant"] = ascendant["sign_index"]

    bav = {}                 # planet -> [12-list of bindus]
    contribution = {}        # planet -> {contributor: [12-list]}

    for planet, rules in BAV_RULES.items():
        vec = [0] * 12
        contrib_matrix = {}
        for contributor, offsets in rules.items():
            row = [0] * 12
            base = positions[contributor]
            for off in offsets:
                sign = (base + off - 1) % 12
                row[sign] = 1
                vec[sign] += 1
            contrib_matrix[contributor] = row
        bav[planet] = vec
        contribution[planet] = contrib_matrix

    sav = [0] * 12
    for planet in BAV_RULES:
        for i in range(12):
            sav[i] += bav[planet][i]

    return {
        "bav": bav,
        "sav": sav,
        "contribution": contribution,
        "totals": {p: sum(v) for p, v in bav.items()},
        "sav_total": sum(sav),
    }



# ==================================================================

def sign_lord_of(sign_idx):
    return SIGN_LORDS[sign_idx]


def house_of_planet(planet_long, cusps):
    """Return house 1..12 that the planet occupies given the 12 cusps."""
    for h in range(12):
        c1 = cusps[h] % 360.0
        c2 = cusps[(h + 1) % 12] % 360.0
        # Handle wrap
        pl = planet_long % 360.0
        if c1 <= c2:
            if c1 <= pl < c2: return h + 1
        else:  # crosses 0/360
            if pl >= c1 or pl < c2: return h + 1
    return 12  # fallback


def houses_owned_by_planet(planet_name, cusps):
    """Return list of houses owned by planet (i.e., houses whose cusp sign is ruled by this planet)."""
    owned = []
    for h in range(12):
        sign_idx = int(cusps[h] // 30) % 12
        if sign_lord_of(sign_idx) == planet_name:
            owned.append(h + 1)
    return owned


def kp_significators(planets_list, ascendant, cusps):
    """Compute KP significators for each planet.

    Rules (in order of strength):
      1. Planets in the star (nakshatra) of a planet occupying house X → strong signif of X
      2. Planet itself in house X → signifies X
      3. Planets in the star of a planet owning house X → signifies X
      4. Planet owning house X → signifies X (weakest)

    Also identifies Rahu/Ketu who act as agents of their occupied-sign-lord and
    conjunct/aspecting planets. For MVP we treat them like other planets.
    """
    # Include Ascendant as a "body" for house-occupancy lookups (it's always at cusp1 by definition)
    all_bodies = list(planets_list)  # do NOT include Ascendant as a body-occupier

    # Precompute house-of and star-lord-of for every planet
    planet_house = {}
    planet_starlord = {}
    for b in all_bodies:
        planet_house[b["name"]] = house_of_planet(b["longitude"], cusps)
        planet_starlord[b["name"]] = b["nakshatra_lord"]

    # Which planets occupy each house
    occupants = {h: [] for h in range(1, 13)}
    for p, h in planet_house.items():
        occupants[h].append(p)

    # Which planets own each house
    ownership = {h: sign_lord_of(int(cusps[h - 1] // 30) % 12) for h in range(1, 13)}
    # Note some planets own two signs (all except Sun/Moon), so multiple houses can share the same lord.

    # For each planet, list the houses signified at each level.
    result = {}
    for b in all_bodies:
        name = b["name"]
        starlord = planet_starlord[name]  # planet whose nakshatra this body is in
        # Level A: houses occupied by star lord
        A_occ = [planet_house[starlord]] if starlord in planet_house else []
        # Level B: houses this planet itself occupies
        B_occ = [planet_house[name]]
        # Level C: houses owned by star lord
        C_own = houses_owned_by_planet(starlord, cusps) if starlord in planet_house else []
        # Level D: houses owned by planet itself
        D_own = houses_owned_by_planet(name, cusps)

        # Aggregate unique houses
        all_houses = sorted(set(A_occ + B_occ + C_own + D_own))
        result[name] = {
            "star_lord": starlord,
            "level_A_star_lord_occupies": sorted(set(A_occ)),
            "level_B_planet_occupies":    sorted(set(B_occ)),
            "level_C_star_lord_owns":     sorted(set(C_own)),
            "level_D_planet_owns":        sorted(set(D_own)),
            "all_signified_houses":       all_houses,
        }
    return result, ownership


def kp_cuspal_interlink(cusp_rows, cusps):
    """For each of 12 cusps, expose Rashi Lord, Nakshatra (Star) Lord, Sub Lord, Sub-Sub Lord.
    These are already computed on cusp_rows via body_row(). We also indicate the KP significance
    hint: cusp's sub-lord determines whether the matter of that house materializes."""
    interlink = []
    for i, c in enumerate(cusp_rows, start=1):
        interlink.append({
            "house": i,
            "cusp_dms": c["dms"],
            "sign": c["sign"],
            "rashi_lord":  c["sign_lord"],
            "star_lord":   c.get("star_lord") or c["nakshatra_lord"],
            "sub_lord":    c["sub_lord"],
            "sub_sub_lord": c["sub_sub_lord"],
            "sub_sub_sub_lord": c.get("sub_sub_sub_lord"),
            "sub_sub_sub_sub_lord": c.get("sub_sub_sub_sub_lord"),
            "kp_lords": c.get("kp_lords") or [
                c.get("star_lord") or c["nakshatra_lord"],
                c["sub_lord"], c["sub_sub_lord"],
                c.get("sub_sub_sub_lord"), c.get("sub_sub_sub_sub_lord"),
            ],
        })
    return interlink



# ---------- Upagrahas: Gulika & Maandi ----------
# Uttarakalamrita / Jagannatha Hora convention.
# Day (sunrise -> sunset) or Night (sunset -> next sunrise) divided into 8 equal
# portions. The first 7 portions are ruled by planets in the Chaldean-derived
# sequence starting from the weekday lord (day) or the 5th weekday's lord (night).
# Gulika = Ascendant at the moment Saturn's portion ENDS.
# Maandi = Ascendant half a portion later (i.e. middle of the portion after Saturn).
# Sunrise uses bimbamadhya (disc-center) with NO atmospheric refraction, matching
# classical Indian astronomical convention.

DAY_SEQUENCE = {
    0: ["Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars"],       # Sunday
    1: ["Moon", "Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury"],       # Monday
    2: ["Mars", "Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter"],       # Tuesday
    3: ["Mercury", "Moon", "Saturn", "Jupiter", "Mars", "Sun", "Venus"],       # Wednesday
    4: ["Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon", "Saturn"],       # Thursday
    5: ["Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars", "Sun"],       # Friday
    6: ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"],       # Saturday
}
WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


def _jd_to_local_dt(jd_ut, tz_offset_hours):
    return datetime.datetime(2000, 1, 1) + datetime.timedelta(
        days=jd_ut - 2451544.5 + tz_offset_hours / 24.0
    )


def compute_upagrahas(jd_ut_birth, lat, lon, tz_offset, calc_flag):
    geopos = (lon, lat, 0.0)
    ephe_only = swe.FLG_SWIEPH if _HAS_SWIEPH_DATA else swe.FLG_MOSEPH
    rsmi_rise = swe.CALC_RISE | swe.BIT_DISC_CENTER | swe.BIT_NO_REFRACTION
    rsmi_set  = swe.CALC_SET  | swe.BIT_DISC_CENTER | swe.BIT_NO_REFRACTION

    # Bracketing sunrise/sunset: sunrise-of-birth-day, sunset-of-birth-day, next sunrise
    _, tret = swe.rise_trans(jd_ut_birth - 1.0, swe.SUN, rsmi_rise, geopos, 0, 0, ephe_only)
    sr = tret[0]
    _, tret = swe.rise_trans(sr, swe.SUN, rsmi_set, geopos, 0, 0, ephe_only)
    ss = tret[0]
    _, tret = swe.rise_trans(ss, swe.SUN, rsmi_rise, geopos, 0, 0, ephe_only)
    sr_next = tret[0]

    is_day = sr <= jd_ut_birth < ss
    # Weekday of the sunrise date (astrological day starts at sunrise)
    sr_local = _jd_to_local_dt(sr, tz_offset)
    weekday_sun0 = (sr_local.weekday() + 1) % 7   # 0=Sunday..6=Saturday

    if is_day:
        boundary_start, boundary_end = sr, ss
        seq_weekday = weekday_sun0
        birth_period = "day"
    else:
        birth_period = "night"
        if jd_ut_birth >= ss:
            boundary_start, boundary_end = ss, sr_next
        else:
            # Before sunrise on birth day -> previous night
            _, tret = swe.rise_trans(sr - 1.5, swe.SUN, rsmi_set, geopos, 0, 0, ephe_only)
            boundary_start, boundary_end = tret[0], sr
        # Night sequence uses the 5th weekday's daytime lord
        seq_weekday = (weekday_sun0 + 4) % 7

    total = boundary_end - boundary_start
    part_dur = total / 8.0
    seq = DAY_SEQUENCE[seq_weekday]
    saturn_idx = seq.index("Saturn")   # 0..6

    # End of Saturn's portion = boundary_start + (saturn_idx+1)*part_dur
    gulika_jd = boundary_start + (saturn_idx + 1) * part_dur
    maandi_jd = gulika_jd + part_dur / 2.0

    _, ascmc_g = swe.houses_ex(gulika_jd, lat, lon, b'P', calc_flag)
    _, ascmc_m = swe.houses_ex(maandi_jd, lat, lon, b'P', calc_flag)

    return {
        "gulika": body_row("Gulika", ascmc_g[0]),
        "maandi": body_row("Maandi", ascmc_m[0]),
        "sunrise_local": _jd_to_local_dt(sr, tz_offset).isoformat(),
        "sunset_local":  _jd_to_local_dt(ss, tz_offset).isoformat(),
        "part_duration_min": round(part_dur * 24 * 60, 3),
        "birth_period": birth_period,
        "astro_weekday": WEEKDAY_NAMES[weekday_sun0],
        "sequence_weekday": WEEKDAY_NAMES[seq_weekday],
        "portion_sequence": seq,
        "saturn_portion_index": saturn_idx + 1,
    }



from jaimini import compute_jaimini


def main():
    try:
        p = json.loads(sys.stdin.read())
        ay = p.get("ayanamsa", "lahiri").lower()
        if ay not in AYANAMSA_MAP:
            raise ValueError(f"Unknown ayanamsa: {ay}")
        hs = p.get("house_system", "P").upper()
        if ay == "kp" and hs != "P":
            hs = "P"
        swe.set_sid_mode(AYANAMSA_MAP[ay], 0, 0)

        y = int(p["year"]); mo = int(p["month"]); d = int(p["day"])
        hh = int(p["hour"]); mm = int(p["minute"]); ss = int(p.get("second", 0))

        # Resolve timezone offset: prefer IANA tz_name if provided (DST-aware for historical dates)
        tz_name = p.get("tz_name")
        tz = p.get("tz_offset")
        if tz_name and pytz:
            try:
                zone = pytz.timezone(tz_name)
                naive = datetime.datetime(y, mo, d, hh, mm, ss)
                localized = zone.localize(naive, is_dst=None)
                tz = localized.utcoffset().total_seconds() / 3600.0
            except Exception:
                # Ambiguous or non-existent local time (DST transition) - fall back to numeric offset if given
                if tz is None:
                    raise
        if tz is None:
            raise ValueError("Provide either tz_offset (numeric hours) or a valid tz_name (IANA)")
        tz = float(tz)

        (jd_et, jd_ut) = swe.utc_to_jd(y, mo, d, hh, mm, ss, 1)
        jd_ut = jd_ut - (tz / 24.0)
        jd_et = jd_et - (tz / 24.0)

        # UTC birth datetime for dasha date arithmetic
        birth_local = datetime.datetime(y, mo, d, hh, mm, ss)
        birth_utc = birth_local - datetime.timedelta(hours=tz)

        lat = float(p["latitude"]); lon = float(p["longitude"])
        # Choose ephemeris: Swiss (JPL-derived .se1 files) if available, else Moshier fallback
        node_type = p.get("node_type", "true").lower()  # "true" or "mean"
        if node_type == "mean":
            planets_to_use = [(n, swe.MEAN_NODE if pid == swe.TRUE_NODE else pid) for (n, pid) in PLANETS]
        else:
            planets_to_use = PLANETS
        # FLG_TRUEPOS returns true geometric positions (no aberration / light-time / gravitational
        # deflection). This is the Vedic-standard: Jagannatha Hora, Parashara's Light, etc. all
        # use true positions since classical Sanskrit formulas do not model these relativistic
        # corrections. Difference vs "apparent" is up to ~20 arcseconds for planets.
        apparent = bool(p.get("apparent", False))
        flag = swe.FLG_SIDEREAL | swe.FLG_SPEED
        if _HAS_SWIEPH_DATA:
            flag |= swe.FLG_SWIEPH
        else:
            flag |= swe.FLG_MOSEPH
        if not apparent:
            flag |= swe.FLG_TRUEPOS

        bodies = []; rahu_lon = None; moon_lon = None
        for name, pid in planets_to_use:
            res, _ = swe.calc_ut(jd_ut, pid, flag)
            plon, plat_, dist, spd, _, _ = res
            bodies.append(body_row(name, plon, spd, spd < 0))
            if name == "Rahu": rahu_lon = plon
            if name == "Moon": moon_lon = plon
        bodies.append(body_row("Ketu", (rahu_lon + 180.0) % 360.0, None, True))

        cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, hs.encode("ascii"), flag)
        asc = body_row("Ascendant", ascmc[0])
        mc  = body_row("Midheaven (MC)", ascmc[1])
        houses = []
        for i, c in enumerate(cusps[:12], start=1):
            r = body_row(f"House {i}", c); r["house"] = i; houses.append(r)

        dasha = vimshottari_dasha(moon_lon, birth_utc)
        upagrahas = compute_upagrahas(jd_ut, lat, lon, tz, flag)

        # Divisional charts (all 16 Shodasha Vargas)
        bodies_with_asc = [asc] + bodies
        vargas = compute_all_vargas(bodies_with_asc)

        # KP Significators + Cuspal Interlink
        kp_sigs, house_ownership = kp_significators(bodies, asc, [c for c in cusps[:12]])
        kp_interlink = kp_cuspal_interlink(houses, [c for c in cusps[:12]])

        # Ashtakavarga (Bhinna + Sarva)
        ashtaka = compute_ashtakavarga(bodies, asc)

        # Jaimini astrology (separate module)
        jaimini = compute_jaimini(asc, houses, bodies, birth_utc)
        karakas_7 = jaimini["karakas_7"]
        karakas_8 = jaimini["karakas_8"]
        for b in bodies:
            b["karaka_7"] = karakas_7.get(b["name"])
            b["karaka_8"] = karakas_8.get(b["name"])

        out = {
            "input": {
                "date": f"{y:04d}-{mo:02d}-{d:02d}",
                "time": f"{hh:02d}:{mm:02d}:{ss:02d}",
                "tz_offset": tz, "latitude": lat, "longitude": lon,
                "tz_name": tz_name,
                "place": p.get("place"),
                "name": p.get("name"),
                "ayanamsa": ay,
                "ayanamsa_value": round(swe.get_ayanamsa_ut(jd_ut), 6),
                "house_system": hs, "jd_ut": jd_ut,
                "birth_utc": birth_utc.isoformat(),
            },
            "ascendant": asc,
            "midheaven": mc,
            "planets": bodies,
            "houses": houses,
            "dasha": dasha,
            "upagrahas": upagrahas,
            "vargas": vargas,
            "varga_names": VARGA_NAMES,
            "kp_significators": kp_sigs,
            "kp_cuspal_interlink": kp_interlink,
            "house_ownership": house_ownership,
            "ashtakavarga": ashtaka,
            "karakas_7": karakas_7,
            "karakas_8": karakas_8,
            "jaimini": jaimini,
            "engine": {"swe_version": swe.version,
                       "ephemeris": "Swiss Ephemeris (.se1)" if _HAS_SWIEPH_DATA else "Moshier",
                       "node_type": node_type,
                       "position_type": "apparent" if apparent else "true (geometric)"},
        }

        # ============ Optional TRANSIT computation ============
        # If payload includes {"transit": {year, month, day, hour, minute, tz_offset|tz_name}}
        # compute transit planetary positions at that instant using the birth location's houses.
        # Ascendant of transit is computed at birth location (for gochara vs natal comparisons).
        t_payload = p.get("transit")
        if t_payload:
            try:
                ty = int(t_payload["year"]); tmo = int(t_payload["month"]); td = int(t_payload["day"])
                thh = int(t_payload.get("hour", 12)); tmm = int(t_payload.get("minute", 0)); tss = int(t_payload.get("second", 0))
                t_tz_name = t_payload.get("tz_name") or tz_name
                t_tz = t_payload.get("tz_offset")
                if t_tz_name and pytz:
                    try:
                        zone = pytz.timezone(t_tz_name)
                        localized = zone.localize(datetime.datetime(ty, tmo, td, thh, tmm, tss), is_dst=None)
                        t_tz = localized.utcoffset().total_seconds() / 3600.0
                    except Exception:
                        pass
                if t_tz is None: t_tz = tz
                t_tz = float(t_tz)
                (_, t_jd_ut) = swe.utc_to_jd(ty, tmo, td, thh, tmm, tss, 1)
                t_jd_ut = t_jd_ut - (t_tz / 24.0)

                t_bodies = []; t_rahu = None
                for name, pid in planets_to_use:
                    res, _ = swe.calc_ut(t_jd_ut, pid, flag)
                    tplon, _, _, tspd, _, _ = res
                    t_bodies.append(body_row(name, tplon, tspd, tspd < 0))
                    if name == "Rahu": t_rahu = tplon
                t_bodies.append(body_row("Ketu", (t_rahu + 180.0) % 360.0, None, True))

                t_cusps, t_ascmc = swe.houses_ex(t_jd_ut, lat, lon, hs.encode("ascii"), flag)
                t_asc = body_row("Ascendant", t_ascmc[0])
                t_bodies_with_asc = [t_asc] + t_bodies
                t_vargas = compute_all_vargas(t_bodies_with_asc)

                out["transit"] = {
                    "input": {
                        "date": f"{ty:04d}-{tmo:02d}-{td:02d}",
                        "time": f"{thh:02d}:{tmm:02d}:{tss:02d}",
                        "tz_offset": t_tz, "tz_name": t_tz_name,
                        "jd_ut": t_jd_ut,
                    },
                    "ascendant": t_asc,
                    "planets": t_bodies,
                    "vargas": t_vargas,
                }
            except Exception as te:
                out["transit_error"] = str(te)
        sys.stdout.write(json.dumps(out))
    except Exception as e:
        sys.stdout.write(json.dumps({"error": str(e), "type": type(e).__name__}))
        sys.exit(1)


if __name__ == "__main__":
    main()
