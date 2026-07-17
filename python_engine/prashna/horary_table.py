"""KP Horary numbers 1–249 (star-sub spans split at sign boundaries)."""

from __future__ import annotations

from typing import Dict, List, Optional

from calculate import NAKSHATRAS, SIGN_LORDS, VIM_ORDER, VIM_YEARS, TOTAL_VIM, NAK_SPAN

EPS = 1e-7


def _vimshottari_spans(nak_start: float, start_lord: str, span: float) -> List[dict]:
    start_idx = VIM_ORDER.index(start_lord)
    cur = nak_start
    out = []
    for i in range(9):
        lord = VIM_ORDER[(start_idx + i) % 9]
        part = span * (VIM_YEARS[lord] / TOTAL_VIM)
        out.append({"start": cur, "end": cur + part, "lord": lord})
        cur += part
    if out:
        out[-1]["end"] = nak_start + span
    return out


def build_horary_table() -> List[dict]:
    """Build the deterministic KP horary table (typically 249 rows)."""
    base = []
    for nak in range(27):
        nak_start = nak * NAK_SPAN
        star = NAKSHATRAS[nak][1]
        base.extend(_vimshottari_spans(nak_start, star, NAK_SPAN))

    table: List[dict] = []
    number = 1
    for seg in base:
        star = NAKSHATRAS[int(seg["start"] // NAK_SPAN) % 27][1]
        sub = seg["lord"]
        seg_start = seg["start"]
        seg_end = seg["end"]
        boundary = (int(seg_start // 30) + 1) * 30.0
        while boundary < seg_end - EPS:
            if boundary > seg_start + EPS:
                mid = (seg_start + boundary) / 2.0
                table.append({
                    "number": number,
                    "start_deg": seg_start,
                    "end_deg": boundary,
                    "sign_lord": SIGN_LORDS[int(mid // 30) % 12],
                    "star_lord": star,
                    "sub_lord": sub,
                })
                number += 1
            seg_start = boundary
            boundary += 30.0
        if seg_end > seg_start + EPS:
            mid = (seg_start + seg_end) / 2.0
            table.append({
                "number": number,
                "start_deg": seg_start,
                "end_deg": seg_end,
                "sign_lord": SIGN_LORDS[int(mid // 30) % 12],
                "star_lord": star,
                "sub_lord": sub,
            })
            number += 1
    return table


HORARY_TABLE: List[dict] = build_horary_table()
HORARY_COUNT = len(HORARY_TABLE)


def horary_to_ascendant(n: int) -> Optional[Dict]:
    """Map integer horary number 1–249 to ascendant midpoint details."""
    if not isinstance(n, int) or n < 1 or n > len(HORARY_TABLE):
        return None
    e = HORARY_TABLE[n - 1]
    degree = (e["start_deg"] + e["end_deg"]) / 2.0
    return {
        "number": e["number"],
        "degree": degree % 360.0,
        "start_deg": e["start_deg"],
        "end_deg": e["end_deg"],
        "sign_lord": e["sign_lord"],
        "star_lord": e["star_lord"],
        "sub_lord": e["sub_lord"],
    }
