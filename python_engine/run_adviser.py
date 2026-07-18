#!/usr/bin/env python3
"""Education & Career Adviser runner — JSON stdin → JSON stdout."""
import sys
import os
import json
import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import venv_bootstrap
venv_bootstrap.ensure_project_venv()

from astro_adviser.adviser import BirthData, build_report, report_to_dict


def main():
    try:
        p = json.loads(sys.stdin.read())
        b = p["birth"]
        dob = datetime.date(int(b["year"]), int(b["month"]), int(b["day"]))
        parts = str(b.get("time", "12:00")).split(":")
        tob = datetime.time(int(parts[0]), int(parts[1]) if len(parts) > 1 else 0)

        birth = BirthData(
            name=b.get("name", "Native"),
            date=dob,
            time=tob,
            latitude=float(b["latitude"]),
            longitude=float(b["longitude"]),
            tz_offset_hours=float(b["tz"]),
            place=b.get("place", ""),
        )
        rep = build_report(birth)
        sys.stdout.write(json.dumps(report_to_dict(rep)))
    except Exception as e:
        sys.stdout.write(json.dumps({"error": str(e), "type": type(e).__name__}))
        sys.exit(1)


if __name__ == "__main__":
    main()
