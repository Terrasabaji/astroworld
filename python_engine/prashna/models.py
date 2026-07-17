"""OOP chart model for Prashna analysis."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class Planet:
    name: str
    longitude: float
    sign: str
    sign_index: int
    sign_lord: str
    star_lord: str
    sub_lord: str
    nakshatra: str
    house: int
    retrograde: bool = False
    speed: Optional[float] = None
    d9_sign: Optional[str] = None
    d9_sign_index: Optional[int] = None
    raw: Dict[str, Any] = field(default_factory=dict, repr=False)

    @classmethod
    def from_row(cls, row: dict, house: int) -> "Planet":
        return cls(
            name=row["name"],
            longitude=float(row["longitude"]),
            sign=row["sign"],
            sign_index=int(row["sign_index"]),
            sign_lord=row.get("sign_lord") or "",
            star_lord=row.get("star_lord") or row.get("nakshatra_lord") or "",
            sub_lord=row.get("sub_lord") or "",
            nakshatra=row.get("nakshatra") or "",
            house=house,
            retrograde=bool(row.get("retrograde")),
            speed=row.get("speed"),
            d9_sign=row.get("d9_sign"),
            d9_sign_index=row.get("d9_sign_index"),
            raw=row,
        )


@dataclass
class House:
    number: int
    longitude: float
    sign: str
    sign_index: int
    sign_lord: str
    star_lord: str
    sub_lord: str
    raw: Dict[str, Any] = field(default_factory=dict, repr=False)

    @classmethod
    def from_row(cls, row: dict) -> "House":
        return cls(
            number=int(row.get("house") or 0),
            longitude=float(row["longitude"]),
            sign=row["sign"],
            sign_index=int(row["sign_index"]),
            sign_lord=row.get("sign_lord") or "",
            star_lord=row.get("star_lord") or row.get("nakshatra_lord") or "",
            sub_lord=row.get("sub_lord") or "",
            raw=row,
        )


@dataclass
class Chart:
    """Sidereal KP chart (Placidus) at the judgement moment."""

    ascendant: Planet
    planets: List[Planet]
    houses: List[House]
    cusp_longitudes: List[float]
    significators: Dict[str, dict]
    dasha: Dict[str, Any]
    input: Dict[str, Any]
    jd_ut: float
    horary_number: Optional[int] = None
    horary_ascendant: Optional[Dict[str, Any]] = None
    raw: Dict[str, Any] = field(default_factory=dict, repr=False)

    def planet(self, name: str) -> Optional[Planet]:
        for p in self.planets:
            if p.name == name:
                return p
        return None

    def planet_map(self) -> Dict[str, Planet]:
        return {p.name: p for p in self.planets}

    def house(self, n: int) -> Optional[House]:
        for h in self.houses:
            if h.number == n:
                return h
        return None

    def cuspal_sub_lord(self, n: int) -> Optional[str]:
        h = self.house(n)
        return h.sub_lord if h else None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "input": self.input,
            "jd_ut": self.jd_ut,
            "ascendant": self.ascendant.raw,
            "planets": [p.raw for p in self.planets],
            "houses": [h.raw for h in self.houses],
            "kp_significators": self.significators,
            "dasha": self.dasha,
            "horary_number": self.horary_number,
            "horary_ascendant": self.horary_ascendant,
            "engine": self.raw.get("engine"),
        }
