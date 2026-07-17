"""
Unit tests for new KP analysis functions:
- judge_competitive_exam
- judge_foreign_education
- identify_profession
- judge_transfer
- judge_promotion
- extended judge_education (suggested_subjects)
- extended judge_career (professions)

Uses a mock Chart to isolate logic from ephemeris computation.
"""

import pytest
from unittest.mock import MagicMock, patch
from dataclasses import dataclass
from typing import List

from python_engine.astro_adviser import constants as C
from python_engine.astro_adviser.ephemeris import Lordship, PlanetPos, HouseCusp, Chart
from python_engine.astro_adviser.kp import (
    judge_competitive_exam,
    judge_foreign_education,
    identify_profession,
    judge_transfer,
    judge_promotion,
    judge_education,
    judge_career,
    KPCompetitiveExamResult,
    KPForeignEducationResult,
    KPTransferResult,
    KPPromotionResult,
    KPEducationResult,
    KPCareerResult,
)
from python_engine.astro_adviser.synthesis import (
    synthesize_competitive_exam,
    synthesize_foreign_education,
    synthesize_transfer,
    synthesize_promotion,
    synthesize_full_advice,
)


# ---------------------------------------------------------------------------
# Mock Chart Builder
# ---------------------------------------------------------------------------
def _make_lordship(sign="Aries", star_lord="Sun", sub_lord="Moon",
                   sub_sub_lord="Mars", sign_lord="Mars"):
    return Lordship(
        sign=sign, sign_lord=sign_lord, nakshatra="Ashwini",
        nak_index=0, pada=1, star_lord=star_lord,
        sub_lord=sub_lord, sub_sub_lord=sub_sub_lord,
    )


def _make_planet(name, house, sign="Aries", sign_index=0,
                 star_lord="Sun", sub_lord="Moon"):
    lordship = _make_lordship(sign=sign, star_lord=star_lord,
                              sub_lord=sub_lord, sign_lord=C.SIGN_LORD[sign])
    return PlanetPos(
        name=name, longitude=float(house * 30), sign=sign,
        sign_index=sign_index, degree_in_sign=15.0,
        retrograde=False, house=house, lordship=lordship,
    )


def _make_cusp(number, sub_lord="Sun", sign="Aries"):
    lordship = _make_lordship(sign=sign, sub_lord=sub_lord,
                              sign_lord=C.SIGN_LORD[sign])
    return HouseCusp(number=number, longitude=float((number - 1) * 30),
                     sign=sign, lordship=lordship)


def build_mock_chart(planet_config=None, cusp_config=None):
    """
    Build a simplified mock Chart.
    planet_config: list of (name, house, sign, star_lord, sub_lord) tuples
    cusp_config: dict of {house_number: (sub_lord, sign)}
    """
    if planet_config is None:
        # Default: spread planets across houses.
        planet_config = [
            (C.SUN, 10, "Leo", "Sun", "Jupiter"),
            (C.MOON, 4, "Cancer", "Moon", "Venus"),
            (C.MARS, 6, "Aries", "Mars", "Saturn"),
            (C.MERCURY, 5, "Gemini", "Mercury", "Rahu"),
            (C.JUPITER, 9, "Sagittarius", "Jupiter", "Mercury"),
            (C.VENUS, 7, "Libra", "Venus", "Moon"),
            (C.SATURN, 3, "Capricorn", "Saturn", "Mars"),
            (C.RAHU, 12, "Pisces", "Jupiter", "Saturn"),
            (C.KETU, 6, "Virgo", "Mercury", "Sun"),
        ]

    planets = {}
    for name, house, sign, star_lord, sub_lord in planet_config:
        sign_index = C.SIGNS.index(sign)
        planets[name] = _make_planet(name, house, sign, sign_index,
                                     star_lord, sub_lord)

    signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
             "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]

    if cusp_config is None:
        cusp_config = {}

    cusps = []
    for i in range(1, 13):
        if i in cusp_config:
            sub_lord, sign = cusp_config[i]
        else:
            sign = signs[i - 1]
            sub_lord = C.PLANETS[(i - 1) % 9]
        cusps.append(_make_cusp(i, sub_lord=sub_lord, sign=sign))

    asc_lordship = _make_lordship(sign="Aries", star_lord="Mars")

    import datetime as dt
    chart = Chart(
        system="KP",
        when_local=dt.datetime(1990, 1, 15, 6, 0),
        when_utc=dt.datetime(1990, 1, 15, 0, 30),
        latitude=13.0,
        longitude=80.0,
        timezone=5.5,
        ayanamsa=23.7,
        ascendant=0.0,
        asc_lordship=asc_lordship,
        planets=planets,
        cusps=cusps,
        house_signs=signs,
    )
    return chart


