"""
Astro World — Comprehensive Muhurta (electional) engine.
Panchanga, dosha detection, scoring, remedies, and time-range search.
"""
import datetime
import math

import swisseph as swe

import calculate as calc
from muhurta_events import EVENT_BY_ID, EVENT_CATALOG

YOGA_NAMES = [
    "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda",
    "Sukarma", "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva",
    "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyan",
    "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla",
    "Brahma", "Indra", "Vaidhriti",
]

KARANA_NAMES = [
    "Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti",
    "Shakuni", "Chatushpada", "Naga", "Kimstughna",
]

TITHI_NAMES = [
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi",
    "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
    "Trayodashi", "Chaturdashi", "Purnima/Amavasya",
]

# Rahu / Yamaganda / Gulika portion index (1-based of 8 day parts from sunrise)
RAHU_PART = {0: 7, 1: 6, 2: 5, 3: 4, 4: 3, 5: 2, 6: 1}
YAMA_PART = {0: 4, 1: 3, 2: 2, 3: 1, 4: 7, 5: 6, 6: 5}
GULIKA_PART = {0: 6, 1: 5, 2: 4, 3: 3, 4: 2, 5: 1, 6: 7}

DAY_CHOGHADIYA = {
    0: ["Udveg", "Chal", "Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg"],
    1: ["Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Chal", "Labh", "Amrit"],
    2: ["Rog", "Udveg", "Chal", "Labh", "Amrit", "Kaal", "Shubh", "Rog"],
    3: ["Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Chal", "Labh"],
    4: ["Shubh", "Rog", "Udveg", "Chal", "Labh", "Amrit", "Kaal", "Shubh"],
    5: ["Chal", "Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Chal"],
    6: ["Kaal", "Shubh", "Rog", "Udveg", "Chal", "Labh", "Amrit", "Kaal"],
}

NIGHT_CHOGHADIYA = {
    0: ["Shubh", "Amrit", "Chal", "Rog", "Kaal", "Labh", "Udveg", "Shubh"],
    1: ["Chal", "Rog", "Kaal", "Labh", "Udveg", "Shubh", "Amrit", "Chal"],
    2: ["Kaal", "Labh", "Udveg", "Shubh", "Amrit", "Chal", "Rog", "Kaal"],
    3: ["Udveg", "Shubh", "Amrit", "Chal", "Rog", "Kaal", "Labh", "Udveg"],
    4: ["Amrit", "Chal", "Rog", "Kaal", "Labh", "Udveg", "Shubh", "Amrit"],
    5: ["Rog", "Kaal", "Labh", "Udveg", "Shubh", "Amrit", "Chal", "Rog"],
    6: ["Labh", "Udveg", "Shubh", "Amrit", "Chal", "Rog", "Kaal", "Labh"],
}

HORA_SEQUENCE = ["Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars"]
WEEKDAY_LORD = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]

# Tara (nakshatra) groups for tarabalam from janma nakshatra (1-based count)
TARA_NAMES = ["Janma", "Sampat", "Vipat", "Kshema", "Pratyak", "Sadhaka", "Vadha",
              "Mitra", "Ati-Mitra"]

