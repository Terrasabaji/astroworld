"""Cast KP Placidus charts via Swiss Ephemeris for Prashna judgement."""

from __future__ import annotations

import datetime
import json
import os
import subprocess
import sys
from typing import Any, Dict, List, Optional

import swisseph as swe

from calculate import (
    EPHE_PATH,
    _HAS_SWIEPH_DATA,
    body_row,
    house_of_planet,
    kp_cuspal_interlink,
    kp_significators,
)
from .horary_table import horary_to_ascendant
from .models import Chart, House, Planet

CALC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "calculate.py")


def _run_calculate(payload: dict) -> dict:
    proc = subprocess.run(
        [sys.executable, CALC],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
    )
    if proc.stdout:
        try:
            data = json.loads(proc.stdout)
        except json.JSONDecodeError as e:
            raise RuntimeError(proc.stderr or f"calculate.py invalid JSON: {e}") from e
        if data.get("error"):
            raise RuntimeError(data["error"])
        return data
    raise RuntimeError(proc.stderr or "calculate.py failed with empty stdout")


def _norm360(x: float) -> float:
    return x % 360.0


def _apply_topo(lat: float, lon: float, altitude: float = 0.0) -> None:
    """Set topocentric observer for the judgement location."""
    try:
        swe.set_topo(float(lon), float(lat), float(altitude))
    except Exception:
        pass


def _rebuild_after_asc_shift(raw: dict, new_asc_lon: float) -> dict:
    """Rotate Placidus cusp arcs so cusp 1 matches horary ascendant."""
    old_asc = float(raw["ascendant"]["longitude"])
    delta = _norm360(new_asc_lon - old_asc)
    old_cusps = [float(h["longitude"]) for h in raw["houses"]]
    new_cusps = [_norm360(c + delta) for c in old_cusps]

    asc = body_row("Ascendant", new_asc_lon)
    houses = []
    for i, c in enumerate(new_cusps, start=1):
        r = body_row(f"House {i}", c)
        r["house"] = i
        houses.append(r)

    planets = list(raw["planets"])
    kp_sigs, ownership = kp_significators(planets, asc, new_cusps)
    interlink = kp_cuspal_interlink(houses, new_cusps)

    out = dict(raw)
    out["ascendant"] = asc
    out["houses"] = houses
    out["kp_significators"] = kp_sigs
    out["kp_cuspal_interlink"] = interlink
    out["house_ownership"] = ownership
    return out


def _to_chart(raw: dict, horary_number: Optional[int] = None, horary_meta: Optional[dict] = None) -> Chart:
    cusps = [float(h["longitude"]) for h in raw["houses"]]
    planets = [
        Planet.from_row(p, house_of_planet(p["longitude"], cusps))
        for p in raw["planets"]
    ]
    houses = [House.from_row(h) for h in raw["houses"]]
    asc_house = 1
    asc = Planet.from_row(raw["ascendant"], asc_house)
    return Chart(
        ascendant=asc,
        planets=planets,
        houses=houses,
        cusp_longitudes=cusps,
        significators=raw.get("kp_significators") or {},
        dasha=raw.get("dasha") or {},
        input=raw.get("input") or {},
        jd_ut=float((raw.get("input") or {}).get("jd_ut") or 0.0),
        horary_number=horary_number,
        horary_ascendant=horary_meta,
        raw=raw,
    )


def cast_prashna_chart(input_data: Dict[str, Any]) -> Chart:
    """
    Cast a KP (Krishnamurti) + Placidus chart for the judgement moment.

    Optional horary_number (1–249) shifts the Ascendant / cusps to the
    corresponding KP sub-lord span while keeping planetary positions for the
    given timestamp.
    """
    lat = float(input_data["latitude"])
    lon = float(input_data["longitude"])
    altitude = float(input_data.get("altitude", 0.0) or 0.0)
    _apply_topo(lat, lon, altitude)

    if _HAS_SWIEPH_DATA:
        swe.set_ephe_path(EPHE_PATH)

    payload = {
        "year": int(input_data["year"]),
        "month": int(input_data["month"]),
        "day": int(input_data["day"]),
        "hour": int(input_data["hour"]),
        "minute": int(input_data["minute"]),
        "second": int(input_data.get("second", 0) or 0),
        "latitude": lat,
        "longitude": lon,
        "tz_offset": input_data.get("tz_offset"),
        "tz_name": input_data.get("tz_name"),
        "place": input_data.get("place"),
        "name": input_data.get("name") or "Querent",
        "ayanamsa": "krishnamurti",
        "house_system": "P",
    }

    raw = _run_calculate(payload)
    horary_number = input_data.get("horary_number")
    horary_meta = None

    if horary_number not in (None, "", 0, "0"):
        n = int(horary_number)
        ha = horary_to_ascendant(n)
        if not ha:
            raise ValueError("horary_number must be an integer from 1 to 249")
        raw = _rebuild_after_asc_shift(raw, ha["degree"])
        horary_meta = ha
        horary_number = n
        raw["input"]["horary_number"] = n
        raw["input"]["horary_ascendant"] = ha["degree"]
    else:
        horary_number = None

    return _to_chart(raw, horary_number=horary_number, horary_meta=horary_meta)


def weekday_lord_from_input(input_data: Dict[str, Any]) -> str:
    from .constants import DAY_LORDS

    y = int(input_data["year"])
    mo = int(input_data["month"])
    d = int(input_data["day"])
    # Monday=0 … Sunday=6
    wd = datetime.date(y, mo, d).weekday()
    return DAY_LORDS[wd]
