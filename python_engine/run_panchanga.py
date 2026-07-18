#!/usr/bin/env python3
"""Astro World Panchanga — compute current panchanga for a location. JSON stdin -> JSON stdout."""
import json
import sys
import datetime

import venv_bootstrap
venv_bootstrap.ensure_project_venv()

import swisseph as swe

import calculate as calc
from muhurta_engine import compute_panchanga_moment


def main():
    try:
        payload = json.loads(sys.stdin.read())
        lat = float(payload.get('latitude', 12.9716))
        lon = float(payload.get('longitude', 77.5946))
        tz_offset = float(payload.get('tz_offset', 5.5))

        # Set ayanamsa (Lahiri default)
        swe.set_sid_mode(calc.AYANAMSA_MAP.get('lahiri', swe.SIDM_LAHIRI), 0, 0)

        # Compute current JD in UT
        now_utc = datetime.datetime.now(datetime.timezone.utc)
        jd_ut = swe.julday(
            now_utc.year, now_utc.month, now_utc.day,
            now_utc.hour + now_utc.minute / 60.0 + now_utc.second / 3600.0
        )

        # Build calc_flag
        calc_flag = swe.FLG_SIDEREAL | swe.FLG_TRUEPOS
        if calc._HAS_SWIEPH_DATA:
            calc_flag |= swe.FLG_SWIEPH
        else:
            calc_flag |= swe.FLG_MOSEPH

        result = compute_panchanga_moment(jd_ut, lat, lon, tz_offset, calc_flag)

        # Extract relevant fields for the scrolling bar
        tithi = result.get('tithi', {})
        nakshatra = result.get('nakshatra', {})
        yoga = result.get('yoga', {})
        karana = result.get('karana', {})

        tithi_display = tithi.get('tithi_name', '')
        if tithi.get('paksha'):
            tithi_display = f"{tithi['paksha']} {tithi_display}"

        output = {
            'vara': result.get('astro_weekday', ''),
            'tithi': tithi_display,
            'nakshatra': nakshatra.get('nakshatra', '') if isinstance(nakshatra, dict) else str(nakshatra),
            'yoga': yoga.get('yoga', '') if isinstance(yoga, dict) else str(yoga),
            'karana': karana.get('karana', '') if isinstance(karana, dict) else str(karana),
            'sunrise': result.get('sunrise_local', ''),
            'sunset': result.get('sunset_local', ''),
        }

        print(json.dumps(output))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)


if __name__ == '__main__':
    main()
