"""MODULE 2 / PART B — Parashara / Tajika contextual engine."""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from .constants import SIGN_LORDS, SIGNS, TAJIKA_ASPECTS, TAJIKA_ORB
from .models import Chart, Planet

# Exaltation / debilitation signs (sign index 0=Aries … 11=Pisces)
EXALTATION = {
    "Sun": 0, "Moon": 1, "Mars": 9, "Mercury": 5,
    "Jupiter": 3, "Venus": 11, "Saturn": 6,
}
DEBILITATION = {
    "Sun": 6, "Moon": 7, "Mars": 3, "Mercury": 11,
    "Jupiter": 9, "Venus": 5, "Saturn": 0,
}
OWN_SIGNS = {
    "Sun": {4},
    "Moon": {3},
    "Mars": {0, 7},
    "Mercury": {2, 5},
    "Jupiter": {8, 11},
    "Venus": {1, 6},
    "Saturn": {9, 10},
}


def _angle_diff(a: float, b: float) -> float:
    """Smallest signed separation a→b in (-180, 180]."""
    return (b - a + 180.0) % 360.0 - 180.0


def _circular_distance(a: float, b: float) -> float:
    return abs(_angle_diff(a, b))


class Parashara_Engine:
    """Secondary context: karaka dignity, Tajika yogas, Arudha Lagna."""

    def __init__(self, chart: Chart):
        self.chart = chart

    def dignity(self, planet: Optional[Planet]) -> Dict[str, Any]:
        if not planet:
            return {"status": "missing"}
        si = planet.sign_index
        d9 = planet.d9_sign_index
        status = "neutral"
        if planet.name in EXALTATION and si == EXALTATION[planet.name]:
            status = "exalted"
        elif planet.name in DEBILITATION and si == DEBILITATION[planet.name]:
            status = "debilitated"
        elif planet.name in OWN_SIGNS and si in OWN_SIGNS[planet.name]:
            status = "own_sign"

        d9_status = "neutral"
        if d9 is not None and planet.name in EXALTATION:
            if d9 == EXALTATION[planet.name]:
                d9_status = "exalted"
            elif d9 == DEBILITATION.get(planet.name):
                d9_status = "debilitated"
            elif d9 in OWN_SIGNS.get(planet.name, set()):
                d9_status = "own_sign"

        return {
            "planet": planet.name,
            "d1_sign": planet.sign,
            "d1_status": status,
            "d9_sign": planet.d9_sign,
            "d9_status": d9_status,
            "retrograde": planet.retrograde,
        }

    def karaka_dignity(self, karaka_name: str) -> Dict[str, Any]:
        return self.dignity(self.chart.planet(karaka_name))

    def lagna_lord(self) -> Optional[Planet]:
        lord_name = self.chart.ascendant.sign_lord
        return self.chart.planet(lord_name)

    def karya_lord(self, primary_house: int) -> Optional[Planet]:
        h = self.chart.house(primary_house)
        if not h:
            return None
        return self.chart.planet(h.sign_lord)

    # ------------------------------------------------------------------ #
    # Tajika yogas
    # ------------------------------------------------------------------ #
    def _best_aspect(self, a: float, b: float) -> Optional[Tuple[str, float, float]]:
        """Return (aspect_name, target_angle, residual) if within orb."""
        sep = _circular_distance(a, b)
        best = None
        for name, ang in TAJIKA_ASPECTS.items():
            residual = abs(sep - ang)
            if residual <= TAJIKA_ORB:
                if best is None or residual < best[2]:
                    best = (name, float(ang), residual)
        return best

    def _is_applying(self, p1: Planet, p2: Planet, target_angle: float) -> bool:
        """
        Applying if faster planet is moving toward the aspect exactitude.
        Approximate using signed longitude speeds.
        """
        s1 = p1.speed if p1.speed is not None else 0.0
        s2 = p2.speed if p2.speed is not None else 0.0
        # Relative motion of p1 vs p2
        rel = s1 - s2
        signed = _angle_diff(p1.longitude, p2.longitude)
        # Distance from exact aspect along the circle
        # If signed separation is approaching ±target, applying when relative closes gap.
        cur = abs(signed)
        # Project a small step
        step = 0.1  # degrees of relative motion unit
        future_signed = _angle_diff(p1.longitude + rel * step, p2.longitude)
        future = abs(abs(future_signed) - target_angle)
        now = abs(cur - target_angle)
        return future < now

    def tajika_yogas(self, primary_house: int) -> Dict[str, Any]:
        q = self.lagna_lord()
        k = self.karya_lord(primary_house)
        moon = self.chart.planet("Moon")
        out: Dict[str, Any] = {
            "querist_lord": q.name if q else None,
            "karya_lord": k.name if k else None,
            "ithasala": False,
            "esharpha": False,
            "kamboola": False,
            "aspect": None,
            "notes": [],
        }
        if not q or not k:
            out["notes"].append("Could not resolve Lagna lord or Karya lord.")
            return out

        aspect = self._best_aspect(q.longitude, k.longitude)
        if not aspect:
            out["notes"].append(
                f"No Tajika aspect within {TAJIKA_ORB}° between {q.name} and {k.name}."
            )
            return out

        name, ang, residual = aspect
        applying = self._is_applying(q, k, ang)
        out["aspect"] = {
            "type": name,
            "orb": round(residual, 3),
            "applying": applying,
            "querist_longitude": q.longitude,
            "karya_longitude": k.longitude,
        }

        if applying:
            out["ithasala"] = True
            out["notes"].append(
                f"Ithasala Yoga: {q.name} applies to {k.name} by {name} (orb {residual:.2f}°) — success tendency."
            )
        else:
            out["esharpha"] = True
            out["notes"].append(
                f"Esharpha Yoga: {q.name} separates from {k.name} by {name} (orb {residual:.2f}°) — failure / past matter."
            )

        # Kamboola: Moon bridges by applying to both within orb
        if moon:
            a1 = self._best_aspect(moon.longitude, q.longitude)
            a2 = self._best_aspect(moon.longitude, k.longitude)
            if a1 and a2:
                apply1 = self._is_applying(moon, q, a1[1])
                apply2 = self._is_applying(moon, k, a2[1])
                if apply1 or apply2:
                    out["kamboola"] = True
                    out["notes"].append(
                        f"Kamboola Yoga: Moon bridges {q.name} and {k.name} "
                        f"({a1[0]} / {a2[0]}) — lunar support for the event."
                    )
        return out

    # ------------------------------------------------------------------ #
    # Arudha Lagna
    # ------------------------------------------------------------------ #
    def arudha_lagna(self) -> Dict[str, Any]:
        """
        Classical Arudha Lagna:
        Count as many signs from the Lagna lord as the lord is from Lagna.
        Exceptions: if AL falls in Lagna or 7th from Lagna, take 10th from that.
        """
        asc_si = self.chart.ascendant.sign_index
        lord_name = self.chart.ascendant.sign_lord
        lord = self.chart.planet(lord_name)
        if not lord:
            return {"sign": None, "sign_index": None, "note": "Lagna lord not found."}

        offset = (lord.sign_index - asc_si) % 12
        al_si = (lord.sign_index + offset) % 12
        # Exception
        if al_si == asc_si or al_si == (asc_si + 6) % 12:
            al_si = (al_si + 9) % 12  # 10th from the computed AL

        perception_house = ((al_si - asc_si) % 12) + 1
        return {
            "sign": SIGNS[al_si],
            "sign_index": al_si,
            "lord": SIGN_LORDS[al_si],
            "lagna_lord": lord_name,
            "lagna_lord_sign": lord.sign,
            "house_from_lagna": perception_house,
            "note": (
                f"Arudha Lagna in {SIGNS[al_si]} (house {perception_house} from Lagna) — "
                "contrast of perceived situation versus reality of the Prashna Lagna."
            ),
        }

    def evaluate(self, primary_house: int, karaka_name: str) -> Dict[str, Any]:
        karaka = self.karaka_dignity(karaka_name)
        tajika = self.tajika_yogas(primary_house)
        arudha = self.arudha_lagna()
        return {
            "karaka_dignity": karaka,
            "tajika": tajika,
            "arudha_lagna": arudha,
        }