REMEDIES = {
    "rahu_kaal": {
        "title": "Rahu Kaal",
        "remedy": "Perform Ganapati puja before the event; donate black sesame and blue cloth; chant Rahu mantra 108 times; if unavoidable, start with worship of Lord Ganesha.",
    },
    "yamaganda": {
        "title": "Yamaganda Kaal",
        "remedy": "Worship Yama or Lord Shiva; donate iron articles on Saturday; recite Maha Mrityunjaya mantra; postpone if possible.",
    },
    "gulika_kaal": {
        "title": "Gulika Kaal",
        "remedy": "Worship Saturn (Shani) with oil lamp on Saturday; charity to elderly and disabled; chant Shani stotra; Gulika can be used for specific tantric works only — avoid for auspicious events.",
    },
    "dur_muhurta": {
        "title": "Dur Muhurta",
        "remedy": "Perform brief Ganapati puja and Kalasha sthapana; consult local panchanga for exact Dur Muhurta windows.",
    },
    "inauspicious_tithi": {
        "title": "Inauspicious Tithi",
        "remedy": "Worship the tithi lord; perform Shanti puja; donate as per paksha (white items Shukla, dark items Krishna); choose next favorable tithi if possible.",
    },
    "inauspicious_nakshatra": {
        "title": "Inauspicious Nakshatra",
        "remedy": "Worship nakshatra lord with flowers of favorable color; perform Nakshatra Shanti; charity to brahmins; use Tara Shanti remedies per janma nakshatra.",
    },
    "inauspicious_weekday": {
        "title": "Weekday Not Ideal",
        "remedy": "Worship weekday lord in the morning; donate items ruled by that planet; choose Abhijit muhurta within the day.",
    },
    "inauspicious_lagna": {
        "title": "Lagna Not Favorable",
        "remedy": "Strengthen lagna lord with gemstone (after consultation), mantra of lagna lord, and lagna shuddhi puja; choose a different lagna by delaying 2 hours.",
    },
    "inauspicious_choghadiya": {
        "title": "Inauspicious Choghadiya",
        "remedy": "Wait for next Amrit/Shubh/Labh Choghadiya; perform Ganapati aradhana; light ghee lamp facing East.",
    },
    "inauspicious_hora": {
        "title": "Inauspicious Hora",
        "remedy": "Shift to hora of benefic planet (Jupiter, Venus, Mercury, Moon); worship hora lord; avoid Saturn/Mars hora for auspicious works.",
    },
    "panchaka": {
        "title": "Panchaka",
        "remedy": "Perform Panchaka Shanti; worship Dhanvantari and Bhairava; donate five items; avoid travel and construction during Panchaka unless remedied.",
    },
    "amavasya": {
        "title": "Amavasya",
        "remedy": "Pitru tarpana in the morning; worship Lord Shiva; donate food to ancestors' representatives; generally postpone auspicious events.",
    },
    "purnima": {
        "title": "Purnima",
        "remedy": "Satyanarayana puja; donate kheer and white items; fasting till evening if tradition requires; some events avoid full moon.",
    },
    "tarabalam_bad": {
        "title": "Unfavorable Tarabalam",
        "remedy": "Nakshatra Shanti homa; worship Tara devata; charity on day ruled by nakshatra lord; choose nakshatra with Sampat/Kshema/Mitra tara.",
    },
    "chandrabala_weak": {
        "title": "Weak Chandrabala",
        "remedy": "Worship Moon on Monday; wear pearl only if chart permits; donate milk and white rice; chant Chandra mantra.",
    },
    "malefic_lagna_lord": {
        "title": "Afflicted Lagna Lord",
        "remedy": "Strengthen lagna lord via mantra, yantra, and charity aligned to the planet; perform Navagraha Shanti.",
    },
    "sunset_transition": {
        "title": "Sandhya / Twilight",
        "remedy": "Wait 30 minutes after sunrise or complete Sandhya vandana before evening events; avoid sandhya periods.",
    },
    "vishti_karana": {
        "title": "Vishti (Bhadra) Karana",
        "remedy": "Worship Lord Vishnu; Bhadra ends at karana change — wait for next karana; donate yellow items.",
    },
    "inauspicious_yoga": {
        "title": "Inauspicious Yoga",
        "remedy": "Worship yoga's presiding deity; perform Shanti homa; postpone to Siddha, Shiva, or Brahma yoga if possible.",
    },
}

INAUSPICIOUS_YOGAS = {5, 8, 9, 13, 16, 17, 26}  # Atiganda, Shula, Ganda, Vyaghata, Vaidhriti, etc.

# --- NEW CONSTANTS from Classical Muhurta (Ernst Wilhelm) ---

# Tithi group classification
TITHI_GROUPS = {
    "Nanda": [1, 6, 11],    # Venus - happiness, auspicious beginnings
    "Bhadra": [2, 7, 12],   # Mercury - wealth, learning
    "Jaya": [3, 8, 13],     # Mars - triumph, competition
    "Rikta": [4, 9, 14],    # Saturn - empty, avoid for good works
    "Purna": [5, 10, 15],   # Jupiter - full, completions
}
TITHI_GROUP_LORD = {"Nanda": "Venus", "Bhadra": "Mercury", "Jaya": "Mars", "Rikta": "Saturn", "Purna": "Jupiter"}