# ---------------------------------------------------------------------------
# Tests for judge_competitive_exam
# ---------------------------------------------------------------------------
class TestJudgeCompetitiveExam:
    def test_returns_correct_type(self):
        chart = build_mock_chart()
        result = judge_competitive_exam(chart)
        assert isinstance(result, KPCompetitiveExamResult)

    def test_has_required_fields(self):
        chart = build_mock_chart()
        result = judge_competitive_exam(chart)
        assert hasattr(result, 'success_likely')
        assert hasattr(result, 'csl_findings')
        assert hasattr(result, 'significators')
        assert hasattr(result, 'notes')

    def test_notes_not_empty(self):
        chart = build_mock_chart()
        result = judge_competitive_exam(chart)
        assert len(result.notes) >= 1

    def test_csl_findings_contain_house_6(self):
        chart = build_mock_chart()
        result = judge_competitive_exam(chart)
        houses = [f.house for f in result.csl_findings]
        assert 6 in houses

    def test_significators_is_list(self):
        chart = build_mock_chart()
        result = judge_competitive_exam(chart)
        assert isinstance(result.significators, list)


# ---------------------------------------------------------------------------
# Tests for judge_foreign_education
# ---------------------------------------------------------------------------
class TestJudgeForeignEducation:
    def test_returns_correct_type(self):
        chart = build_mock_chart()
        result = judge_foreign_education(chart)
        assert isinstance(result, KPForeignEducationResult)

    def test_has_required_fields(self):
        chart = build_mock_chart()
        result = judge_foreign_education(chart)
        assert hasattr(result, 'indicated')
        assert hasattr(result, 'csl_findings')
        assert hasattr(result, 'notes')

    def test_notes_not_empty(self):
        chart = build_mock_chart()
        result = judge_foreign_education(chart)
        assert len(result.notes) >= 1

    def test_csl_findings_contain_house_9(self):
        chart = build_mock_chart()
        result = judge_foreign_education(chart)
        houses = [f.house for f in result.csl_findings]
        assert 9 in houses


# ---------------------------------------------------------------------------
# Tests for identify_profession
# ---------------------------------------------------------------------------
class TestIdentifyProfession:
    def test_returns_list(self):
        chart = build_mock_chart()
        result = identify_profession(chart)
        assert isinstance(result, list)

    def test_max_5_results(self):
        chart = build_mock_chart()
        result = identify_profession(chart)
        assert len(result) <= 5

    def test_each_entry_has_required_keys(self):
        chart = build_mock_chart()
        result = identify_profession(chart)
        if result:
            entry = result[0]
            assert "profession" in entry
            assert "confidence" in entry
            assert "matching_planets" in entry
            assert "matching_houses" in entry

    def test_confidence_is_percentage(self):
        chart = build_mock_chart()
        result = identify_profession(chart)
        for entry in result:
            assert 0 <= entry["confidence"] <= 100

    def test_sorted_by_confidence(self):
        chart = build_mock_chart()
        result = identify_profession(chart)
        confidences = [r["confidence"] for r in result]
        assert confidences == sorted(confidences, reverse=True)


# ---------------------------------------------------------------------------
# Tests for judge_transfer
# ---------------------------------------------------------------------------
class TestJudgeTransfer:
    def test_returns_correct_type(self):
        chart = build_mock_chart()
        result = judge_transfer(chart)
        assert isinstance(result, KPTransferResult)

    def test_has_required_fields(self):
        chart = build_mock_chart()
        result = judge_transfer(chart)
        assert hasattr(result, 'transfer_likely')
        assert hasattr(result, 'csl_findings')
        assert hasattr(result, 'notes')

    def test_notes_not_empty(self):
        chart = build_mock_chart()
        result = judge_transfer(chart)
        assert len(result.notes) >= 1

    def test_csl_findings_contain_house_3(self):
        chart = build_mock_chart()
        result = judge_transfer(chart)
        houses = [f.house for f in result.csl_findings]
        assert 3 in houses


