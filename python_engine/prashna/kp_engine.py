"""PART A — Krishnamurti Paddhati engine (Promise + Ruling Planets + Timing).

Rules implemented exactly as specified for Prashna:

1. 4-fold significators — Level 1 star-of-occupant, Level 2 occupant,
   Level 3 star-of-lord, Level 4 lord.
2. Promise (Sub Lord theory) — Cuspal Sub Lord of the primary house; its
   Star Lord decides Yes/No from favorable vs denial (12th-from-primary)
   significations.
3. Nodes — Rahu/Ketu proxy conjoined, aspecting, star-lord, and sign-lord planets.
4. Retrogression — retrograde CSL or CSL-star-lord → Delayed/Denied until direct.
5. Ruling Planets — Lagna Star/Sign Lord, Moon Star/Sign Lord, Day Lord;
   filter out retrograde planets for active RPs used in DBA timing.
"""

from __future__ import annotations

import datetime
from typing import Any, Dict, List, Optional, Set

from .chart_builder import weekday_lord_from_input
from .models import Chart


def _twelfth_from(house: int) -> int:
    return ((house - 2) % 12) + 1


class KP_Engine:
    """Primary Yes/No + timing logic using Cuspal Sub Lord theory."""

    def __init__(self, chart: Chart, input_data: Optional[dict] = None):
        self.chart = chart
        self.input_data = input_data or chart.input
        self._node_proxy_cache: Dict[str, List[str]] = {}

    # ------------------------------------------------------------------ #
    # 4-fold significators
    # ------------------------------------------------------------------ #
    def four_fold_significators(self, planet_name: str) -> Dict[str, Any]:
        """
        Grade planet strength:
          Level 1 — Star of occupant (A)
          Level 2 — Occupant (B)
          Level 3 — Star of lord (C)
          Level 4 — Lord (D)
        """
        block = dict(self.chart.significators.get(planet_name) or {})
        if planet_name in ("Rahu", "Ketu"):
            proxies = self.node_proxies(planet_name)
            houses: Set[int] = set(block.get("all_signified_houses") or [])
            for proxy in proxies:
                pb = self.chart.significators.get(proxy) or {}
                houses.update(pb.get("all_signified_houses") or [])
            block["proxy_planets"] = proxies
            block["all_signified_houses"] = sorted(houses)
        block["planet"] = planet_name
        block["levels"] = {
            "level_1_star_of_occupant": list(block.get("level_A_star_lord_occupies") or []),
            "level_2_occupant": list(block.get("level_B_planet_occupies") or []),
            "level_3_star_of_lord": list(block.get("level_C_star_lord_owns") or []),
            "level_4_lord": list(block.get("level_D_planet_owns") or []),
        }
        return block

    def houses_of(self, planet_name: str) -> List[int]:
        return list(self.four_fold_significators(planet_name).get("all_signified_houses") or [])

    # ------------------------------------------------------------------ #
    # Nodes as proxies
    # ------------------------------------------------------------------ #
    def node_proxies(self, node_name: str) -> List[str]:
        """Rahu/Ketu act as agents for (1) conjunction (2) aspect (3) star lord (4) sign lord."""
        if node_name in self._node_proxy_cache:
            return self._node_proxy_cache[node_name]

        node = self.chart.planet(node_name)
        if not node:
            return []

        proxies: List[str] = []
        if node.sign_lord:
            proxies.append(node.sign_lord)
        if node.star_lord and node.star_lord not in proxies:
            proxies.append(node.star_lord)

        for p in self.chart.planets:
            if p.name in ("Rahu", "Ketu", node_name):
                continue
            sep = abs((p.longitude - node.longitude + 180) % 360 - 180)
            if sep <= 3.5 and p.name not in proxies:
                proxies.append(p.name)

        aspect_map = {
            "Mars": {3, 6, 7},
            "Jupiter": {4, 6, 8},
            "Saturn": {2, 6, 9},
        }
        for p in self.chart.planets:
            if p.name in ("Rahu", "Ketu", node_name):
                continue
            span = (int(p.sign_index) - int(node.sign_index)) % 12
            special = aspect_map.get(p.name, {6})
            if span in special and p.name not in proxies:
                proxies.append(p.name)

        self._node_proxy_cache[node_name] = proxies
        return proxies

    def _is_retrograde(self, planet_name: Optional[str]) -> bool:
        if not planet_name:
            return False
        # Nodes are always retrograde by convention; do not treat as delay flag alone
        if planet_name in ("Rahu", "Ketu", "Sun", "Moon"):
            return False
        p = self.chart.planet(planet_name)
        return bool(p and p.retrograde)

    # ------------------------------------------------------------------ #
    # Promise — CSL Sub Lord theory (Star Lord decides)
    # ------------------------------------------------------------------ #
    def evaluate_promise(
        self,
        primary_house: int,
        favorable_houses: List[int],
        denial_houses: List[int],
    ) -> Dict[str, Any]:
        """
        Fetch CSL of the primary house. Inspect the CSL's Star Lord
        significations:
          - favorable houses → Promise True
          - 12th-from-primary / denial set (e.g. 1,6,10 for marriage) → False
        """
        csl = self.chart.cuspal_sub_lord(primary_house)
        if not csl:
            return {
                "the_promise_result": False,
                "status": "unknown",
                "cuspal_sub_lord": None,
                "csl_star_lord": None,
                "reason": f"No cuspal sub-lord found for house {primary_house}.",
            }

        csl_planet = self.chart.planet(csl)
        star_lord = csl_planet.star_lord if csl_planet else None
        if not star_lord:
            # fall back to significator star_lord field
            star_lord = (self.chart.significators.get(csl) or {}).get("star_lord")

        star_sig = self.four_fold_significators(star_lord) if star_lord else {}
        star_houses = set(star_sig.get("all_signified_houses") or [])

        twelfth = _twelfth_from(primary_house)
        # Denial always includes 12th from primary; category may add more (e.g. 1,6,10 for marriage)
        denial = set(denial_houses) | {twelfth}
        favorable = set(favorable_houses) | {primary_house}

        fav_hits = sorted(star_houses & favorable)
        den_hits = sorted(star_houses & denial)

        # Strict Boolean rule on the CSL Star Lord
        if fav_hits and not den_hits:
            promise = True
            status = "promised"
        elif den_hits and not fav_hits:
            promise = False
            status = "denied"
        elif fav_hits and den_hits:
            # Denial houses obstruct the matter
            promise = False
            status = "denied_mixed_significations"
        else:
            promise = False
            status = "no_clear_signification"

        retro_flags = []
        if self._is_retrograde(csl):
            retro_flags.append(csl)
        if self._is_retrograde(star_lord):
            retro_flags.append(star_lord)

        delay_note = None
        if retro_flags:
            delay_note = "Delayed/Denied until direct"
            status = "delayed_until_direct" if promise else "denied_until_direct"

        reason = (
            f"Cuspal Sub Lord of house {primary_house} is {csl}. "
            f"CSL Star Lord is {star_lord or '—'}, signifying houses {sorted(star_houses) or '—'}. "
            f"Favorable hits {fav_hits or 'none'}; denial hits {den_hits or 'none'} "
            f"(denial includes 12th-from-{primary_house} = {twelfth}"
            f"{'' if not denial_houses else f' and category denials {sorted(set(denial_houses))}'})"
            f". Promise = {promise}."
        )
        if delay_note:
            reason += f" Retrograde {', '.join(retro_flags)} → {delay_note}."

        return {
            "the_promise_result": bool(promise),
            "status": status,
            "delay_status": delay_note,
            "cuspal_sub_lord": csl,
            "csl_star_lord": star_lord,
            "star_lord_signified_houses": sorted(star_houses),
            "favorable_hits": fav_hits,
            "denial_hits": den_hits,
            "twelfth_from_primary": twelfth,
            "retrograde_planets": retro_flags,
            "four_fold_star_lord": star_sig,
            "reason": reason,
        }

    # ------------------------------------------------------------------ #
    # Ruling planets (Lagna Star/Sign, Moon Star/Sign, Day Lord)
    # ------------------------------------------------------------------ #
    def ruling_planets(self) -> Dict[str, Any]:
        moon = self.chart.planet("Moon")
        asc = self.chart.ascendant
        day_lord = weekday_lord_from_input(self.input_data)

        components = {
            "day_lord": day_lord,
            "lagna_star_lord": asc.star_lord,
            "lagna_sign_lord": asc.sign_lord,
            "moon_star_lord": moon.star_lord if moon else None,
            "moon_sign_lord": moon.sign_lord if moon else None,
        }
        ordered = [
            components["lagna_star_lord"],
            components["moon_star_lord"],
            components["day_lord"],
            components["lagna_sign_lord"],
            components["moon_sign_lord"],
        ]

        active: List[str] = []
        excluded: List[str] = []
        for name in ordered:
            if not name or name in active:
                continue
            if self._is_retrograde(name):
                excluded.append(name)
                continue
            active.append(name)

        # Promote nodes when they proxy an active RP
        for node_name in ("Rahu", "Ketu"):
            proxies = self.node_proxies(node_name)
            if any(p in active for p in proxies) and node_name not in active:
                active.append(node_name)

        return {
            "components": components,
            "active_ruling_planets": active,
            "excluded_retrograde": excluded,
        }

    def timing_prediction(
        self,
        favorable_houses: List[int],
        promise: Dict[str, Any],
    ) -> Dict[str, Any]:
        """DBA windows whose lords are active RPs signifying favorable houses."""
        rps = self.ruling_planets()
        active_rps = set(rps["active_ruling_planets"])
        fav = set(favorable_houses)

        timing_lords = [
            name for name in active_rps
            if set(self.houses_of(name)) & fav
        ] or list(active_rps)

        dasha = self.chart.dasha or {}
        mds = dasha.get("mds") or []
        ads = dasha.get("ads") or []
        windows: List[Dict[str, Any]] = []

        def _parse(iso: Optional[str]) -> Optional[datetime.datetime]:
            if not iso:
                return None
            try:
                return datetime.datetime.fromisoformat(iso.replace("Z", ""))
            except Exception:
                return None

        now = datetime.datetime.utcnow()
        for md in mds:
            if md.get("lord") not in timing_lords:
                continue
            end = _parse(md.get("end"))
            if end and end < now:
                continue
            windows.append({
                "level": "MD",
                "lords": md.get("lord"),
                "start": md.get("start"),
                "end": md.get("end"),
                "current": bool(md.get("current")),
            })

        for ad in ads:
            if ad.get("lord") not in timing_lords and ad.get("md_lord") not in timing_lords:
                continue
            end = _parse(ad.get("end"))
            if end and end < now:
                continue
            windows.append({
                "level": "AD",
                "lords": f"{ad.get('md_lord')}-{ad.get('lord')}",
                "start": ad.get("start"),
                "end": ad.get("end"),
                "current": bool(ad.get("current")),
            })

        windows = windows[:8]
        if windows:
            w0 = windows[0]
            summary = (
                f"{w0['lords']} period {w0.get('start', '?')} to {w0.get('end', '?')} "
                f"(RPs: {', '.join(rps['active_ruling_planets']) or '—'})"
            )
            if promise.get("delay_status"):
                summary += f"; {promise['delay_status']}"
        else:
            summary = (
                "No RP-linked DBA window found among current/future periods "
                f"(RPs: {', '.join(rps['active_ruling_planets']) or '—'})."
            )

        return {
            "timing_lords": timing_lords,
            "ruling_planets": rps,
            "windows": windows,
            "summary": summary,
            "calculated_dates": [
                {"lords": w["lords"], "start": w.get("start"), "end": w.get("end"), "level": w["level"]}
                for w in windows
            ],
        }