# Siddha Yoga: vara + tithi combinations (vara 0=Sun..6=Sat, tithi 1-15 in shukla)
SIDDHA_YOGA = {
    0: [1, 6, 11],   # Sunday + Nanda tithis
    1: [2, 7, 12],   # Monday + Bhadra tithis
    2: [3, 8, 13],   # Tuesday + Jaya tithis
    3: [2, 7, 12],   # Wednesday + Bhadra tithis
    4: [5, 10, 15],  # Thursday + Purna tithis
    5: [1, 6, 11],   # Friday + Nanda tithis
    6: [3, 8, 13],   # Saturday + Jaya tithis
}

# Amrita Yoga: vara + nakshatra combinations (vara 0=Sun..6=Sat, nakshatra 0-26)
AMRITA_YOGA = {
    0: [6],    # Sunday + Pushya
    1: [9],    # Monday + Ashlesha (Hasta in some texts)
    2: [2],    # Tuesday + Ashwini (Bharani)
    3: [17],   # Wednesday + Anuradha
    4: [7],    # Thursday + Pushya
    5: [20],   # Friday + Revati (Purva Bhadrapada)
    6: [10],   # Saturday + Rohini (Swati)
}

# Dagdha Yoga (burnt - inauspicious): vara + tithi combinations
DAGDHA_YOGA = {
    0: [12],   # Sunday + Dwadashi
    1: [11],   # Monday + Ekadashi
    2: [5],    # Tuesday + Panchami
    3: [3],    # Wednesday + Tritiya
    4: [6],    # Thursday + Shashthi
    5: [8],    # Friday + Ashtami
    6: [9],    # Saturday + Navami
}

# Nakshatra activity classification (0-indexed nakshatra numbers)
NAKSHATRA_CLASS = {
    "Dhruva": [10, 11, 21, 25],      # Fixed: Magha, P.Phalguni, U.Ashadha, P.Bhadrapada - temples, foundations
    "Chara": [6, 12, 14, 20, 22],    # Moveable: Punarvasu, Hasta, Swati, P.Ashadha, Shravana - travel, change
    "Kshipra": [0, 4, 7, 13],        # Quick/Swift: Ashwini, Mrigashira, Pushya, Chitra - trade, quick results
    "Mridu": [3, 8, 15, 26],         # Soft/Tender: Rohini, Ashlesha, Anuradha, Revati - marriage, arts
    "Tikshna": [2, 5, 9, 17, 18],    # Sharp/Dreadful: Bharani, Ardra, Magha, Jyeshtha, Moola - surgery, destruction
    "Ugra": [1, 16, 23, 24],         # Fierce: Krittika, Vishakha, Dhanishtha, Shatabhisha - competition
    "Mishra": [19],                    # Mixed: Mula (some texts classify differently)
}

# Activity to preferred nakshatra class mapping
ACTIVITY_NAKSHATRA_PREFERENCE = {
    "marriage": ["Mridu", "Dhruva", "Kshipra"],
    "travel": ["Chara", "Kshipra"],
    "business": ["Kshipra", "Chara"],
    "construction": ["Dhruva"],
    "surgery": ["Tikshna"],
    "education": ["Dhruva", "Kshipra", "Mridu"],
    "competition": ["Ugra", "Tikshna"],
}

# Panchanga Shuddhi - all 5 elements must be favorable
# Each element's lord should not be the 6th/8th/12th lord from the activity lagna
PANCHANGA_ELEMENTS = ["tithi", "vara", "nakshatra", "yoga", "karana"]

# Lagna classification
LAGNA_SIRODAYA = [2, 4, 6, 8, 10]  # Gemini, Leo, Libra, Sagittarius, Aquarius (0-indexed) - rising head first, good
LAGNA_PRISTODAYA = [0, 1, 3, 5, 7, 9]  # Rising tail first - less favorable for most activities
LAGNA_UBHAYODAYA = [11]  # Pisces - both

# Unfavorable tithis for general auspicious work
RIKTA_TITHIS = [4, 9, 14]  # 4th, 9th, 14th - empty/void
PARVA_TITHIS = [15, 30]  # Full moon, New moon (use with caution)


