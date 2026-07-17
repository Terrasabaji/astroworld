"""MODULE 2 / PART A — Krishnamurti Paddhati engine for Prashna."""

from __future__ import annotations

import datetime
from typing import Any, Dict, List, Optional, Set, Tuple

from .chart_builder import weekday_lord_from_input
from .models import Chart, Planet


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
          Level 1 — Star of occupant (strongest; A)
          Level 2 — Occupant (B)
          Level 3 — Star of lord (C)
          Level 4 — Lord (D)
        """
        block = dict(self.chart.significators.get(planet_name) or {})
        # Expand via Rahu/Ketu proxies when reading those planets
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
            "level_1_star_of_occupant": block.get("level_A_star_lord_occupies") or [],
            "level_2_occupant": block.get("level_B_planet_occupies") or [],
            "level_3_star_of_lord": block.get("level_C_star_lord_owns") or [],
            "level_4_lord": block.get("level_D_planet_owns") or [],
        }
        return block

    def houses_of(self, planet_name: str) -> List[int]:
        return list(self.four_fold_significators(planet_name).get("all_signified_houses") or [])

    # ------------------------------------------------------------------ #
    # Nodes as proxies
    # ------------------------------------------------------------------ #
    def node_proxies(self, node_name: str) -> List[str]:
        """
        Rahu/Ketu act as agents for:
          (1) conjoined planets, (2) aspecting planets,
          (3) their star lord, (4) their sign lord.
        """
        if node_name in self._node_proxy_cache:
            return self._node_proxy_cache[node_name]

        node = self.chart.planet(node_name)
        if not node:
            return []

        proxies: List[str] = []
        # (4) sign lord
        if node.sign_lord and node.sign_lord not in proxies:
            proxies.append(node.sign_lord)
        # (3) star lord
        if node.star_lord and node.star_lord not in proxies:
            proxies.append(node.star_lord)

        # (1) conjunction within ~3°20' (nadi-ish orb) same sign preferred
        for p in self.chart.planets:
            if p.name in ("Rahu", "Ketu", node_name):
                continue
            sep = abs((p.longitude - node.longitude + 180) % 360 - 180)
            if sep <= 3.5:
                if p.name not in proxies:
                    proxies.append(p.name)

        # (2) major Vedic aspects onto the node (Mars 4/7/8, Jupiter 5/7/9, Saturn 3/7/10, others 7)
        aspect_map = {
            "Mars": {3, 6, 7},
            "Jupiter": {4, 6, 8},
            "Saturn": {2, 6, 9},
        }
        for p in self.chart.planets:
            if p.name in ("Rahu", "Ketu", node_name):
                continue
            house_diff = ((int(p.sign_index) - int(node.sign_index)) % 12)
            # convert to aspect house count from planet to node (1-based span)
            span = house_diff  # 0 = same sign
            special = aspect_map.get(p.name, {6})  # default opposition = 7th = span 6
            if span in special or (p.name not in aspect_map and span == 6):
                if p.name not in proxies:
                    proxies.append(p.name)

        self._node_proxy_cache[node_name] = proxies
        return proxies

    def _is_retrograde(self, planet_name: Optional[str]) -> bool:
        if not planet_name:
            return False
        p = self.chart.planet(planet_name)
        return bool(p and p.retrograde and planet_name not in ("Rahu", "Ketu", "Sun", "Moon"))

    # ------------------------------------------------------------------ #
    # Promise (CSL theory)
    # ------------------------------------------------------------------ #
    def evaluate_promise(
        self,
        primary_house: int,
        favorable_houses: List[int],
        denial_houses: List[int],
    ) -> Dict[str, Any]:
        csl = self.chart.cuspal_sub_lord(primary_house)
        if not csl:
            return {
                "the_promise_result": False,
                "status": "unknown",
                "cuspal_sub_lord": None,
                "reason": f"No cuspal sub-lord found for house {primary_house}.",
            }

        csl_sig = self.four_fold_significators(csl)
        csl_houses = set(csl_sig.get("all_signified_houses") or [])

        # Star lord of CSL — KP: star lord shows the fructification path
        csl_planet = self.chart.planet(csl)
        star_lord = csl_planet.star_lord if csl_planet else (csl_sig.get("star_lord") or "")
        star_sig = self.four_fold_significators(star_lord) if star_lord else {}
        star_houses = set(star_sig.get("all_signified_houses") or [])

        twelfth = _twelfth_from(primary_house)
        denial = set(denial_houses) | {twelfth}
        favorable = set(favorable_houses) | {primary_house}

        fav_hits = sorted((csl_houses | star_houses) & favorable)
        den_hits = sorted((csl_houses | star_houses) & denial)

        retro_flags = []
        if self._is_retrograde(csl):
            retro_flags.append(csl)
        if self._is_retrograde(star_lord):
            retro_flags.append(star_lord)

        if fav_hits and not den_hits:
            promise = True
            status = "promised"
        elif den_hits and not fav_hits:
            promise = False
            status = "denied"
        elif fav_hits and den_hits:
            # Mixed — lean on stronger CSL star-lord favorability
            promise = len(fav_hits) >= len(den_hits)
            status = "mixed_lean_yes" if promise else "mixed_lean_no"
        else:
            promise = False
            status = "weak_or_unclear"

        if retro_flags and promise:
            status = "delayed_until_direct"
        elif retro_flags and not promise:
            status = "denied_or_delayed_retrograde"

        reason_parts = [
            f"Cuspal sub-lord of house {primary_house} is {csl}, signifying {sorted(csl_houses) or '—'}.",
            f"Its star-lord is {star_lord or '—'}, signifying {sorted(star_houses) or '—'}.",
            f"Favorable hits: {fav_hits or 'none'}; denial hits: {den_hits or 'none'} "
            f"(denial set includes 12th-from-primary = {twelfth}).",
        ]
        if retro_flags:
            reason_parts.append(
                f"Retrograde influence on {', '.join(retro_flags)} → Delayed/Denied until direct."
            )

        return {
            "the_promise_result": bool(promise),
            "status": status,
            "cuspal_sub_lord": csl,
            "csl_star_lord": star_lord,
            "csl_signified_houses": sorted(csl_houses),
            "star_lord_signified_houses": sorted(star_houses),
            "favorable_hits": fav_hits,
            "denial_hits": den_hits,
            "retrograde_planets": retro_flags,
            "four_fold_csl": csl_sig,
            "reason": " ".join(reason_parts),
        }

    # ------------------------------------------------------------------ #
    # Ruling planets + timing
    # ------------------------------------------------------------------ #
    def ruling_planets(self) -> Dict[str, Any]:
        moon = self.chart.planet("Moon")
        asc = self.chart.ascendant
        day_lord = weekday_lord_from_input(self.input_data)

        raw = {
            "day_lord": day_lord,
            "lagna_sign_lord": asc.sign_lord,
            "lagna_star_lord": asc.star_lord,
            "moon_sign_lord": moon.sign_lord if moon else None,
            "moon_star_lord": moon.star_lord if moon else None,
        }
        ordered = [
            asc.star_lord,
            moon.star_lord if moon else None,
            day_lord,
            asc.sign_lord,
            moon.sign_lord if moon else None,
        ]
        # Filter retrograde planets from active RP set (nodes kept)
        active = []
        excluded = []
        for name in ordered:
            if not name or name in active:
                continue
            if self._is_retrograde(name):
                excluded.append(name)
                continue
            active.append(name)

        # Promote nodes when they proxy an RP
        for node_name in ("Rahu", "Ketu"):
            proxies = self.node_proxies(node_name)
            if any(p in active for p in proxies) and node_name not in active:
                active.append(node_name)

        return {
            "components": raw,
            "active_ruling_planets": active,
            "excluded_retrograde": excluded,
        }

    def timing_prediction(
        self,
        favorable_houses: List[int],
        promise: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Use Ruling Planets filtered against significators of favorable houses
        to identify DBA windows from the judgement-time Vimshottari sequence.
        """
        rps = self.ruling_planets()
        active_rps = set(rps["active_ruling_planets"])
        fav = set(favorable_houses)

        # Planets that both are RPs and signify favorable houses
        timing_lords = []
        for name in active_rps:
            hs = set(self.houses_of(name))
            if hs & fav:
                timing_lords.append(name)

        if not timing_lords:
            # fall back to RPs alone
            timing_lords = list(active_rps)

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
            lord = md.get("lord")
            if lord not in timing_lords:
                continue
            start = _parse(md.get("start"))
            end = _parse(md.get("end"))
            if end and end < now:
                continue
            windows.append({
                "level": "MD",
                "lords": lord,
                "start": md.get("start"),
                "end": md.get("end"),
                "current": bool(md.get("current")),
            })

        for ad in ads:
            lords = f"{ad.get('md_lord')}-{ad.get('lord')}"
            if ad.get("lord") not in timing_lords and ad.get("md_lord") not in timing_lords:
                continue
            end = _parse(ad.get("end"))
            if end and end < now:
                continue
            windows.append({
                "level": "AD",
                "lords": lords,
                "start": ad.get("start"),
                "end": ad.get("end"),
                "current": bool(ad.get("current")),
            })

        windows = windows[:8]
        summary = "No clear RP-linked DBA window."
        if windows:
            w0 = windows[0]
            summary = (
                f"Favorable DBA emphasis: {w0['lords']} "
                f"({w0.get('start', '?')} → {w0.get('end', '?')}). "
                f"Active ruling planets: {', '.join(rps['active_ruling_planets']) or '—'}."
            )
            if promise.get("status") == "delayed_until_direct":
                summary += " Event likely after retrograde significators turn direct."

        return {
            "timing_lords": timing_lords,
            "ruling_planets": rps,
            "windows": windows,
            "summary": summary,
            "nakshatra_at_birth": dasha.get("nakshatra_at_birth"),
            "balance_years": dasha.get("balance_years"),
        }
