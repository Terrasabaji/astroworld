#!/usr/bin/env python3
"""Astro World Yoga & Dosha analysis — JSON stdin → JSON stdout."""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from yoga_dosha_analysis import analyze_chart

CALC = os.path.join(os.path.dirname(__file__), "calculate.py")


def run_calc(payload: dict) -> dict:
    proc = subprocess.run(
        [sys.executable, CALC],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
    )
    if proc.stdout:
        try:
            return json.loads(proc.stdout)
        except json.JSONDecodeError:
            pass
    raise RuntimeError(proc.stderr or proc.stdout or "calculate.py failed")


def birth_payload(p: dict) -> dict:
    return {
        "year": int(p["year"]),
        "month": int(p["month"]),
        "day": int(p["day"]),
        "hour": int(p["hour"]),
        "minute": int(p["minute"]),
        "second": int(p.get("second", 0)),
        "tz_offset": p.get("tz_offset"),
        "tz_name": p.get("tz_name"),
        "latitude": float(p["latitude"]),
        "longitude": float(p["longitude"]),
        "place": p.get("place"),
        "name": p.get("name"),
        "ayanamsa": p.get("ayanamsa", "lahiri"),
        "house_system": p.get("house_system", "P"),
    }


def main():
    try:
        p = json.loads(sys.stdin.read())
        chart = run_calc(birth_payload(p))
        if chart.get("error"):
            print(json.dumps(chart))
            return
        report = analyze_chart(chart, native_name=p.get("name"))
        report["chart_meta"] = {
            "ayanamsa": chart["input"].get("ayanamsa"),
            "place": chart["input"].get("place"),
        }
        print(json.dumps(report))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