def is_siddha_yoga(vara_index, tithi_number):
    """Check if vara + tithi form Siddha Yoga. tithi_number is 1-15 (shukla) or 1-15 (krishna)."""
    tithi_in_paksha = ((tithi_number - 1) % 15) + 1
    return tithi_in_paksha in SIDDHA_YOGA.get(vara_index, [])


def is_amrita_yoga(vara_index, nakshatra_index):
    """Check if vara + nakshatra form Amrita Yoga."""
    return nakshatra_index in AMRITA_YOGA.get(vara_index, [])


def is_dagdha_yoga(vara_index, tithi_number):
    """Check if vara + tithi form Dagdha (burnt) Yoga."""
    tithi_in_paksha = ((tithi_number - 1) % 15) + 1
    return tithi_in_paksha in DAGDHA_YOGA.get(vara_index, [])


def nakshatra_class_for(nakshatra_index):
    """Return the classification of a nakshatra."""
    for cls, indices in NAKSHATRA_CLASS.items():
        if nakshatra_index in indices:
            return cls
    return "Sadharana"  # ordinary/unclassified


def nakshatra_suits_activity(nakshatra_index, activity):
    """Check if a nakshatra is suitable for the given activity type."""
    cls = nakshatra_class_for(nakshatra_index)
    preferred = ACTIVITY_NAKSHATRA_PREFERENCE.get(activity, [])
    return cls in preferred


def _jd_from_local(y, mo, d, hh, mm, ss, tz):
    (_, jd_ut) = swe.utc_to_jd(y, mo, d, hh, mm, ss, 1)
    return jd_ut - (tz / 24.0)


def _parse_iso(s):
    if s.endswith("Z"):
        s = s[:-1]
    return datetime.datetime.fromisoformat(s)


def _sunrise_sunset(jd_ut, lat, lon, tz):
    geopos = (lon, lat, 0.0)
    ephe = swe.FLG_SWIEPH if calc._HAS_SWIEPH_DATA else swe.FLG_MOSEPH
    rsmi_rise = swe.CALC_RISE | swe.BIT_DISC_CENTER | swe.BIT_NO_REFRACTION
    rsmi_set = swe.CALC_SET | swe.BIT_DISC_CENTER | swe.BIT_NO_REFRACTION
    _, tret = swe.rise_trans(jd_ut - 1.0, swe.SUN, rsmi_rise, geopos, 0, 0, ephe)
    sr = tret[0]
    _, tret = swe.rise_trans(sr, swe.SUN, rsmi_set, geopos, 0, 0, ephe)
    ss = tret[0]
    _, tret = swe.rise_trans(ss, swe.SUN, rsmi_rise, geopos, 0, 0, ephe)
    sr_next = tret[0]
    sr_local = calc._jd_to_local_dt(sr, tz)
    weekday_sun0 = (sr_local.weekday() + 1) % 7
    return sr, ss, sr_next, weekday_sun0


def _part_window(sr, ss, weekday, part_idx_1based):
    total = ss - sr
    part = total / 8.0
    start = sr + (part_idx_1based - 1) * part
    end = sr + part_idx_1based * part
    return start, end, part