# ---------------------------------------------------------------------------
# Tests for judge_promotion
# ---------------------------------------------------------------------------
class TestJudgePromotion:
    def test_returns_correct_type(self):
        chart = build_mock_chart()
        result = judge_promotion(chart)
        assert isinstance(result, KPPromotionResult)

    def test_has_required_fields(self):
        chart = build_mock_chart()
        result = judge_promotion(chart)
        assert hasattr(result, 'promotion_likely')
        assert hasattr(result, 'csl_findings')
        assert hasattr(result, 'jupiter_aspect')
        assert hasattr(result, 'notes')

    def test_jupiter_aspect_is_bool(self):
        chart = build_mock_chart()
        result = judge_promotion(chart)
        assert isinstance(result.jupiter_aspect, bool)

    def test_notes_not_empty(self):
        chart = build_mock_chart()
        result = judge_promotion(chart)
        assert len(result.notes) >= 1


# ---------------------------------------------------------------------------
# Tests for extended judge_education (suggested_subjects)
# ---------------------------------------------------------------------------
class TestJudgeEducationExtended:
    def test_has_suggested_subjects(self):
        chart = build_mock_chart()
        result = judge_education(chart)
        assert isinstance(result, KPEducationResult)
        assert hasattr(result, 'suggested_subjects')
        assert isinstance(result.suggested_subjects, list)

    def test_suggested_subjects_derived_from_field_planets(self):
        chart = build_mock_chart()
        result = judge_education(chart)
        # suggested_subjects should be non-empty if field_planets are set
        if result.field_planets:
            assert len(result.suggested_subjects) > 0

    def test_max_8_subjects(self):
        chart = build_mock_chart()
        result = judge_education(chart)
        assert len(result.suggested_subjects) <= 8


# ---------------------------------------------------------------------------
# Tests for extended judge_career (professions)
# ---------------------------------------------------------------------------
class TestJudgeCareerExtended:
    def test_has_professions(self):
        chart = build_mock_chart()
        result = judge_career(chart)
        assert isinstance(result, KPCareerResult)
        assert hasattr(result, 'professions')
        assert isinstance(result.professions, list)

    def test_professions_max_5(self):
        chart = build_mock_chart()
        result = judge_career(chart)
        assert len(result.professions) <= 5


# ---------------------------------------------------------------------------
# Tests for synthesis functions
# ---------------------------------------------------------------------------
class TestSynthesisIntegration:
    def test_synthesize_competitive_exam(self):
        chart = build_mock_chart()
        result = synthesize_competitive_exam(chart)
        assert result["section"] == "Competitive Examinations"
        assert "success_likely" in result
        assert "notes" in result
        assert "csl_details" in result

    def test_synthesize_foreign_education(self):
        chart = build_mock_chart()
        result = synthesize_foreign_education(chart)
        assert result["section"] == "Foreign Education"
        assert "indicated" in result
        assert "notes" in result

    def test_synthesize_transfer(self):
        chart = build_mock_chart()
        result = synthesize_transfer(chart)
        assert result["section"] == "Transfer / Relocation"
        assert "transfer_likely" in result
        assert "notes" in result

    def test_synthesize_promotion(self):
        chart = build_mock_chart()
        result = synthesize_promotion(chart)
        assert result["section"] == "Promotion / Career Advancement"
        assert "promotion_likely" in result
        assert "jupiter_aspect" in result
        assert "notes" in result

    def test_synthesize_full_advice(self):
        chart = build_mock_chart()
        result = synthesize_full_advice(chart)
        assert "competitive_exam" in result
        assert "foreign_education" in result
        assert "transfer" in result
        assert "promotion" in result

    def test_synthesize_full_advice_with_vocations(self):
        chart = build_mock_chart()
        edu = [{"title": "Engineering"}]
        career = [{"title": "IT Professional"}]
        result = synthesize_full_advice(chart, education_streams=edu,
                                        career_fields=career)
        assert "vocations" in result
        assert "competitive_exam" in result


# ---------------------------------------------------------------------------
# Tests for constants
# ---------------------------------------------------------------------------
class TestNewConstants:
    def test_exam_positive(self):
        assert C.EXAM_POSITIVE == [6, 10, 11]

    def test_exam_negative(self):
        assert C.EXAM_NEGATIVE == [5, 8, 12]

    def test_foreign_edu_positive(self):
        assert C.FOREIGN_EDU_POSITIVE == [9, 12]

    def test_transfer_houses(self):
        assert C.TRANSFER_HOUSES == [3, 10, 12]

    def test_promotion_houses(self):
        assert C.PROMOTION_HOUSES == [2, 6, 10, 11]
