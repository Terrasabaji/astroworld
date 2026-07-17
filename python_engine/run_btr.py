#!/usr/bin/env python3
"""BTR runner — Flask-compatible JSON API for rectify and chart."""
import sys
import os
import json
import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from btr.api import chart_report, make_birth_moment, rectify
from btr.core.constants import Ayanamsa, HouseSystem
from btr.core.ephemeris import Ephemeris
from btr.core.timeutil import GeoLocation, julian_day_from_local
from btr.kp.ruling_planets import compute_ruling_planets
from btr.rectification.context import DEFAULT_METHOD_WEIGHTS, RectificationContext
from btr.rectification.events import EventType, LifeEvent


def _birth_from_payload(p):
    b = p["birth"]
    if "datetime" in b:
        dt = datetime.datetime.fromisoformat(b["datetime"])
        return make_birth_moment(
            dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second,
            float(b["tz"]), float(b["latitude"]), float(b["longitude"]),
            b.get("place", ""),
        )
    return make_birth_moment(
        int(b["year"]), int(b["month"]), int(b["day"]),
        int(b["hour"]), int(b["minute"]), float(b.get("second", 0)),
        float(b["tz"]), float(b["latitude"]), float(b["longitude"]),
        b.get("place", ""),
    )


def _context_from_payload(p):
    birth = p["birth"]
    tz = float(birth["tz"])
    events = []
    for ev in p.get("events", []):
        if not ev.get("date"):
            continue
        events.append(LifeEvent(
            event_type=EventType(ev["type"]),
            event_date=datetime.date.fromisoformat(ev["date"]),
            description=ev.get("description", ""),
            weight=float(ev.get("weight", 1.0)),
            houses=ev.get("houses", []),
        ))

    consult_rp = None
    c = p.get("consultation")
    if c:
        if isinstance(c, str) and c:
            cdt = datetime.datetime.fromisoformat(c)
            c_tz = tz
            loc_lat = float(birth["latitude"])
            loc_lon = float(birth["longitude"])
        elif c.get("datetime"):
            cdt = datetime.datetime.fromisoformat(c["datetime"])
            c_tz = float(c.get("tz") or tz)
            loc_lat = float(c.get("latitude") or birth["latitude"])
            loc_lon = float(c.get("longitude") or birth["longitude"])
        else:
            cdt = None
        if cdt:
            loc = GeoLocation(loc_lat, loc_lon, name=c.get("place", "") if isinstance(c, dict) else "")
            cjd = julian_day_from_local(
                cdt.year, cdt.month, cdt.day, cdt.hour, cdt.minute, 0.0, c_tz,
            )
            eph = Ephemeris(Ayanamsa.KRISHNAMURTI, HouseSystem.PLACIDUS)
            consult_rp = compute_ruling_planets(eph, cjd, loc)

    signs = [s.strip() for s in p.get("expected_lagna_signs", []) if s and str(s).strip()]
    weights = dict(DEFAULT_METHOD_WEIGHTS)
    weights.update(p.get("method_weights", {}))

    return RectificationContext(
        birth_tz=tz,
        events=events,
        consultation_ruling_planets=consult_rp,
        expected_lagna_signs=signs,
        method_weights=weights,
    )


def _candidate_to_dict(c):
    return {
        "time": c.time_label,
        "score": round(c.total_score, 1),
        "methods": [
            {
                "name": ms.name,
                "system": ms.system,
                "score": round(ms.score * 100, 1),
                "weight": ms.weight,
                "detail": ms.detail,
                "per_event": ms.per_event,
            }
            for ms in c.method_scores if ms.weight > 0
        ],
    }


def run_rectify(p):
    moment = _birth_from_payload(p)
    ctx = _context_from_payload(p)
    scan = p.get("scan", {})
    report = rectify(
        moment, ctx,
        window_minutes=float(scan.get("window", 30)),
        coarse_step_seconds=float(scan.get("coarse", 240)),
        fine_step_seconds=float(scan.get("fine", 15)),
    )
    top = int(scan.get("top", 5))
    return {
        "given_time": moment.label(),
        "best_time": report.best.time_label if report.best else None,
        "best_score": round(report.best.total_score, 1) if report.best else 0,
        "best": _candidate_to_dict(report.best) if report.best else None,
        "candidates": [_candidate_to_dict(c) for c in report.top(top)],
        "report_text": report.render(top),
        "base_time": moment.local_datetime().isoformat(),
        "window_minutes": float(scan.get("window", 30)),
    }


def run_chart(p):
    moment = _birth_from_payload(p)
    ayan = Ayanamsa.KRISHNAMURTI if p.get("ayanamsa", "kp") == "kp" else Ayanamsa.LAHIRI
    return {"report": chart_report(moment, ayanamsa=ayan)}


def main():
    try:
        p = json.loads(sys.stdin.read())
        op = p.get("op", "rectify")
        if op == "chart":
            out = run_chart(p)
        else:
            out = run_rectify(p)
        sys.stdout.write(json.dumps(out))
    except Exception as e:
        sys.stdout.write(json.dumps({"error": str(e), "type": type(e).__name__}))
        sys.exit(1)


if __name__ == "__main__":
    main()
