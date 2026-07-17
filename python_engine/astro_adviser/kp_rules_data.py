"""
KP Rules Data for Education & Career Adviser.

Structured data extracted from 5 reference books (~459 rules total):
  - Education and Sub Lord System (M.K. Viswanath)
  - Jyothisha Chintamani Profession Vol-1 (M.K. Viswanath)
  - K.P. Krishman's Profession (K. Subramaniam)
  - K.P. Krishman's Astrology & Education (K. Subramaniam)
  - Employment Prospects and KP (K. Hariharan)

Used by kp.py, synthesis.py, and advice.py for enhanced analysis.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Planet-subject correlations (education streams signified by each planet)
# ---------------------------------------------------------------------------
PLANET_SUBJECT = {
    "Sun": [
        "Political Science", "Medicine", "Administration", "Government Service",
        "Physics", "Chemistry", "Forestry", "Biomedical Science", "Zoology",
        "Solar Energy", "Pharmacy",
    ],
    "Moon": [
        "Nursing", "Marine Science", "Dairy", "Hotel Management", "Psychology",
        "Public Relations", "Agriculture", "Botany", "Horticulture",
        "Home Science", "Sociology",
    ],
    "Mars": [
        "Engineering", "Surgery", "Military Science", "Sports", "Real Estate",
        "Police Science", "Metallurgy", "Geology", "Production Management",
        "Mechanical Engineering", "Fire Safety",
    ],
    "Mercury": [
        "Commerce", "Accountancy", "Journalism", "IT", "Mathematics",
        "Communication", "Literature", "Astrology", "Aviation",
        "Marketing Management", "Computer Science", "Linguistics",
    ],
    "Jupiter": [
        "Law", "Banking", "Teaching", "Philosophy", "Finance", "Religion",
        "Sanskrit", "Vedic Studies", "Personal Management", "Economics",
        "Spiritualism", "Publishing",
    ],
    "Venus": [
        "Arts", "Music", "Fashion Technology", "Cinema", "Architecture",
        "Chemistry", "Fine Arts", "Hotel Management", "Computer Science",
        "Sexology", "Interior Design", "Poetry",
    ],
    "Saturn": [
        "Mining", "Agriculture", "Labour", "Mechanics", "History",
        "Archaeology", "Leather Technology", "Vastu", "Philosophy",
        "Engineering", "Geology", "Research",
    ],
    "Rahu": [
        "Electronics", "Aviation", "Research", "Foreign Languages",
        "Diplomacy", "Toxicology", "Computer Science", "Photography",
        "Bio-Technology", "Nuclear Physics", "Political Science",
    ],
    "Ketu": [
        "Computers", "Spiritual Studies", "Occult", "Veterinary",
        "Pathology", "Statistics", "Metaphysics", "Mysticism", "Reiki",
        "Forensic Science", "Philosophy",
    ],
}

# ---------------------------------------------------------------------------
# Sign-subject correlations (index 0=Aries, 11=Pisces)
# ---------------------------------------------------------------------------
SIGN_SUBJECT = {
    0: ["Engineering", "Metallurgy", "Surgery", "Sports", "Computer Hardware",
        "Military Science", "Fire-related Technology"],  # Aries
    1: ["Agriculture", "Finance", "Music", "Food Industry", "Economics",
        "Geology", "Law", "Fine Arts", "Fashion Technology"],  # Taurus
    2: ["Mathematics", "Aviation", "Journalism", "Research", "Literature",
        "Telecommunications", "Networking", "Railway Engineering"],  # Gemini
    3: ["Pure Science", "Biology", "Marine Science", "History",
        "Horticulture", "Social Science", "Bio-Medical Technology"],  # Cancer
    4: ["Forestry", "Law", "Medicine", "Political Science", "Psychology",
        "Alternative Medicine", "Government Administration"],  # Leo
    5: ["Mathematics", "Architecture", "Medicine", "Commerce",
        "Pharmaceutical", "Analytical Science", "Accounting"],  # Virgo
    6: ["Commerce", "Economics", "Fine Arts", "Film", "Law",
        "Electronics", "Computer Science", "Wood Technology"],  # Libra
    7: ["Chemistry", "Toxicology", "Military Science", "Veterinary",
        "E-Commerce", "Vedic Studies", "Internet Technology"],  # Scorpio
    8: ["Teaching", "Law", "Philosophy", "Travel", "Sports",
        "Religion", "Forest Science", "Organized Sports"],  # Sagittarius
    9: ["Mechanical Science", "Agriculture", "Architecture", "Economics",
        "Vastu", "Zoology", "Artisanship", "Forestry"],  # Capricorn
    10: ["Philosophy", "Aviation", "Electronics", "Nuclear Physics",
         "Rare Subjects", "Science", "Social Work"],  # Aquarius
    11: ["Marine", "Medicine", "Fishery", "Philosophy", "Literature",
         "Metaphysics", "Hypnosis", "Spirituality"],  # Pisces
}

# ---------------------------------------------------------------------------
# Profession-specific combinations (70+ professions)
# Each entry has houses (relevant houses for that profession),
# planets (primary planetary significators), and signs (zodiac indices).
# ---------------------------------------------------------------------------
PROFESSION_COMBINATIONS = {
    "Medical Doctor": {
        "houses": [5, 6, 7, 10, 11, 12],
        "planets": ["Sun", "Mars", "Ketu"],
        "signs": [4, 7],  # Leo, Scorpio
    },
    "Surgeon": {
        "houses": [6, 8, 10, 12],
        "planets": ["Mars", "Sun", "Ketu"],
        "signs": [0, 7],  # Aries, Scorpio
    },
    "Dentist": {
        "houses": [2, 6, 7, 8, 10],
        "planets": ["Saturn", "Venus", "Sun"],
        "signs": [1, 9],  # Taurus, Capricorn
    },
    "Cardiologist": {
        "houses": [5, 6, 7, 10, 11, 12],
        "planets": ["Sun", "Mars"],
        "signs": [4],  # Leo
    },
    "Gynecologist": {
        "houses": [5, 7, 8, 10],
        "planets": ["Venus", "Mars", "Sun"],
        "signs": [7],  # Scorpio
    },
    "Ayurvedic Doctor": {
        "houses": [5, 6, 9, 10, 12],
        "planets": ["Sun", "Jupiter", "Ketu"],
        "signs": [4, 8],  # Leo, Sagittarius
    },
    "Veterinary Doctor": {
        "houses": [5, 6, 10, 12],
        "planets": ["Ketu", "Mars", "Sun"],
        "signs": [7, 8],  # Scorpio, Sagittarius
    },
    "Pharmacist": {
        "houses": [5, 6, 10, 12],
        "planets": ["Venus", "Sun", "Mercury"],
        "signs": [5, 7],  # Virgo, Scorpio
    },
    "Nurse": {
        "houses": [6, 10, 12],
        "planets": ["Moon", "Sun", "Venus"],
        "signs": [3, 5],  # Cancer, Virgo
    },
    "Engineer": {
        "houses": [3, 6, 10],
        "planets": ["Mars", "Saturn", "Mercury"],
        "signs": [0, 5, 9],  # Aries, Virgo, Capricorn
    },
    "Civil Engineer": {
        "houses": [3, 4, 6, 10],
        "planets": ["Mars", "Saturn"],
        "signs": [1, 9],  # Taurus, Capricorn
    },
    "Electrical Engineer": {
        "houses": [3, 6, 10],
        "planets": ["Mars", "Sun", "Rahu"],
        "signs": [0, 10],  # Aries, Aquarius
    },
    "Mechanical Engineer": {
        "houses": [3, 6, 10],
        "planets": ["Mars", "Saturn", "Mercury"],
        "signs": [0, 9],  # Aries, Capricorn
    },
    "Electronics Engineer": {
        "houses": [3, 6, 10],
        "planets": ["Mars", "Mercury", "Rahu"],
        "signs": [2, 6, 10],  # Gemini, Libra, Aquarius
    },
    "Aeronautical Engineer": {
        "houses": [3, 6, 9, 10],
        "planets": ["Venus", "Mercury", "Rahu"],
        "signs": [2, 6, 10],  # Gemini, Libra, Aquarius (airy)
    },
    "Computer/Software Engineer": {
        "houses": [3, 6, 10],
        "planets": ["Mercury", "Venus", "Rahu"],
        "signs": [2, 6, 10],  # Gemini, Libra, Aquarius
    },
    "IT Professional": {
        "houses": [3, 6, 10],
        "planets": ["Mercury", "Rahu", "Ketu"],
        "signs": [2, 10],  # Gemini, Aquarius
    },
    "Software Programmer": {
        "houses": [3, 6, 10],
        "planets": ["Venus", "Jupiter", "Mercury"],
        "signs": [2, 5],  # Gemini, Virgo
    },
    "Hardware Engineer": {
        "houses": [3, 6, 10],
        "planets": ["Venus", "Mercury", "Mars", "Saturn"],
        "signs": [0, 9],  # Aries, Capricorn
    },
    "Network Engineer": {
        "houses": [3, 6, 9, 10],
        "planets": ["Venus", "Mercury"],
        "signs": [2, 10],  # Gemini, Aquarius
    },
    "Data Scientist": {
        "houses": [3, 6, 10],
        "planets": ["Mercury", "Ketu", "Rahu"],
        "signs": [2, 5],  # Gemini, Virgo
    },
    "Lawyer": {
        "houses": [6, 9, 10],
        "planets": ["Jupiter", "Mars", "Mercury"],
        "signs": [6, 8],  # Libra, Sagittarius
    },
    "Judge": {
        "houses": [6, 9, 10],
        "planets": ["Jupiter", "Mars", "Venus", "Sun"],
        "signs": [6, 8],  # Libra, Sagittarius
    },
    "Teacher": {
        "houses": [3, 4, 5, 7, 9, 10],
        "planets": ["Jupiter", "Mercury"],
        "signs": [3, 8],  # Cancer, Sagittarius
    },
    "Professor/Academic": {
        "houses": [3, 5, 7, 9, 10],
        "planets": ["Jupiter", "Mercury", "Sun"],
        "signs": [8, 11],  # Sagittarius, Pisces
    },
    "Chartered Accountant": {
        "houses": [2, 3, 6, 10],
        "planets": ["Mercury", "Jupiter", "Saturn"],
        "signs": [2, 5],  # Gemini, Virgo
    },
    "Banker": {
        "houses": [2, 5, 6, 10, 11],
        "planets": ["Jupiter", "Mercury", "Saturn"],
        "signs": [1, 8],  # Taurus, Sagittarius
    },
    "Nationalized Bank Officer": {
        "houses": [2, 6, 9, 10, 11],
        "planets": ["Jupiter", "Mercury", "Sun", "Saturn"],
        "signs": [1, 8],  # Taurus, Sagittarius
    },
    "Insurance Professional": {
        "houses": [6, 8, 10],
        "planets": ["Saturn", "Jupiter", "Mercury"],
        "signs": [7, 9],  # Scorpio, Capricorn
    },
    "Stockbroker/Trader": {
        "houses": [2, 5, 8, 10, 11],
        "planets": ["Mercury", "Rahu", "Venus"],
        "signs": [2, 6],  # Gemini, Libra
    },
    "Government Officer (Central)": {
        "houses": [2, 6, 9, 10, 11],
        "planets": ["Sun", "Jupiter", "Saturn"],
        "signs": [4],  # Leo
    },
    "Government Officer (State)": {
        "houses": [2, 4, 6, 10, 11],
        "planets": ["Sun", "Moon", "Saturn"],
        "signs": [3, 4],  # Cancer, Leo
    },
    "IAS/Administrative Officer": {
        "houses": [2, 6, 9, 10, 11],
        "planets": ["Sun", "Saturn", "Mars", "Jupiter", "Mercury"],
        "signs": [0, 4],  # Aries, Leo (fiery signs)
    },
    "Police Officer": {
        "houses": [4, 6, 8, 10],
        "planets": ["Mars", "Sun", "Saturn"],
        "signs": [0, 7],  # Aries, Scorpio
    },
    "Army/Military": {
        "houses": [6, 7, 9, 10],
        "planets": ["Mars", "Sun", "Saturn"],
        "signs": [0, 1, 5, 9],  # Earthy signs + Aries
    },
    "Air Force": {
        "houses": [6, 7, 9, 10],
        "planets": ["Mars", "Sun", "Mercury"],
        "signs": [2, 6, 10],  # Airy signs
    },
    "Navy": {
        "houses": [6, 7, 9, 10],
        "planets": ["Mars", "Sun", "Moon"],
        "signs": [3, 7, 11],  # Watery signs
    },
    "Journalist/Writer": {
        "houses": [3, 6, 10],
        "planets": ["Mercury", "Jupiter", "Moon"],
        "signs": [2, 5],  # Gemini, Virgo
    },
    "Author/Publisher": {
        "houses": [2, 3, 9, 10, 11],
        "planets": ["Mercury", "Jupiter"],
        "signs": [2, 8],  # Gemini, Sagittarius
    },
    "Cinema Actor": {
        "houses": [5, 6, 7, 10],
        "planets": ["Venus", "Rahu", "Mercury"],
        "signs": [4, 6, 11],  # Leo, Libra, Pisces
    },
    "Film Director": {
        "houses": [5, 6, 7, 10],
        "planets": ["Venus", "Rahu", "Sun"],
        "signs": [4, 6],  # Leo, Libra
    },
    "Singer/Musician": {
        "houses": [2, 3, 5, 7, 10],
        "planets": ["Venus", "Mercury", "Moon"],
        "signs": [0, 4, 6, 10],  # Aries, Leo, Libra, Aquarius
    },
    "Classical Musician": {
        "houses": [2, 3, 5, 10],
        "planets": ["Venus", "Jupiter", "Saturn"],
        "signs": [4, 10],  # Leo, Aquarius
    },
    "Comedian": {
        "houses": [1, 2, 3, 5, 7, 10, 11],
        "planets": ["Mercury", "Venus"],
        "signs": [2, 4],  # Gemini, Leo
    },
    "Painter/Artist": {
        "houses": [2, 5, 6, 10],
        "planets": ["Venus", "Mercury", "Moon"],
        "signs": [1, 6, 11],  # Taurus, Libra, Pisces
    },
    "Fashion Designer": {
        "houses": [3, 5, 6, 10],
        "planets": ["Venus", "Mercury", "Rahu"],
        "signs": [1, 6],  # Taurus, Libra
    },
    "Architect": {
        "houses": [3, 4, 6, 10],
        "planets": ["Venus", "Mars", "Saturn"],
        "signs": [5, 9],  # Virgo, Capricorn
    },
    "Sportsperson (General)": {
        "houses": [3, 5, 7, 9, 10],
        "planets": ["Mars", "Mercury", "Rahu"],
        "signs": [0, 8],  # Aries, Sagittarius
    },
    "Cricketer": {
        "houses": [3, 5, 7, 9, 10, 11],
        "planets": ["Mars", "Mercury", "Rahu"],
        "signs": [0, 2],  # Aries, Gemini (dual for all-rounder)
    },
    "Football Player": {
        "houses": [3, 5, 7, 10, 12],
        "planets": ["Mars", "Mercury", "Rahu"],
        "signs": [2, 8],  # Gemini, Sagittarius
    },
    "Boxer": {
        "houses": [2, 3, 5, 7, 8, 10, 11],
        "planets": ["Mars", "Mercury", "Saturn"],
        "signs": [0, 7],  # Aries, Scorpio
    },
    "Motor Racer": {
        "houses": [3, 4, 5, 6, 10, 11],
        "planets": ["Venus", "Mars", "Mercury"],
        "signs": [2, 5],  # Dual signs for four wheelers
    },
    "Railway Service": {
        "houses": [3, 4, 6, 9, 10],
        "planets": ["Mercury", "Saturn", "Venus", "Sun"],
        "signs": [1, 5, 9],  # Earthy signs
    },
    "Air Pilot": {
        "houses": [3, 6, 9, 10, 12],
        "planets": ["Mercury", "Venus", "Rahu"],
        "signs": [2, 6, 10],  # Airy signs
    },
    "Forest Officer": {
        "houses": [6, 9, 10],
        "planets": ["Venus", "Sun", "Jupiter"],
        "signs": [8],  # Sagittarius
    },
    "Cook/Chef/Restaurant": {
        "houses": [2, 6, 7, 10],
        "planets": ["Saturn", "Rahu", "Mars", "Moon", "Venus"],
        "signs": [3, 11],  # Cancer, Pisces
    },
    "Hotel Management": {
        "houses": [2, 6, 7, 10],
        "planets": ["Moon", "Venus", "Mercury"],
        "signs": [1, 3],  # Taurus, Cancer
    },
    "Agriculture/Farming": {
        "houses": [4, 6, 10, 11],
        "planets": ["Saturn", "Moon", "Venus"],
        "signs": [1, 5, 9],  # Earthy signs
    },
    "Real Estate": {
        "houses": [4, 7, 10, 11],
        "planets": ["Mars", "Saturn", "Venus"],
        "signs": [1, 9],  # Taurus, Capricorn
    },
    "Mining Engineer": {
        "houses": [4, 6, 8, 10],
        "planets": ["Saturn", "Mars", "Rahu"],
        "signs": [7, 9],  # Scorpio, Capricorn
    },
    "Astrologer": {
        "houses": [2, 5, 8, 9, 10],
        "planets": ["Saturn", "Mercury", "Jupiter", "Ketu"],
        "signs": [7, 10],  # Scorpio, Aquarius
    },
    "Spiritual Leader/Ascetic": {
        "houses": [1, 3, 4, 8, 10, 12],
        "planets": ["Saturn", "Ketu", "Jupiter"],
        "signs": [8, 11],  # Sagittarius, Pisces
    },
    "Book Seller": {
        "houses": [3, 4, 7, 9, 10],
        "planets": ["Mercury", "Jupiter"],
        "signs": [2, 8],  # Gemini, Sagittarius
    },
    "Purchase Officer": {
        "houses": [4, 6, 7, 10, 11],
        "planets": ["Mercury", "Saturn", "Jupiter"],
        "signs": [5, 9],  # Virgo, Capricorn
    },
    "Export Business": {
        "houses": [7, 9, 10, 12],
        "planets": ["Mercury", "Rahu", "Venus"],
        "signs": [3, 7, 11],  # Watery signs
    },
    "Diplomat/Foreign Service": {
        "houses": [7, 9, 10, 12],
        "planets": ["Mercury", "Moon", "Sun", "Rahu"],
        "signs": [6, 10],  # Libra, Aquarius
    },
    "Psychologist": {
        "houses": [5, 6, 8, 10, 12],
        "planets": ["Moon", "Rahu", "Mercury"],
        "signs": [3, 7],  # Cancer, Scorpio
    },
    "Social Worker": {
        "houses": [6, 9, 10, 11, 12],
        "planets": ["Saturn", "Jupiter", "Moon"],
        "signs": [10, 11],  # Aquarius, Pisces
    },
    "Textile/Fashion Industry": {
        "houses": [3, 6, 7, 10],
        "planets": ["Venus", "Rahu", "Mercury"],
        "signs": [1, 6],  # Taurus, Libra
    },
    "Accountant": {
        "houses": [2, 3, 6, 10],
        "planets": ["Mercury", "Jupiter"],
        "signs": [2, 5],  # Gemini, Virgo
    },
    "Mathematician/Statistician": {
        "houses": [3, 5, 6, 10],
        "planets": ["Mercury", "Ketu", "Saturn"],
        "signs": [2, 5, 10],  # Gemini, Virgo, Aquarius
    },
    "Chemist/Chemical Engineer": {
        "houses": [5, 6, 10],
        "planets": ["Venus", "Sun", "Mars"],
        "signs": [7, 0],  # Scorpio, Aries
    },
    "Geologist": {
        "houses": [4, 6, 8, 10],
        "planets": ["Saturn", "Mars"],
        "signs": [1, 5, 9],  # Earthy signs
    },
    "Marine Professional": {
        "houses": [6, 9, 10, 12],
        "planets": ["Moon", "Saturn", "Venus"],
        "signs": [3, 7, 11],  # Watery signs
    },
    "Automobile Industry": {
        "houses": [3, 4, 6, 10],
        "planets": ["Venus", "Mars", "Mercury"],
        "signs": [2, 5],  # Dual signs / Mercury-related
    },
    "Electrician/Electrical Worker": {
        "houses": [3, 6, 10],
        "planets": ["Mars", "Sun", "Rahu"],
        "signs": [0, 4],  # Aries, Leo
    },
    "Plumber/Construction Worker": {
        "houses": [4, 6, 10],
        "planets": ["Saturn", "Mars"],
        "signs": [9, 1],  # Capricorn, Taurus
    },
}

# ---------------------------------------------------------------------------
# Competitive exam rules
# ---------------------------------------------------------------------------
COMPETITIVE_EXAM = {
    "promise_houses": [4, 5, 9, 11],
    "success_houses": [4, 6, 11],  # 6th = beating competition
    "denial_houses": [5, 8, 12],   # 5th favors opponent, 12th general loss
    "cusp_analysis": {
        "primary": 6,
        "positive": [6, 10, 11],
        "negative": [5, 8, 12],
    },
    "first_class_requires": {
        "lagna_sublord_signifies": [4, 6, 10, 11],
        "mc_sublord_signifies": [4, 6, 10, 11],
    },
    "pass_dba": {
        "must_signify": [4, 9, 11],
        "alternative": [[4, 11], [9, 11], [11]],
    },
    "11th_cusp_sublord_signifies": [3, 6, 9, 11],
}

# ---------------------------------------------------------------------------
# Foreign education rules
# ---------------------------------------------------------------------------
FOREIGN_EDUCATION = {
    "houses": [9, 12],
    "cusp_9_sublord_must_signify": [9, 12],
    "cusp_12_sublord_connected_to": [3, 9],
    "supporting": [3, 4],
    "rahu_role": "foreign connection catalyst",
    "timing_planets": ["Rahu", "Saturn", "Moon"],
    "hostel_houses": [9, 12],
}

# ---------------------------------------------------------------------------
# Job vs Business determination
# ---------------------------------------------------------------------------
JOB_VS_BUSINESS = {
    "job_indicators": {
        "houses": [6, 10],
        "6th_strong": True,
        "saturn_connection": True,
        "cusp_10_sublord_connected_to_6": True,
    },
    "business_indicators": {
        "houses": [7, 10],
        "7th_strong": True,
        "mercury_venus_connection": True,
        "cusp_10_sublord_connected_to_7": True,
    },
    "both_possible": {
        "6th_and_7th_connected": True,
        "dual_sign_bhukti_lord": True,
    },
    "income_type": {
        "movable_sign": "mints money",
        "common_sign": "variable income",
        "fixed_sign": "steady fixed income",
    },
}

# ---------------------------------------------------------------------------
# Transfer rules
# ---------------------------------------------------------------------------
TRANSFER_RULES = {
    "houses": [3, 10, 12],
    "cusp_3_sublord_signifies": [3, 9, 10, 12],
    "cusp_5_or_9_sublord_in_movable_dual_sign": True,
    "movable_sign_indicator": True,
    "timing": "conjoined period of significators of 3, 10, 12",
}

# ---------------------------------------------------------------------------
# Promotion rules
# ---------------------------------------------------------------------------
PROMOTION_RULES = {
    "houses": [2, 6, 10, 11],
    "cusp_10_sublord_signifies": [2, 6, 10, 11],
    "jupiter_aspect_10th": True,
    "11th_house_key": True,
    "timing": "conjoined period of significators of 2, 6, 10, 11",
}

# ---------------------------------------------------------------------------
# Loss of job indicators
# ---------------------------------------------------------------------------
LOSS_OF_JOB = {
    "houses": [1, 5, 8, 9, 12],  # 12th from 2,6,10; plus 8th
    "moksha_houses_detrimental": [4, 8, 12],
    "ketu_connection": True,
    "saturn_ketu_combination": "exit or ejection from service",
    "5th_negates_6th": True,
    "10th_linked_to_12th": "punishments from higher-ups",
    "sun_in_ketu_star": "sudden removal from position",
}

# ---------------------------------------------------------------------------
# Suspension/Dismissal
# ---------------------------------------------------------------------------
SUSPENSION_RULES = {
    "suspension_houses": [1, 8, 9, 12],
    "dismissal_houses": [1, 5, 8, 9, 12],  # 5th added for dismissal
    "saturn_ketu_connection": True,
}

# ---------------------------------------------------------------------------
# Education stream determination from planet combinations
# ---------------------------------------------------------------------------
EDUCATION_STREAMS = {
    "Science": {
        "planets": ["Sun", "Mars", "Ketu"],
        "houses": [5, 9],
    },
    "Commerce": {
        "planets": ["Mercury", "Jupiter", "Venus"],
        "houses": [2, 5, 11],
    },
    "Arts": {
        "planets": ["Venus", "Moon"],
        "houses": [3, 5],
    },
    "Engineering": {
        "planets": ["Mars", "Saturn", "Mercury"],
        "houses": [3, 6, 10],
    },
    "Medical": {
        "planets": ["Sun", "Mars", "Ketu"],
        "houses": [5, 6, 12],
    },
    "Law": {
        "planets": ["Jupiter", "Mars", "Mercury"],
        "houses": [6, 9, 10],
    },
    "IT/Computer": {
        "planets": ["Mercury", "Rahu", "Venus"],
        "houses": [3, 6, 10],
    },
    "Management/MBA": {
        "planets": ["Mercury", "Jupiter", "Venus"],
        "houses": [2, 6, 9, 10],
        "signs": [2, 5, 8, 9],  # Gemini, Virgo, Sagittarius, Capricorn
    },
    "Finance": {
        "planets": ["Jupiter", "Mercury", "Venus"],
        "houses": [2, 5, 11],
    },
    "Teaching": {
        "planets": ["Jupiter", "Mercury"],
        "houses": [3, 5, 7, 9],
    },
    "Music": {
        "planets": ["Venus", "Mercury", "Moon"],
        "houses": [2, 3, 5],
        "signs": [0, 4, 6, 10],  # Aries, Leo, Libra, Aquarius
    },
    "Journalism": {
        "planets": ["Mercury", "Jupiter", "Moon"],
        "houses": [3, 9, 10],
    },
    "Architecture": {
        "planets": ["Venus", "Mars", "Saturn"],
        "houses": [3, 4, 10],
    },
    "Pharmacy": {
        "planets": ["Venus", "Sun", "Mercury"],
        "houses": [5, 6, 10, 12],
    },
    "Agriculture": {
        "planets": ["Saturn", "Moon", "Venus"],
        "houses": [4, 6, 10],
    },
    "Astrology/Occult": {
        "planets": ["Saturn", "Ketu", "Mercury", "Jupiter"],
        "houses": [4, 5, 8, 9],
    },
    "Sports/Physical Ed": {
        "planets": ["Mars", "Mercury", "Rahu"],
        "houses": [3, 5, 9],
    },
    "Electronics": {
        "planets": ["Mars", "Mercury", "Rahu"],
        "houses": [3, 6, 10],
    },
    "Aviation": {
        "planets": ["Venus", "Mercury", "Rahu"],
        "houses": [3, 9, 12],
        "signs": [2, 6, 10],  # Airy signs
    },
    "Marine Science": {
        "planets": ["Moon", "Saturn", "Venus"],
        "houses": [4, 9, 12],
        "signs": [3, 7, 11],  # Watery signs
    },
}

# ---------------------------------------------------------------------------
# MBA specialization combinations
# ---------------------------------------------------------------------------
MBA_SPECIALIZATIONS = {
    "MBA-Finance": {
        "planets": ["Venus", "Mercury"],
        "houses": [2],
    },
    "MBA-Marketing": {
        "planets": ["Mercury"],
        "houses": [3, 9],
        "signs": [2, 5],  # Gemini, Virgo
    },
    "MBA-HR": {
        "planets": ["Saturn", "Jupiter", "Mercury"],
        "houses": [6],
        "signs": [2, 5, 11],  # Virgo, Pisces, Gemini
    },
    "MBA-International Trade": {
        "planets": ["Mercury"],
        "houses": [9, 12],
        "signs": [2, 5],  # Gemini, Virgo
    },
    "MBA-Production": {
        "planets": ["Mars", "Mercury"],
        "signs": [0, 2],  # Aries, Gemini
    },
}

# ---------------------------------------------------------------------------
# Education promise rules (KP)
# ---------------------------------------------------------------------------
EDUCATION_PROMISE = {
    "basic_education": {
        "cusp": 4,
        "sublord_must_signify": [4, 9, 11],
        "denial_if_signifies": [3, 8, 12],
    },
    "higher_education": {
        "cusp": 9,
        "sublord_must_signify": [4, 9, 11],
        "denial_if_8th_connected": True,
    },
    "education_houses_positive": [4, 9, 11],
    "education_houses_negative": [3, 5, 8, 12],
    "karaka_planets": ["Mercury", "Jupiter"],
    "mercury_strong_in": ["Aries", "Leo", "Sagittarius", "Gemini", "Libra", "Aquarius"],
    "mercury_weak_in": ["Cancer", "Scorpio", "Pisces"],
}

# ---------------------------------------------------------------------------
# Education level by sub-lord connections
# ---------------------------------------------------------------------------
EDUCATION_LEVELS = {
    "post_graduate_phd": {
        "4th_sublord_signifies": [4, 9, 11],
        "9th_sublord_signifies": [4, 9, 11],
        "both_required": True,
    },
    "graduation": {
        "4th_sublord_signifies": [4, 9, 11],
        "note": "Both 4th and 9th connected to 4-9-11 simultaneously",
    },
    "intermediate": {
        "4th_sublord_signifies": [4, 11],
        "note": "Without 9th connection, limited to intermediate level",
    },
    "below_10th": {
        "4th_sublord_signifies": [4, 9],
        "condition": "Sthira (fixed) lagna",
    },
    "no_education": {
        "4th_sublord": ["Mars", "Saturn"],
        "connected_to": [8, 12],
    },
}

# ---------------------------------------------------------------------------
# Breaks in education patterns
# ---------------------------------------------------------------------------
BREAKS_IN_EDUCATION = {
    "break_houses": [3, 5, 8],
    "saturn_ketu_combination": "breakage and exit from education",
    "mercury_weak_in_watery_signs": True,
    "jupiter_in_8th_negates_9th": True,
    "fixed_signs_laziness": True,
    "dba_not_connected_4_or_9": True,
    "malefic_in_2nd_from_lagna_or_mercury": {
        "Saturn": "bad environment/company",
        "Mars": "accident/injury/death of parents",
        "Rahu": "mysterious circumstances",
    },
    "punarphoo_moon_saturn": "success only after repeated attempts",
}

# ---------------------------------------------------------------------------
# Employment timing rules
# ---------------------------------------------------------------------------
EMPLOYMENT_TIMING = {
    "houses_for_getting_job": [2, 6, 10, 11],
    "significator_order": [
        "planets in constellation of occupants of 2, 6, 10",
        "occupants of 2, 6, 10",
        "planets in constellation of lords of 2, 6, 10",
        "lords of 2, 6, 10",
        "planets conjoined/aspected by above",
    ],
    "timing": "conjoined period (DBA) of significators of 2, 6, 10, 11",
    "transit_confirmation": {
        "moon_in_star_of_significator": True,
        "day_lord_matches_significator": True,
        "lagna_star_ruled_by_significator": True,
    },
}

# ---------------------------------------------------------------------------
# Sign element and modality mappings for career
# ---------------------------------------------------------------------------
SIGN_ELEMENT_CAREER = {
    "fiery": {
        "signs": [0, 4, 8],  # Aries, Leo, Sagittarius
        "career_themes": ["fire", "iron", "metals", "surgery", "factory",
                          "administration", "government"],
    },
    "earthy": {
        "signs": [1, 5, 9],  # Taurus, Virgo, Capricorn
        "career_themes": ["business", "agriculture", "patience-based",
                          "army/land forces", "practical work"],
    },
    "airy": {
        "signs": [2, 6, 10],  # Gemini, Libra, Aquarius
        "career_themes": ["mental pursuits", "air travel", "singing",
                          "planning", "treasury", "communication"],
    },
    "watery": {
        "signs": [3, 7, 11],  # Cancer, Scorpio, Pisces
        "career_themes": ["liquids", "travel", "hospitals", "navy",
                          "navigation", "export/import"],
    },
}

SIGN_MODALITY_CAREER = {
    "movable": {
        "signs": [0, 3, 6, 9],  # Aries, Cancer, Libra, Capricorn
        "career_themes": ["change", "movement", "running",
                          "travel-based professions"],
    },
    "fixed": {
        "signs": [1, 4, 7, 10],  # Taurus, Leo, Scorpio, Aquarius
        "career_themes": ["steady income", "standing/fixed work",
                          "persistence required"],
    },
    "dual": {
        "signs": [2, 5, 8, 11],  # Gemini, Virgo, Sagittarius, Pisces
        "career_themes": ["dual activities", "all-rounder", "playgrounds",
                          "four-wheelers", "variable work"],
    },
}

# ---------------------------------------------------------------------------
# Planet combination shortcuts (frequently referenced pairings)
# ---------------------------------------------------------------------------
PLANET_COMBINATIONS = {
    "Mars+Mercury": "Engineering, Analysis, Electronics",
    "Mars+Saturn": "Construction, Heavy Industry, Mechanics",
    "Mars+Sun": "Electrical, Power, Authority",
    "Sun+Jupiter": "Biology, Administration, Higher Authority",
    "Sun+Venus": "Chemistry, Chemical Industry",
    "Mercury+Jupiter": "Teaching, Journalism, Accountancy",
    "Mercury+Venus": "IT Sector, Computer Science, Fashion",
    "Venus+Jupiter": "Computer Programming, Finance",
    "Saturn+Rahu": "Cooking, Foreign Connections, Industry",
    "Saturn+Ketu": "Exit/Detachment, Ascetism, Job Loss",
    "Venus+Rahu": "Cinema, Foreign Arts, Photography",
    "Mercury+Rahu": "Playing, Gambling, Gaming Technology",
    "Jupiter+Mars": "Managing Director, Judge, Authority",
    "Mars+Saturn+Mercury": "Engineering (all branches)",
    "Venus+Mercury+Mars": "Computer Hardware, Electronics",
    "Venus+Jupiter+Mercury": "Software Programming",
}

# ---------------------------------------------------------------------------
# Dasha timing principles for career/education
# ---------------------------------------------------------------------------
DASHA_PRINCIPLES = {
    "education_timing": {
        "age_15_17_critical": "DBA at this age decides line of education",
        "fructification": "conjoined period of significators of 4, 9, 11",
    },
    "career_entry": {
        "timing": "DBA of significators of 2, 6, 10, 11",
        "sun_exciting_planet": True,
        "moon_fructifying_planet": True,
    },
    "career_change": {
        "dasa_lord_in_12_to_previous": True,
        "9th_house_connection": "change in institution/job",
        "movable_sign_bhukti_lord": "change certain",
    },
    "saturn_nature": "gives in installments, with delay, never full extent",
}
