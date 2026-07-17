#!/usr/bin/env python3
"""Lightweight smoke tests for the Prashna package."""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from prashna.horary_table import HORARY_COUNT, horary_to_ascendant
from prashna.nlp import map_query_to_houses
from prashna import run_prashna_analysis


def test_horary_table():
    assert HORARY_COUNT == 249
    h1 = horary_to_ascendant(1)
    assert h1 and abs(h1["degree"] - 0.3888888888888889) < 1e-6
    assert horary_to_ascendant(0) is None
    assert horary_to_ascendant(250) is None


def test_nlp_marriage():
    m = map_query_to_houses("Will I get married this year?")
    assert m["category"] == "marriage"
    assert m["primary_house"] == 7
    assert "married" in m["keywords"]


def test_manual_and_mooka():
    base = {
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
    manual = run_prashna_analysis({
        **base,
        "mode": "manual",
        "question_text": "Will I get the job?",
        "horary_number": 12,
    })
    assert manual["parsed_query"]["category"] == "career"
    assert isinstance(manual["the_promise_result"], bool)
    assert manual["timing_prediction"]
    assert manual["astrological_justification"]
    assert manual["chart"]["horary_number"] == 12

    mooka = run_prashna_analysis({**base, "mode": "mooka"})
    assert mooka["deduced_query"]
    assert mooka["mooka"]["candidates"]


if __name__ == "__main__":
    test_horary_table()
    test_nlp_marriage()
    test_manual_and_mooka()
    print("prashna tests: 3 passed")