def _tithi_info(sun_lon, moon_lon):
    elong = (moon_lon - sun_lon) % 360.0
    tithi_num = int(elong // 12) + 1
    paksha = "Shukla" if tithi_num <= 15 else "Krishna"
    tithi_in_paksha = tithi_num if tithi_num <= 15 else tithi_num - 15
    name_idx = min(tithi_in_paksha - 1, 14)
    name = TITHI_NAMES[name_idx]
    if tithi_num == 15:
        name = "Purnima"
    elif tithi_num == 30:
        name = "Amavasya"
    return {
        "tithi": tithi_num,
        "tithi_name": name,
        "paksha": paksha,
        "tithi_in_paksha": tithi_in_paksha,
        "elongation_deg": round(elong, 4),
    }


def _yoga_info(sun_lon, moon_lon):
    val = (sun_lon + moon_lon) % 360.0
    idx = int(val // (360.0 / 27.0)) % 27
    return {"yoga_index": idx, "yoga": YOGA_NAMES[idx]}


def _karana_info(sun_lon, moon_lon):
    elong = (moon_lon - sun_lon) % 360.0
    k = int(elong // 6) % 60
    if k < 57:
        name = KARANA_NAMES[k % 7]
    else:
        name = KARANA_NAMES[7 + (k - 57)]
    return {"karana_index": k, "karana": name, "is_vishti": name == "Vishti"}


def _choghadiya_at(jd, sr, ss, sr_next, weekday):
    if sr <= jd < ss:
        seq = DAY_CHOGHADIYA[weekday]
        total = ss - sr
        part = total / 8.0
        idx = min(int((jd - sr) / part), 7)
        period = "day"
    else:
        seq = NIGHT_CHOGHADIYA[weekday]
        start = ss if jd >= ss else sr - (sr_next - ss)
        end = sr_next if jd >= ss else sr
        total = end - start
        part = total / 8.0
        idx = min(int((jd - start) / part), 7)
        period = "night"
    return {"choghadiya": seq[idx], "choghadiya_index": idx + 1, "period": period}


def _hora_at(jd, sr, weekday):
    hours_from_sr = (jd - sr) * 24.0
    h_idx = int(hours_from_sr) % 24
    chaldean = ["Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars"]
    start_c = chaldean.index(WEEKDAY_LORD[weekday])
    hora_lord = chaldean[(start_c + h_idx) % 7]
    return {"hora": hora_lord, "hora_number": h_idx + 1}


def _tarabalam(janma_nak_idx, moon_nak_idx):
    if janma_nak_idx is None:
        return None
    diff = (moon_nak_idx - janma_nak_idx) % 27
    tara_num = (diff % 9) + 1
    tara = TARA_NAMES[tara_num - 1]
    good = tara in ("Sampat", "Kshema", "Sadhaka", "Mitra", "Ati-Mitra")
    return {"tara_number": tara_num, "tara": tara, "favorable": good}


def _chandrabala(moon_sign_idx, lagna_sign_idx):
  # Moon in kendra/trikona from lagna = good
    diff = (moon_sign_idx - lagna_sign_idx) % 12
    good = diff in (0, 3, 4, 6, 8, 9)
    return {"favorable": good, "moon_lagna_relation": diff}


def _panchaka(moon_nak_idx):
    # Last five nakshatras Dhanishta(21), Shatabhisha(23), Purva Bhadra(24), Uttara Bhadra(25), Revati(26)
    # Classical panchaka: last 5 naks from user's perspective varies; use Revati group
    in_panchaka = moon_nak_idx in (21, 22, 23, 24, 25, 26) and moon_nak_idx >= 21
    # Simplified: Dhanishta through Revati when Moon in last quarter of zodiac naks
    return {"active": moon_nak_idx >= 21, "nakshatra_index": moon_nak_idx}


def compute_panchanga_moment(jd_ut, lat, lon, tz, calc_flag, janma_nak_idx=None):
    sr, ss, sr_next, weekday = _sunrise_sunset(jd_ut, lat, lon, tz)
    is_day = sr <= jd_ut < ss

    sun_pos, _ = swe.calc_ut(jd_ut, swe.SUN, calc_flag)
    moon_pos, _ = swe.calc_ut(jd_ut, swe.MOON, calc_flag)
    sun_lon = sun_pos[0]
    moon_lon = moon_pos[0]

    tithi = _tithi_info(sun_lon, moon_lon)
    yoga = _yoga_info(sun_lon, moon_lon)
    karana = _karana_info(sun_lon, moon_lon)
    moon_nak = calc.nakshatra_info(moon_lon)
    chogh = _choghadiya_at(jd_ut, sr, ss, sr_next, weekday)
    hora = _hora_at(jd_ut, sr, weekday)

    _, ascmc = swe.houses_ex(jd_ut, lat, lon, b'P', calc_flag)
    asc_lon = ascmc[0]
    lagna = calc.body_row("Ascendant", asc_lon)

    # Kaal windows
    rahu_start, rahu_end, _ = _part_window(sr, ss, weekday, RAHU_PART[weekday])
    yama_start, yama_end, _ = _part_window(sr, ss, weekday, YAMA_PART[weekday])
    gulika_start, gulika_end, _ = _part_window(sr, ss, weekday, GULIKA_PART[weekday])

    in_rahu = rahu_start <= jd_ut < rahu_end
    in_yama = yama_start <= jd_ut < yama_end
    in_gulika = gulika_start <= jd_ut < gulika_end

    # Abhijit: 24 min before and after local apparent noon (midpoint sunrise-sunset)
    midday = (sr + ss) / 2.0
    abhijit_half = (ss - sr) / 30.0  # ~1/15 of day length each side
    in_abhijit = (midday - abhijit_half) <= jd_ut <= (midday + abhijit_half)

    panchaka = _panchaka(moon_nak["nakshatra_index"])
    tarabalam = _tarabalam(janma_nak_idx, moon_nak["nakshatra_index"])
    moon_si = int(moon_lon // 30)
    chandrabala = _chandrabala(moon_si, lagna["sign_index"])

    return {
        "jd_ut": jd_ut,
        "local_time": calc._jd_to_local_dt(jd_ut, tz).isoformat(),
        "is_daylight": is_day,
        "astro_weekday": calc.WEEKDAY_NAMES[weekday],
        "weekday_index": weekday,
        "sunrise_local": calc._jd_to_local_dt(sr, tz).isoformat(),
        "sunset_local": calc._jd_to_local_dt(ss, tz).isoformat(),
        "tithi": tithi,
        "yoga": yoga,
        "karana": karana,
        "nakshatra": moon_nak,
        "lagna": lagna,
        "choghadiya": chogh,
        "hora": hora,
        "in_rahu_kaal": in_rahu,
        "in_yamaganda": in_yama,
        "in_gulika_kaal": in_gulika,
        "in_abhijit": in_abhijit,
        "panchaka": panchaka,
        "tarabalam": tarabalam,
        "chandrabala": chandrabala,
        "sun_longitude": round(sun_lon, 4),
        "moon_longitude": round(moon_lon, 4),
    }


def _score_moment(panch, event, janma_nak_idx=None):
    score = 100
    doshas = []
    remedies = []
    strengths = []

    t = panch["tithi"]["tithi"]
    nak = panch["nakshatra"]["nakshatra_index"]
    wd = panch["weekday_index"]
    lagna_si = panch["lagna"]["sign_index"]
    chog = panch["choghadiya"]["choghadiya"]
    hora = panch["hora"]["hora"]
    yoga_idx = panch["yoga"]["yoga_index"]

    # Tithi
    if t in event.get("avoid_tithis", []):
        score -= 25
        doshas.append("inauspicious_tithi")
        if t == 30 and not event.get("allow_amavasya"):
            doshas.append("amavasya")
        if t == 15 and not event.get("allow_purnima"):
            doshas.append("purnima")
    elif t in event.get("favorable_tithis", []):
        score += 8
        strengths.append(f"Favorable tithi ({panch['tithi']['tithi_name']}, {panch['tithi']['paksha']} paksha)")

    # Nakshatra
    if nak in event.get("avoid_nakshatras", []):
        score -= 22
        doshas.append("inauspicious_nakshatra")
    elif nak in event.get("favorable_nakshatras", []):
        score += 10
        strengths.append(f"Favorable nakshatra ({panch['nakshatra']['nakshatra']})")

    # Weekday
    if wd not in event.get("favorable_weekdays", list(range(7))):
        score -= 10
        doshas.append("inauspicious_weekday")
    else:
        score += 4
        strengths.append(f"Favorable weekday ({panch['astro_weekday']})")

    # Lagna
    if lagna_si in event.get("avoid_lagnas", []):
        score -= 15
        doshas.append("inauspicious_lagna")
    elif lagna_si in event.get("favorable_lagnas", []):
        score += 8
        strengths.append(f"Favorable lagna ({panch['lagna']['sign']})")

    # Choghadiya
    if chog in event.get("avoid_choghadiya", []):
        score -= 12
        doshas.append("inauspicious_choghadiya")
    elif chog in event.get("favorable_choghadiya", []):
        score += 6
        strengths.append(f"Favorable Choghadiya ({chog})")

    # Hora
    benefic_hora = {"Jupiter", "Venus", "Mercury", "Moon"}
    malefic_hora = {"Saturn", "Mars", "Sun"}
    if hora in malefic_hora:
        score -= 8
        doshas.append("inauspicious_hora")
    elif hora in benefic_hora:
        score += 5
        strengths.append(f"Benefic hora ({hora})")

    # Kaal doshas
    if panch["in_rahu_kaal"]:
        score -= 30
        doshas.append("rahu_kaal")
    if panch["in_yamaganda"]:
        score -= 18
        doshas.append("yamaganda")
    if panch["in_gulika_kaal"]:
        score -= 15
        doshas.append("gulika_kaal")

    if panch["in_abhijit"]:
        score += 12
        strengths.append("Abhijit Muhurta (highly auspicious midday window)")

  # Panchaka
    if panch["panchaka"]["active"]:
        score -= 12
        doshas.append("panchaka")

    # Yoga
    if yoga_idx in INAUSPICIOUS_YOGAS:
        score -= 10
        doshas.append("inauspicious_yoga")

    # Karana Vishti (Bhadra)
    if panch["karana"].get("is_vishti"):
        score -= 20
        doshas.append("vishti_karana")

    # Tarabalam
    if panch["tarabalam"] and not panch["tarabalam"]["favorable"]:
        score -= 12
        doshas.append("tarabalam_bad")
    elif panch["tarabalam"] and panch["tarabalam"]["favorable"]:
        strengths.append(f"Good Tarabalam ({panch['tarabalam']['tara']})")

    # Chandrabala
    if not panch["chandrabala"]["favorable"]:
        score -= 8
        doshas.append("chandrabala_weak")
    else:
        strengths.append("Favorable Chandrabala")

    # Daylight requirement
    if event.get("require_daylight") and not panch["is_daylight"]:
        score -= 15
        doshas.append("sunset_transition")

    # --- Classical Muhurta (Ernst Wilhelm) scoring ---
    # Siddha Yoga bonus
    if is_siddha_yoga(wd, t):
        score += 8
        strengths.append("Siddha Yoga (vara-tithi harmony)")

    # Amrita Yoga bonus
    if is_amrita_yoga(wd, nak):
        score += 10
        strengths.append("Amrita Yoga (vara-nakshatra nectar combination)")

    # Dagdha Yoga penalty
    if is_dagdha_yoga(wd, t):
        score -= 15
        doshas.append("dagdha_yoga")

    # Nakshatra class matches activity preference
    activity_type = event.get("activity_type")
    if activity_type and nakshatra_suits_activity(nak, activity_type):
        score += 6
        strengths.append(f"Nakshatra class ({nakshatra_class_for(nak)}) suits {activity_type}")

    # Rikta tithi penalty
    tithi_in_paksha = ((t - 1) % 15) + 1
    if tithi_in_paksha in RIKTA_TITHIS:
        score -= 8
        doshas.append("rikta_tithi")

    # Lagna Sirodaya bonus
    if lagna_si in LAGNA_SIRODAYA:
        score += 4
        strengths.append(f"Sirodaya lagna ({panch['lagna']['sign']})")

    # Build remedy list (unique)
    seen = set()
    for d in doshas:
        if d in REMEDIES and d not in seen:
            seen.add(d)
            remedies.append({
                "dosha": REMEDIES[d]["title"],
                "key": d,
                "remedy": REMEDIES[d]["remedy"],
            })

    score = max(0, min(100, score))
    grade = "Excellent" if score >= 85 else "Good" if score >= 70 else "Suitable" if score >= 55 else "Marginal" if score >= 40 else "Avoid"

    return {
        "score": score,
        "grade": grade,
        "doshas": doshas,
        "dosha_details": remedies,
        "strengths": strengths,
        "suitable": score >= 55 and "rahu_kaal" not in doshas,
    }


def search_muhurtas(payload):
    event_id = payload.get("event_id")
    if event_id not in EVENT_BY_ID:
        raise ValueError(f"Unknown event: {event_id}")
    event = EVENT_BY_ID[event_id]

    ay = payload.get("ayanamsa", "lahiri").lower()
    if ay not in calc.AYANAMSA_MAP:
        raise ValueError(f"Unknown ayanamsa: {ay}")
    swe.set_sid_mode(calc.AYANAMSA_MAP[ay], 0, 0)

    lat = float(payload["latitude"])
    lon = float(payload["longitude"])
    tz = float(payload["tz_offset"])
    janma_nak = payload.get("native_nakshatra_index")
    if janma_nak is not None:
        janma_nak = int(janma_nak)

    start_dt = _parse_iso(payload["start"])
    end_dt = _parse_iso(payload["end"])
    if end_dt <= start_dt:
        raise ValueError("End must be after start")

    step_min = int(payload.get("step_minutes", 15))
    step_min = max(5, min(step_min, 60))
    min_score = int(payload.get("min_score", 55))
    max_results = int(payload.get("max_results", 40))
    max_results = max(5, min(max_results, 100))

    calc_flag = swe.FLG_SIDEREAL | swe.FLG_TRUEPOS
    if calc._HAS_SWIEPH_DATA:
        calc_flag |= swe.FLG_SWIEPH
    else:
        calc_flag |= swe.FLG_MOSEPH

    results = []
    cur = start_dt
    delta = datetime.timedelta(minutes=step_min)
    max_slots = 5000
    slots = 0

    while cur <= end_dt and slots < max_slots:
        jd = _jd_from_local(cur.year, cur.month, cur.day, cur.hour, cur.minute, cur.second, tz)
        panch = compute_panchanga_moment(jd, lat, lon, tz, calc_flag, janma_nak)
        scored = _score_moment(panch, event, janma_nak)
        if scored["score"] >= min_score:
            results.append({
                "local_time": panch["local_time"],
                "score": scored["score"],
                "grade": scored["grade"],
                "suitable": scored["suitable"],
                "doshas": scored["doshas"],
                "dosha_details": scored["dosha_details"],
                "strengths": scored["strengths"],
                "panchanga": {
                    "tithi": panch["tithi"],
                    "nakshatra": panch["nakshatra"]["nakshatra"],
                    "nakshatra_lord": panch["nakshatra"]["nakshatra_lord"],
                    "yoga": panch["yoga"]["yoga"],
                    "karana": panch["karana"]["karana"],
                    "weekday": panch["astro_weekday"],
                    "lagna": panch["lagna"]["sign"],
                    "lagna_lord": calc.SIGN_LORDS[panch["lagna"]["sign_index"]],
                    "choghadiya": panch["choghadiya"]["choghadiya"],
                    "hora": panch["hora"]["hora"],
                    "in_abhijit": panch["in_abhijit"],
                    "sunrise": panch["sunrise_local"],
                    "sunset": panch["sunset_local"],
                },
            })
        cur += delta
        slots += 1

    results.sort(key=lambda x: (-x["score"], x["local_time"]))
    results = results[:max_results]

    categories = {}
    for e in EVENT_CATALOG:
        categories.setdefault(e["category"], 0)
        categories[e["category"]] += 1

    return {
        "event": {"id": event["id"], "name": event["name"], "category": event["category"], "notes": event.get("notes", "")},
        "search": {
            "start": start_dt.isoformat(),
            "end": end_dt.isoformat(),
            "place": payload.get("place", ""),
            "latitude": lat,
            "longitude": lon,
            "tz_offset": tz,
            "step_minutes": step_min,
            "slots_scanned": slots,
        },
        "summary": {
            "total_found": len(results),
            "excellent": sum(1 for r in results if r["score"] >= 85),
            "good": sum(1 for r in results if 70 <= r["score"] < 85),
            "suitable": sum(1 for r in results if 55 <= r["score"] < 70),
        },
        "muhurtas": results,
        "catalog_size": len(EVENT_CATALOG),
    }


def list_events():
    by_cat = {}
    for e in EVENT_CATALOG:
        by_cat.setdefault(e["category"], []).append({
            "id": e["id"],
            "name": e["name"],
            "notes": e.get("notes", ""),
        })
    return {
        "total": len(EVENT_CATALOG),
        "categories": [
            {"name": cat, "count": len(items), "events": items}
            for cat, items in by_cat.items()
        ],
    }
