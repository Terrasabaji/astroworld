"""Shared Prashna constants: house mappings, karakas, NLP keywords."""

from __future__ import annotations

# datetime.weekday(): Monday=0 … Sunday=6
DAY_LORDS = ["Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Sun"]

SIGN_LORDS = [
    "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
    "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
]

SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

# Category → primary house + supporting / denial houses + karaka
CATEGORY_HOUSES = {
    "health": {
        "primary": 1,
        "favorable": [1, 5, 11],
        "denial": [6, 8, 12],
        "karaka": "Sun",
        "label": "Health / vitality",
    },
    "finance": {
        "primary": 2,
        "favorable": [2, 6, 11],
        "denial": [5, 8, 12],
        "karaka": "Jupiter",
        "label": "Finance / wealth",
    },
    "siblings": {
        "primary": 3,
        "favorable": [3, 11],
        "denial": [6, 8, 12],
        "karaka": "Mars",
        "label": "Siblings / short travel",
    },
    "property": {
        "primary": 4,
        "favorable": [4, 11, 12],
        "denial": [6, 8],
        "karaka": "Moon",
        "label": "Property / vehicles / mother",
    },
    "children": {
        "primary": 5,
        "favorable": [2, 5, 11],
        "denial": [1, 6, 10],
        "karaka": "Jupiter",
        "label": "Children / education / romance",
    },
    "litigation": {
        "primary": 6,
        "favorable": [6, 11],
        "denial": [8, 12],
        "karaka": "Mars",
        "label": "Litigation / disease / enemies",
    },
    "marriage": {
        "primary": 7,
        "favorable": [2, 7, 11],
        "denial": [1, 6, 10, 12],
        "karaka": "Venus",
        "label": "Marriage / partnership",
    },
    "longevity": {
        "primary": 8,
        "favorable": [1, 3, 8],
        "denial": [2, 7, 12],
        "karaka": "Saturn",
        "label": "Longevity / occult / inheritance",
    },
    "fortune": {
        "primary": 9,
        "favorable": [2, 9, 11],
        "denial": [6, 8, 12],
        "karaka": "Jupiter",
        "label": "Fortune / dharma / long travel",
    },
    "career": {
        "primary": 10,
        "favorable": [2, 6, 10, 11],
        "denial": [5, 8, 12],
        "karaka": "Sun",
        "label": "Career / profession / status",
    },
    "gains": {
        "primary": 11,
        "favorable": [2, 6, 11],
        "denial": [5, 8, 12],
        "karaka": "Jupiter",
        "label": "Gains / fulfillment of desires",
    },
    "foreign": {
        "primary": 12,
        "favorable": [3, 9, 12],
        "denial": [2, 4, 11],
        "karaka": "Saturn",
        "label": "Foreign stay / losses / moksha",
    },
    "education": {
        "primary": 4,
        "favorable": [4, 5, 9, 11],
        "denial": [6, 8, 12],
        "karaka": "Mercury",
        "label": "Education / learning",
    },
    "travel": {
        "primary": 3,
        "favorable": [3, 9, 12],
        "denial": [4, 8],
        "karaka": "Moon",
        "label": "Travel",
    },
    "missing_item": {
        "primary": 2,
        "favorable": [2, 11],
        "denial": [6, 8, 12],
        "karaka": "Mercury",
        "label": "Missing article / recovery",
    },
}

# Keyword dictionary for basic NLP → category / houses
KEYWORD_MAP = {
    # marriage
    "marriage": "marriage", "married": "marriage", "marry": "marriage",
    "wedding": "marriage", "spouse": "marriage",
    "husband": "marriage", "wife": "marriage", "partner": "marriage",
    "love": "marriage", "relationship": "marriage", "engagement": "marriage",
    "divorce": "marriage",
    # career
    "job": "career", "career": "career", "profession": "career",
    "promotion": "career", "business": "career", "work": "career",
    "office": "career", "employment": "career", "interview": "career",
    "transfer": "career",
    # finance
    "money": "finance", "finance": "finance", "wealth": "finance",
    "income": "finance", "salary": "finance", "loan": "finance",
    "debt": "finance", "profit": "finance", "loss": "finance",
    "investment": "finance",
    # health
    "health": "health", "illness": "health", "disease": "health",
    "surgery": "health", "hospital": "health", "recovery": "health",
    "cure": "health",
    # children
    "child": "children", "children": "children", "pregnancy": "children",
    "conceive": "children", "baby": "children", "progeny": "children",
    # education
    "education": "education", "exam": "education", "study": "education",
    "admission": "education", "college": "education", "school": "education",
    "result": "education",
    # property
    "house": "property", "property": "property", "land": "property",
    "vehicle": "property", "car": "property", "home": "property",
    "real estate": "property",
    # litigation
    "court": "litigation", "case": "litigation", "litigation": "litigation",
    "lawsuit": "litigation", "enemy": "litigation", "dispute": "litigation",
    # travel / foreign
    "travel": "travel", "journey": "travel", "trip": "travel",
    "foreign": "foreign", "abroad": "foreign", "visa": "foreign",
    "immigration": "foreign",
    # missing
    "missing": "missing_item", "lost": "missing_item", "stolen": "missing_item",
    "theft": "missing_item", "find": "missing_item",
    # fortune
    "luck": "fortune", "fortune": "fortune", "pilgrimage": "fortune",
    "guru": "fortune",
    # siblings
    "brother": "siblings", "sister": "siblings", "sibling": "siblings",
    # longevity
    "death": "longevity", "longevity": "longevity", "inheritance": "longevity",
}

MOOKA_LABELS = {
    "health": "Is the querent concerned about health or vitality?",
    "marriage": "Is the querent concerned about marriage or partnership?",
    "career": "Is the querent concerned about career, job, or profession?",
    "litigation": "Is the querent concerned about litigation, enemies, or disputes?",
    "children": "Is the querent concerned about children or progeny?",
    "finance": "Is the querent concerned about money or financial matters?",
    "property": "Is the querent concerned about property, vehicles, or home?",
    "education": "Is the querent concerned about education or examinations?",
    "travel": "Is the querent concerned about travel?",
    "foreign": "Is the querent concerned about foreign stay or emigration?",
    "gains": "Is the querent concerned about gains or fulfillment of desires?",
    "fortune": "Is the querent concerned about fortune, dharma, or higher studies?",
    "siblings": "Is the querent concerned about siblings or courage?",
    "longevity": "Is the querent concerned about longevity, inheritance, or occult matters?",
    "missing_item": "Is the querent concerned about a missing article?",
}

# Tajika aspect angles (degrees) with default orb
TAJIKA_ASPECTS = {
    "conjunction": 0,
    "opposition": 180,
    "trine": 120,
    "square": 90,
    "sextile": 60,
}
TAJIKA_ORB = 6.0
