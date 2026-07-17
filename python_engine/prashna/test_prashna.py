#!/usr/bin/env python3
"""Smoke tests — only Mooka and Manual Prashna are valid."""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from prashna.horary_table import HORARY_COUNT, horary_to_ascendant
from prashna.nlp import map_query_to_houses
from prashna import run_prashna_analysis


BASE = {
    "year": 2026,
    "month": 7,
    "day": 17,
    "hour": 18,
    "minute": 15,
    "second": 0,
    "latitude": 13.68833,
    "longitude": 75.24556,
    "tz_offset": 5.5,
}


def test_horary_table():
    assert HORARY_COUNT == 249
    assert horary_to_ascendant(1) is not None
    assert horary_to_ascendant(250) is None


def test_nlp_marriage():
    m = map_query_to_houses("Will I get married this year?")
    assert m["category"] == "marriage"
    assert m["primary_house"] == 7


def test_rejects_third_mode():
    try:
        run_prashna_analysis({**BASE, "mode": "instant", "question_text": "job?"})
        raise AssertionError("instant mode must be rejected")
    except ValueError as e:
        assert "only two types" in str(e)


def test_mooka_forbids_question_text():
    try:
        run_prashna_analysis({
            **BASE,
            "mode": "mooka",
            "question_text": "Will I marry?",
        })
        raise AssertionError("mooka must reject question_text")
    except ValueError as e:
        assert "must not include a question" in str(e)


def test_manual_requires_question():
    try:
        run_prashna_analysis({**BASE, "mode": "manual"})
        raise AssertionError("manual without question must fail")
    except ValueError as e:
        assert "requires question_text" in str(e)


def test_manual_and_mooka_outputs():
    manual = run_prashna_analysis({
        **BASE,
        "mode": "manual",
        "question_text": "Will I get the job?",
        "horary_number": 12,
    })
    assert manual["prashna_type"] == "Manual Prashna"
    assert manual["parsed_query"]["category"] == "career"
    assert manual["deduced_query"] is None
    assert isinstance(manual["the_promise_result"], bool)
    assert manual["timing_prediction"]
    assert manual["astrological_justification"]
    assert "Cuspal Sub Lord" in manual["astrological_justification"]
    assert manual["chart"]["horary_number"] == 12

    mooka = run_prashna_analysis({**BASE, "mode": "mooka"})
    assert mooka["prashna_type"] == "Mooka Prashna"
    assert mooka["parsed_query"] is None
    assert mooka["deduced_query"]
    assert isinstance(mooka["the_promise_result"], bool)
    assert mooka["timing_prediction"]
    assert mooka["astrological_justification"]


if __name__ == "__main__":
    test_horary_table()
    test_nlp_marriage()
    test_rejects_third_mode()
    test_mooka_forbids_question_text()
    test_manual_requires_question()
    test_manual_and_mooka_outputs()
    print("prashna tests: 6 passed")
