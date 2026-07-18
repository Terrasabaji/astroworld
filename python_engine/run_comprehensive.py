#!/usr/bin/env python3
"""Comprehensive native status — JSON stdin → JSON stdout."""
import datetime as dt
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import venv_bootstrap
venv_bootstrap.ensure_project_venv()

from comprehensive_status import build_comprehensive_report

CALC = os.path.join(os.path.dirname(__file__), "calculate.py")
ADVISER = os.path.join(os.path.dirname(__file__), "run_adviser.py")


def run_script(script: str, payload: dict) -> dict:
    proc = subprocess.run(
        [sys.executable, script],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
    )
    if proc.stdout:
        try:
            return json.loads(proc.stdout)
        except json.JSONDecodeError:
            pass
    raise RuntimeError(proc.stderr or proc.stdout or f"Script failed: {script}")


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
        "ayanamsa": p.get("ayanamsa", "lahiri"),
        "house_system": p.get("house_system", "P"),
    }


def cast_moment_payload(p: dict, birth: dict) -> dict:
    cm = p.get("cast_moment") or {}
    now = dt.datetime.now()
    return {
        "year": int(cm.get("year", now.year)),
        "month": int(cm.get("month", now.month)),
        "day": int(cm.get("day", now.day)),
        "hour": int(cm.get("hour", now.hour)),
        "minute": int(cm.get("minute", now.minute)),
        "second": int(cm.get("second", 0)),
        "tz_offset": cm.get("tz_offset", birth.get("tz_offset")),
        "tz_name": cm.get("tz_name", birth.get("tz_name")),
        "latitude": float(cm.get("latitude", birth["latitude"])),
        "longitude": float(cm.get("longitude", birth["longitude"])),
        "ayanamsa": "krishnamurti",
        "house_system": "P",
    }


def adviser_payload(p: dict, birth: dict) -> dict:
    return {
        "birth": {
            "name": p.get("name", "Native"),
            "year": birth["year"],
            "month": birth["month"],
            "day": birth["day"],
            "time": f"{birth['hour']:02d}:{birth['minute']:02d}",
            "latitude": birth["latitude"],
            "longitude": birth["longitude"],
            "tz": birth.get("tz_offset", 5.5),
            "place": birth.get("place", ""),
        }
    }


def main():
    try:
        p = json.loads(sys.stdin.read())
        birth = birth_payload(p)
        cast = cast_moment_payload(p, birth)

        natal_req = {**birth, "transit": cast}
        natal = run_script(CALC, natal_req)
        if natal.get("error"):
            sys.stdout.write(json.dumps(natal))
            sys.exit(1)

        mooka = run_script(CALC, cast)
        if mooka.get("error"):
            mooka = None

        adviser = None
        try:
            adviser = run_script(ADVISER, adviser_payload(p, birth))
            if adviser.get("error"):
                adviser = None
        except Exception:
            adviser = None

        report = build_comprehensive_report(
            natal,
            transit=natal.get("transit"),
            mooka_chart=mooka,
            adviser=adviser,
            native_name=p.get("name", "Native"),
        )
        sys.stdout.write(json.dumps(report))
    except Exception as e:
        sys.stdout.write(json.dumps({"error": str(e), "type": type(e).__name__}))
        sys.exit(1)


if __name__ == "__main__":
    main()
