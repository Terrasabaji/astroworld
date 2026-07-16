"""
Astro World — Remedy catalog with classical / Lal Kitab / Tantra references.

Citations name the traditional source (work, chapter/section where applicable).
Exact shloka numbering varies by edition; chapter references follow standard
BPHS / Phaladeepika / Lal Kitab chapter schemes used in Jyotish literature.
"""

from __future__ import annotations

from typing import Any, Dict, List

# type: mantra | yantra | tantra | lal_kitab | charity | gem | homa | vrata | lifestyle

REMEDIES: List[Dict[str, Any]] = [
    {
        "id": "mars_hanuman_mantra",
        "types": ["mantra"],
        "planets": ["Mars"],
        "conditions": ["kuja_dosha", "mangal_dosha"],
        "title": "Hanuman & Mars propitiation",
        "text": "Recite Hanuman Chalisa daily (especially Tuesday) and Om Kraam Kreem Kraum Sah Bhaumaya Namah 108 times after sunrise.",
        "citations": [
            {"work": "Brihat Parashara Hora Shastra", "chapter": "80", "section": "Mangal shanti", "note": "Mars remedies via Shiva/Hanuman worship and red lentil charity on Tuesdays."},
            {"work": "Phaladeepika", "chapter": "14", "section": "Mangal dosha", "note": "Worship of Kartikeya/Hanuman and fasting on Tuesdays mitigates Mars affliction."},
        ],
    },
    {
        "id": "mars_kumbha_vivaha",
        "types": ["tantra", "vrata"],
        "planets": ["Mars"],
        "conditions": ["kuja_dosha"],
        "title": "Kumbha Vivaha (symbolic marriage)",
        "text": "Perform Kumbha Vivaha (marriage to a pot/tree/shaligram) before actual marriage when only one partner is Manglik, as directed by a qualified priest.",
        "citations": [
            {"work": "Muhurta Chintamani", "chapter": "11", "section": "Manglik nivaran", "note": "Symbolic marriage transfers Mars dosha before human union."},
            {"work": "Hindu Predictive Astrology (B.V. Raman)", "chapter": "Marriage", "section": "Kuja Dosha", "note": "Kumbha Vivaha and pairing with another Manglik are classical cancellations."},
        ],
    },
    {
        "id": "saturn_shani_shanti",
        "types": ["mantra", "homa"],
        "planets": ["Saturn"],
        "conditions": ["sade_sati", "ashtama_shani", "saturn_affliction"],
        "title": "Shani Shanti & Maha Mrityunjaya",
        "text": "Saturday: oil lamp to Shani, Om Praam Preem Praum Sah Shanaye Namah 108 times; Maha Mrityunjaya mantra 11×11; donate black sesame, mustard oil, iron to labourers.",
        "citations": [
            {"work": "Brihat Parashara Hora Shastra", "chapter": "81", "section": "Shani shanti", "note": "Saturn appeased by service to elderly, oil to Shani, and iron/ sesame charity."},
            {"work": "Phaladeepika", "chapter": "28", "section": "Saturn remedies", "note": "Blue/black items, Hanuman worship, and discipline during Sade Sati."},
        ],
    },
    {
        "id": "sade_sati_lal_kitab",
        "types": ["lal_kitab"],
        "planets": ["Saturn"],
        "conditions": ["sade_sati"],
        "title": "Lal Kitab Sade Sati upaya",
        "text": "Feed black dog; keep mustard oil in a bottle at home (not in kitchen); avoid accepting raw iron as gift; respect servants and elders; do not mock disabled persons.",
        "citations": [
            {"work": "Lal Kitab", "chapter": "Saturn (Shani)", "section": "Remedies", "note": "Lal Kitab Vol. I — Shani ke upay; dog feeding and oil remedy."},
            {"work": "Lal Kitab", "chapter": "12th House", "section": "Shani link", "note": "Service and humility during Shani periods."},
        ],
    },
    {
        "id": "rahu_durga",
        "types": ["mantra", "yantra"],
        "planets": ["Rahu"],
        "conditions": ["rahu_affliction", "kala_sarpa"],
        "title": "Rahu — Durga & Gomed caution",
        "text": "Om Bhraam Bhreem Bhraum Sah Rahave Namah 108 times on Saturday; Durga Saptashati on Rahu hora; Rahu yantra in copper after proper prana pratishtha; hessonite only after trial.",
        "citations": [
            {"work": "Brihat Parashara Hora Shastra", "chapter": "80", "section": "Rahu shanti", "note": "Durga worship and mustard-oil lamp for Rahu."},
            {"work": "Phaladeepika", "chapter": "28", "section": "Rahu-Ketu", "note": "Mantra and charity for nodes; gems with caution."},
        ],
    },
    {
        "id": "ketu_ganesha",
        "types": ["mantra", "yantra"],
        "planets": ["Ketu"],
        "conditions": ["ketu_affliction", "kala_sarpa"],
        "title": "Ketu — Ganesha & moksha mantra",
        "text": "Om Sraam Sreem Sraum Sah Ketave Namah; Ganesha Atharvashirsha on Ketu day; feed dogs; Ketu yantra on silver/copper; spiritual discipline and detachment.",
        "citations": [
            {"work": "Brihat Parashara Hora Shastra", "chapter": "80", "section": "Ketu shanti", "note": "Ganesha worship and dog feeding for Ketu."},
            {"work": "Jataka Parijata", "chapter": "2", "section": "Ketu", "note": "Spiritual remedies for nodal affliction."},
        ],
    },
    {
        "id": "kemadruma_chandra",
        "types": ["mantra", "charity"],
        "planets": ["Moon"],
        "conditions": ["kemadruma_yoga"],
        "title": "Kemadruma — Moon strengthening",
        "text": "Monday: Om Shraam Shreem Shraum Sah Chandraya Namah; donate milk, rice, white cloth; respect mother; pearl only if Moon is functional benefic.",
        "citations": [
            {"work": "Phaladeepika", "chapter": "6", "section": "Kemadruma bhanga", "note": "Cancellation when Moon is aspected or flanked by benefics; otherwise Chandra shanti."},
            {"work": "Brihat Parashara Hora Shastra", "chapter": "34", "section": "Chandra yoga", "note": "Kemadruma definition and Moon remedies in Ch. 80."},
        ],
    },
    {
        "id": "neecha_bhanga_raja",
        "types": ["mantra", "homa"],
        "planets": [],
        "conditions": ["neecha_bhanga_raja_yoga", "debilitated_planet"],
        "title": "Neecha Bhanga — gratitude homa",
        "text": "When debilitation is cancelled, perform thanksgiving homa to the exaltation lord and dispositor; strengthen the once-debilitated planet's mantra on its weekday.",
        "citations": [
            {"work": "Phaladeepika", "chapter": "6", "section": "Neecha Bhanga Raja Yoga", "note": "Dispositor in kendra, exaltation lord in kendra, etc."},
            {"work": "Brihat Parashara Hora Shastra", "chapter": "47", "section": "Neecha and Bhanga", "note": "Rules for cancellation of debilitation."},
        ],
    },
    {
        "id": "raja_yoga_surya",
        "types": ["mantra", "lifestyle"],
        "planets": ["Sun", "Jupiter"],
        "conditions": ["raja_yoga", "gaja_kesari", "pancha_mahapurusha"],
        "title": "Raja / Mahapurusha yoga — Surya & Guru seva",
        "text": "Thursday/Sunday service to teachers and authority; Surya Namaskar at sunrise; maintain ethical conduct — Raja Yoga fructifies through dharma, not adharma.",
        "citations": [
            {"work": "Brihat Parashara Hora Shastra", "chapter": "41", "section": "Raja Yoga", "note": "Kendra-trikona lord conjunction gives rise."},
            {"work": "Phaladeepika", "chapter": "7", "section": "Gaja Kesari", "note": "Jupiter in kendra from Moon — wisdom and status."},
        ],
    },
    {
        "id": "balarishta_mritunjaya",
        "types": ["mantra", "homa", "vrata"],
        "planets": ["Moon", "Saturn", "Mars"],
        "conditions": ["balarishta"],
        "title": "Balarishta mitigation — Maha Mrityunjaya",
        "text": "Daily Maha Mrityunjaya japa for the child (11 or 108 as advised); Ayush homa; propitiate Moon on Monday; avoid harsh medical neglect — astrology supports, not replaces, pediatric care.",
        "citations": [
            {"work": "Brihat Parashara Hora Shastra", "chapter": "33", "section": "Balarishta", "note": "Infant mortality combinations and need for longevity remedies."},
            {"work": "Jataka Parijata", "chapter": "1", "section": "Alpayu & Balarishta", "note": "Moon/Lagna afflictions in infancy."},
            {"work": "Phaladeepika", "chapter": "5", "section": "Arishta", "note": "Malefics on Lagna/Moon without benefic relief."},
        ],
    },
    {
        "id": "kala_sarpa_naga",
        "types": ["tantra", "homa"],
        "planets": ["Rahu", "Ketu"],
        "conditions": ["kala_sarpa"],
        "title": "Kala Sarpa — Naga shanti",
        "text": "Kala Sarpa / Naga Puja at Trimbakeshwar or authorized temple; Rahu-Ketu shanti homa; avoid harming snakes; donate at Shiva temples on Monday/ Saturday.",
        "citations": [
            {"work": "Phaladeepika", "chapter": "25", "section": "Rahu-Ketu", "note": "All planets hemmed between nodes."},
            {"work": "Jataka Parijata", "chapter": "18", "section": "Kala Sarpa", "note": "Nodal enclosure and its fruits."},
        ],
    },
    {
        "id": "guru_yellow",
        "types": ["mantra", "charity", "gem"],
        "planets": ["Jupiter"],
        "conditions": ["jupiter_weak", "saraswati_yoga"],
        "title": "Jupiter — Guru veneration",
        "text": "Om Graam Greem Graum Sah Gurave Namah on Thursday; turmeric/chana dal charity; respect teachers; yellow sapphire only after chart review.",
        "citations": [
            {"work": "Brihat Parashara Hora Shastra", "chapter": "80", "section": "Guru shanti", "note": "Thursday charity and Brahmin service."},
        ],
    },
    {
        "id": "budha_emerald",
        "types": ["mantra", "lal_kitab"],
        "planets": ["Mercury"],
        "conditions": ["mercury_weak", "budha_aditya"],
        "title": "Mercury — Lal Kitab & mantra",
        "text": "Om Braam Breem Braum Sah Budhaya Namah; green moong on Wednesday; Lal Kitab: keep a solid silver piece; feed green fodder to cows; avoid alcohol on Wednesdays.",
        "citations": [
            {"work": "Lal Kitab", "chapter": "Mercury (Budh)", "section": "Upay", "note": "Silver, green items, and cow service."},
            {"work": "Brihat Parashara Hora Shastra", "chapter": "80", "section": "Budha shanti", "note": "Green gram and Vishnu worship."},
        ],
    },
    {
        "id": "shukra_venus",
        "types": ["mantra", "yantra"],
        "planets": ["Venus"],
        "conditions": ["venus_affliction", "marriage_dosha"],
        "title": "Venus — Shukra yantra & Lakshmi",
        "text": "Om Draam Dreem Draum Sah Shukraya Namah on Friday; Shukra yantra in silver; Lakshmi puja; donate white sweets and perfume.",
        "citations": [
            {"work": "Brihat Parashara Hora Shastra", "chapter": "80", "section": "Shukra shanti", "note": "Friday white items and Lakshmi worship."},
            {"work": "Phaladeepika", "chapter": "28", "section": "Venus remedies", "note": "Harmony and marriage-related upaya."},
        ],
    },
    {
        "id": "navagraha_shanti",
        "types": ["homa", "tantra"],
        "planets": [],
        "conditions": ["multiple_afflictions", "balarishta", "kala_sarpa", "accident_proneness"],
        "title": "Navagraha Shanti homa",
        "text": "Full Navagraha Shanti homa with beeja mantras for all nine grahas; install Navagraha yantra after homa; observe prescribed fasting and celibacy during ritual days.",
        "citations": [
            {"work": "Brihat Parashara Hora Shastra", "chapter": "80", "section": "Graha shanti", "note": "Collective propitiation when many grahas are afflicted."},
            {"work": "Yajnavalkya Smriti (Jyotish tradition)", "chapter": "Graha shanti", "section": "Homa", "note": "Vedic precedent for planetary fire rituals."},
        ],
    },
    {
        "id": "pitru_dosha",
        "types": ["vrata", "homa"],
        "planets": ["Sun", "Rahu"],
        "conditions": ["pitru_dosha", "sun_affliction"],
        "title": "Pitru / Sun affliction — tarpana",
        "text": "Pitru tarpana on Amavasya and during Pitru Paksha; Surya Namaskar; Gayatri japa; serve father/elder male relatives.",
        "citations": [
            {"work": "Brihat Parashara Hora Shastra", "chapter": "36", "section": "Pitru dosha", "note": "Sun/Rahu/9th house afflictions and ancestral debt."},
            {"work": "Phaladeepika", "chapter": "19", "section": "Pitru", "note": "9th house and Sun for pitru karma."},
        ],
    },
    {
        "id": "lal_kitab_rahu_tantra",
        "types": ["lal_kitab", "tantra"],
        "planets": ["Rahu"],
        "conditions": ["rahu_affliction"],
        "title": "Lal Kitab Rahu — iron & flow",
        "text": "Do not keep empty iron containers; flow stagnant water if Rahu afflicts 4th; donate coconut in running water on Saturday; avoid blue-black combination in bedroom per Lal Kitab.",
        "citations": [
            {"work": "Lal Kitab", "chapter": "Rahu", "section": "Upay", "note": "Vol. I/II — iron, water, and colour remedies."},
        ],
    },
    {
        "id": "yantra_mars_copper",
        "types": ["yantra", "tantra"],
        "planets": ["Mars"],
        "conditions": ["kuja_dosha", "mars_affliction"],
        "title": "Mangal yantra (copper)",
        "text": "Mars/Mangal yantra engraved on copper, installed after Mars hora puja on Tuesday; offer red flowers; anoint with sandal-red paste weekly.",
        "citations": [
            {"work": "Tantraraja (tradition)", "chapter": "Graha yantra", "section": "Mangal", "note": "Planetary yantra prana pratishtha procedure."},
            {"work": "Phaladeepika", "chapter": "14", "section": "Mars", "note": "Mars propitiation complements mantra/charity."},
        ],
    },
    {
        "id": "gand_mool_shanti",
        "types": ["homa", "vrata"],
        "planets": ["Moon"],
        "conditions": ["gand_mool", "balarishta"],
        "title": "Gand Mool / Gandanta shanti",
        "text": "Perform Gand Mool shanti when Moon is in Ashwini, Ashlesha, Magha, Jyeshtha, Mula, or Revati; Maha Mrityunjaya on Monday; donate milk-rice; seek priest-guided nakshatra shanti.",
        "citations": [
            {"work": "Brihat Parashara Hora Shastra", "chapter": "33", "section": "Gandanta", "note": "Moon in Gand Mool nakshatras requires propitiatory rites."},
            {"work": "Muhurta Chintamani", "chapter": "Nakshatra", "section": "Gand Mool", "note": "Shanti for birth in Gand Mool constellations."},
        ],
    },
]


def remedies_for_conditions(condition_ids: List[str], planets: List[str] | None = None) -> List[Dict[str, Any]]:
    """Return matching remedies, deduplicated by id."""
    cond_set = set(condition_ids)
    planet_set = set(planets or [])
    out: List[Dict[str, Any]] = []
    seen = set()
    for r in REMEDIES:
        if r["id"] in seen:
            continue
        match = bool(cond_set & set(r.get("conditions", [])))
        if not match and planet_set:
            match = bool(planet_set & set(r.get("planets", [])))
        if match:
            seen.add(r["id"])
            out.append(r)
    return out[:12]
