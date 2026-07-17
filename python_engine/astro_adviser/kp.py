"""
KP (Krishnamurti Paddhati) analysis.

Implements the core KP tools used for education & career judgement:

* House significators using the classic four-step theory.
* Houses signified by a planet (occupation + ownership + via its star-lord;
  with node substitution for Rahu / Ketu).
* Cuspal Sub-Lord (CSL) analysis - the deciding factor in KP for whether a
  matter fructifies, and the kind of result (e.g. job vs business).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Set

from . import constants as C
from .ephemeris import Chart
from .kp_rules_data import (
    PLANET_SUBJECT, PROFESSION_COMBINATIONS, COMPETITIVE_EXAM,
    FOREIGN_EDUCATION, JOB_VS_BUSINESS, TRANSFER_RULES, PROMOTION_RULES,
)

NODES = {C.RAHU, C.KETU}


# ---------------------------------------------------------------------------
# Building blocks
# ---------------------------------------------------------------------------
def owned_houses(chart: Chart, planet: str) -> List[int]:
    """Houses whose sign-lord is ``planet``."""
    return [h for h in range(1, 13) if chart.lord_of_house(h) == planet]


def planets_in_star_of(chart: Chart, lord: str) -> List[str]:
    """Planets whose nakshatra (star) lord is ``lord``."""
    return [name for name, p in chart.planets.items()
            if p.lordship.star_lord == lord]


def _node_agents(chart: Chart, node: str) -> List[str]:
    """
    The planets a node (Rahu/Ketu) represents, in KP priority:
      1. planets conjoined with it in the same sign
      2. its star-lord
      3. the lord of the sign it occupies (dispositor) - only as a fallback
         when there is no conjoined planet (keeps signification focused).
    """
    p = chart.planets[node]
    conjoined = [other for other, op in chart.planets.items()
                 if other != node and other not in NODES
                 and op.sign_index == p.sign_index]
    agents: List[str] = list(conjoined)
    agents.append(p.lordship.star_lord)
    if not conjoined:
        agents.append(p.lordship.sign_lord)
    # de-dup preserving order
    seen, out = set(), []
    for a in agents:
        if a not in seen:
            seen.add(a)
            out.append(a)
    return out


def houses_signified_by(chart: Chart, planet: str) -> Set[int]:
    """
    Houses a planet signifies in KP:
      * houses occupied / owned by its STAR-LORD (strongest source)
      * the house it occupies
      * the houses it owns
    For nodes, the agents' occupation/ownership are used as well.
    """
    houses: Set[int] = set()
    p = chart.planets[planet]

    # Via star lord (strongest in KP).
    star_lord = p.lordship.star_lord
    sl = chart.planets[star_lord]
    houses.add(sl.house)
    houses.update(owned_houses(chart, star_lord))

    # Via own occupation & ownership.
    houses.add(p.house)
    houses.update(owned_houses(chart, planet))

    if planet in NODES:
        for agent in _node_agents(chart, planet):
            ap = chart.planets[agent]
            houses.add(ap.house)
            houses.update(owned_houses(chart, agent))
    return houses


@dataclass
class Significators:
    house: int
    grade_A: List[str]   # planets in star of occupants
    grade_B: List[str]   # occupants
    grade_C: List[str]   # planets in star of lord
    grade_D: List[str]   # the house lord
    ordered: List[str]   # de-duplicated A->D ordering


def significators_of_house(chart: Chart, house: int) -> Significators:
    """Four-step KP significators of a house (strongest first)."""
    occupants = [p.name for p in chart.planets_in_house(house)]
    lord = chart.lord_of_house(house)

    grade_A: List[str] = []
    for occ in occupants:
        for pl in planets_in_star_of(chart, occ):
            if pl not in grade_A:
                grade_A.append(pl)

    grade_B = list(occupants)

    grade_C = [pl for pl in planets_in_star_of(chart, lord)]

    grade_D = [lord]

    # Nodes occupying / aspecting the house are powerful significators too.
    for node in NODES:
        np = chart.planets[node]
        if np.house == house and node not in grade_B:
            grade_B.append(node)

    ordered: List[str] = []
    for grp in (grade_A, grade_B, grade_C, grade_D):
        for pl in grp:
            if pl not in ordered:
                ordered.append(pl)

    return Significators(house, grade_A, grade_B, grade_C, grade_D, ordered)


def significator_grades(chart: Chart, houses: List[int]) -> Dict[str, int]:
    """
    planet -> best grade (4=A strongest .. 1=D) across a group of houses.
    Grade A = planet in star of occupant; B = occupant; C = planet in star of
    lord; D = the house lord.
    """
    score: Dict[str, int] = {}
    for h in houses:
        sig = significators_of_house(chart, h)
        for grade, group in zip((4, 3, 2, 1),
                                (sig.grade_A, sig.grade_B, sig.grade_C, sig.grade_D)):
            for pl in group:
                score[pl] = max(score.get(pl, 0), grade)
    return score


def significators_of_houses(chart: Chart, houses: List[int]) -> List[str]:
    """
    Combined, de-duplicated significators for a group of houses, ranked by the
    strongest grading a planet attains across the group.
    """
    score = significator_grades(chart, houses)
    return sorted(score, key=lambda p: (-score[p], C.PLANETS.index(p)))


def strong_significators(chart: Chart, houses: List[int],
                         min_grade: int = 3) -> List[str]:
    """
    Significators at grade >= ``min_grade`` (A/B by default), plus the cuspal
    sub-lords of those houses. This focused set is what KP uses to TIME an
    event through the Vimshottari dasha.
    """
    grades = significator_grades(chart, houses)
    strong = {p for p, g in grades.items() if g >= min_grade}
    for h in houses:
        strong.add(cuspal_sub_lord(chart, h))
    return sorted(strong, key=lambda p: (-grades.get(p, 2), C.PLANETS.index(p)))


# ---------------------------------------------------------------------------
# Cuspal Sub-Lord analysis
# ---------------------------------------------------------------------------
@dataclass
class CSLFinding:
    house: int
    sub_lord: str
    signifies: List[int]
    favorable: bool
    note: str


def cuspal_sub_lord(chart: Chart, house: int) -> str:
    return chart.cusps[house - 1].lordship.sub_lord


def analyse_csl(chart: Chart, house: int, positive: List[int],
                negative: List[int]) -> CSLFinding:
    """
    Judge a cusp by the houses its sub-lord signifies. If the CSL signifies the
    positive houses (and avoids the negative ones), the matter is promised.
    """
    csl = cuspal_sub_lord(chart, house)
    signifies = sorted(houses_signified_by(chart, csl))
    pos_hit = [h for h in positive if h in signifies]
    neg_hit = [h for h in negative if h in signifies]
    favorable = len(pos_hit) >= 1 and len(pos_hit) >= len(neg_hit)
    note = (f"CSL of house {house} is {csl}; it signifies houses "
            f"{signifies}. Positive links: {pos_hit or 'none'}; "
            f"cautionary links: {neg_hit or 'none'}.")
    return CSLFinding(house, csl, signifies, favorable, note)


# ---------------------------------------------------------------------------
# Education & career judgement (KP)
# ---------------------------------------------------------------------------
@dataclass
class KPEducationResult:
    promised: bool
    significators: List[str]
    csl_findings: List[CSLFinding]
    higher_education_likely: bool
    field_planets: List[str]
    suggested_subjects: List[str]
    notes: List[str]


def judge_education(chart: Chart) -> KPEducationResult:
    notes: List[str] = []
    sig = significators_of_houses(chart, C.EDUCATION_POSITIVE)  # 4,5,9,11

    findings = [
        analyse_csl(chart, 4, C.EDUCATION_POSITIVE, C.EDUCATION_NEGATIVE),
        analyse_csl(chart, 5, C.EDUCATION_POSITIVE, C.EDUCATION_NEGATIVE),
        analyse_csl(chart, 9, [9, 11, 4, 5], [8, 12, 3]),
        analyse_csl(chart, 11, C.EDUCATION_POSITIVE, C.EDUCATION_NEGATIVE),
    ]
    promised = sum(f.favorable for f in findings) >= 2

    # Higher education: 9th & 11th CSL favourable and 9 strongly signified.
    he = (findings[2].favorable and findings[3].favorable)
    if he:
        notes.append("9th & 11th cuspal sub-lords support higher / specialised "
                     "education and successful completion.")
    else:
        notes.append("Higher-education yoga is moderate; completion may need "
                     "extra effort or come through a supportive dasha.")

    # Field planets = strongest significators of 4/5 (learning faculties).
    field_planets = significators_of_houses(chart, [4, 5])[:4]

    # Planet-subject correlation from kp_rules_data.PLANET_SUBJECT.
    suggested_subjects: List[str] = []
    seen_subjects: set = set()
    for planet in field_planets:
        subjects = PLANET_SUBJECT.get(planet, [])
        for subj in subjects[:3]:
            if subj not in seen_subjects:
                seen_subjects.add(subj)
                suggested_subjects.append(subj)
    if suggested_subjects:
        notes.append(f"Subjects indicated by field planets: "
                     f"{', '.join(suggested_subjects[:6])}.")

    return KPEducationResult(
        promised=promised, significators=sig, csl_findings=findings,
        higher_education_likely=he, field_planets=field_planets,
        suggested_subjects=suggested_subjects[:8], notes=notes,
    )


@dataclass
class KPCareerResult:
    promised: bool
    significators: List[str]
    csl_findings: List[CSLFinding]
    job_indicated: bool
    business_indicated: bool
    field_planets: List[str]
    earning_strength: str
    professions: List[Dict]
    notes: List[str]


def judge_career(chart: Chart) -> KPCareerResult:
    notes: List[str] = []
    sig = significators_of_houses(chart, C.CAREER_POSITIVE)  # 2,6,10,11

    findings = [
        analyse_csl(chart, 10, C.CAREER_POSITIVE, C.CAREER_NEGATIVE),
        analyse_csl(chart, 6, [6, 10, 2, 11], [5, 12]),
        analyse_csl(chart, 2, [2, 6, 10, 11], [8, 12]),
        analyse_csl(chart, 11, C.CAREER_POSITIVE, C.CAREER_NEGATIVE),
    ]
    promised = sum(f.favorable for f in findings) >= 2

    # Job vs business via 10th & 6th CSL connections.
    csl10 = houses_signified_by(chart, cuspal_sub_lord(chart, 10))
    csl6 = houses_signified_by(chart, cuspal_sub_lord(chart, 6))
    combined = csl10 | csl6

    # Refined job/business using JOB_VS_BUSINESS rules.
    job_indicated = 6 in combined
    business_indicated = 7 in combined

    # Additional check: cusp_10 sublord connected to 6 strengthens job.
    if 6 in csl10:
        job_indicated = True
    if 7 in csl10:
        business_indicated = True

    # Income type from sign modality of 10th CSL.
    csl10_planet = cuspal_sub_lord(chart, 10)
    csl10_sign = chart.planets[csl10_planet].sign
    income_rules = JOB_VS_BUSINESS.get("income_type", {})
    if csl10_sign in C.MOVABLE_SIGNS:
        notes.append(f"Income type: {income_rules.get('movable_sign', 'dynamic income')} "
                     f"({csl10_sign} is a movable sign on 10th CSL).")
    elif csl10_sign in C.FIXED_SIGNS:
        notes.append(f"Income type: {income_rules.get('fixed_sign', 'steady income')} "
                     f"({csl10_sign} is a fixed sign on 10th CSL).")
    elif csl10_sign in C.DUAL_SIGNS:
        notes.append(f"Income type: {income_rules.get('common_sign', 'variable income')} "
                     f"({csl10_sign} is a dual sign on 10th CSL).")

    if job_indicated and not business_indicated:
        notes.append("Service / salaried employment is favoured (strong 6th-house link).")
    elif business_indicated and not job_indicated:
        notes.append("Independent business / self-employment is favoured (strong 7th-house link).")
    elif job_indicated and business_indicated:
        notes.append("Both service and business are possible; a job first, then "
                     "independent work, is a common pattern for such charts.")
    else:
        notes.append("Career mode is mixed; the running dasha will tilt it toward "
                     "service or enterprise.")

    # Earning strength via 2 (wealth), 6 (regular income), 11 (gains).
    earn_sig = significators_of_houses(chart, [2, 11])
    strong_earn = any(p in earn_sig[:4] for p in (C.JUPITER, C.VENUS, C.MERCURY))
    eleven = analyse_csl(chart, 11, [2, 6, 10, 11], [8, 12])
    if eleven.favorable and strong_earn:
        earning_strength = "Strong"
    elif eleven.favorable or strong_earn:
        earning_strength = "Good"
    else:
        earning_strength = "Moderate"

    field_planets = significators_of_houses(chart, [10, 6])[:4]

    # Profession identification.
    professions = identify_profession(chart)

    return KPCareerResult(
        promised=promised, significators=sig, csl_findings=findings,
        job_indicated=job_indicated, business_indicated=business_indicated,
        field_planets=field_planets, earning_strength=earning_strength,
        professions=professions, notes=notes,
    )


# ---------------------------------------------------------------------------
# Competitive Exam judgement
# ---------------------------------------------------------------------------
@dataclass
class KPCompetitiveExamResult:
    success_likely: bool
    csl_findings: List[CSLFinding]
    significators: List[str]
    notes: List[str]


def judge_competitive_exam(chart: Chart) -> KPCompetitiveExamResult:
    """
    Judge competitive exam success using COMPETITIVE_EXAM rules.
    Primary analysis: CSL of 6th (beating competition) signifying 6, 10, 11.
    Secondary: CSL of 5th must NOT strongly signify 5, 8, 12 (favouring opponent).
    """
    notes: List[str] = []
    positive = COMPETITIVE_EXAM["cusp_analysis"]["positive"]
    negative = COMPETITIVE_EXAM["cusp_analysis"]["negative"]

    findings = [
        analyse_csl(chart, 6, positive, negative),
        analyse_csl(chart, 11, C.EXAM_POSITIVE, C.EXAM_NEGATIVE),
    ]

    # Check 5th CSL: if it signifies negative houses, opponent is weakened.
    csl5 = analyse_csl(chart, 5, C.EDUCATION_POSITIVE, C.EXAM_NEGATIVE)
    findings.append(csl5)

    # Success: 6th CSL favourable and 11th CSL favourable.
    success_likely = findings[0].favorable and findings[1].favorable

    sig = significators_of_houses(chart, COMPETITIVE_EXAM["success_houses"])

    if success_likely:
        notes.append("Competitive exam success is strongly indicated — "
                     "6th & 11th CSLs support beating competition and gaining results.")
    else:
        notes.append("Competitive exam success needs careful timing through a "
                     "favourable dasha period of 6-10-11 significators.")

    if not csl5.favorable:
        notes.append("5th CSL does not support the opponent, which is positive "
                     "for competitive situations.")

    return KPCompetitiveExamResult(
        success_likely=success_likely, csl_findings=findings,
        significators=sig, notes=notes,
    )


# ---------------------------------------------------------------------------
# Foreign Education judgement
# ---------------------------------------------------------------------------
@dataclass
class KPForeignEducationResult:
    indicated: bool
    csl_findings: List[CSLFinding]
    notes: List[str]


def judge_foreign_education(chart: Chart) -> KPForeignEducationResult:
    """
    Judge foreign education possibility. CSL of 9th must signify 9, 12.
    Supporting: Rahu connection, 12th CSL linked to 3, 9.
    """
    notes: List[str] = []
    required_houses = FOREIGN_EDUCATION["cusp_9_sublord_must_signify"]

    # Primary: 9th CSL must signify 9 and 12.
    finding_9 = analyse_csl(chart, 9, required_houses, [8])

    # Secondary: 12th CSL connected to 3, 9 for residence abroad.
    connected_houses = FOREIGN_EDUCATION["cusp_12_sublord_connected_to"]
    finding_12 = analyse_csl(chart, 12, connected_houses + [12], [6])

    findings = [finding_9, finding_12]

    # Check if 9th CSL signifies both 9 and 12.
    csl9 = cuspal_sub_lord(chart, 9)
    csl9_houses = houses_signified_by(chart, csl9)
    signifies_9_and_12 = (9 in csl9_houses and 12 in csl9_houses)

    indicated = finding_9.favorable and signifies_9_and_12

    # Rahu involvement strengthens foreign connection.
    rahu_sig = houses_signified_by(chart, C.RAHU)
    rahu_supports = bool({9, 12} & rahu_sig)

    if indicated:
        notes.append("Foreign education is strongly indicated — 9th CSL "
                     "signifies both 9th and 12th houses.")
    else:
        notes.append("Foreign education is not clearly promised; it may "
                     "materialise during a supportive Rahu or 9-12 dasha period.")

    if rahu_supports:
        notes.append("Rahu signifies 9th/12th houses, strengthening the "
                     "foreign-education connection.")

    if finding_12.favorable:
        notes.append("12th CSL supports residing away from homeland for studies.")

    return KPForeignEducationResult(
        indicated=indicated, csl_findings=findings, notes=notes,
    )


# ---------------------------------------------------------------------------
# Profession identification
# ---------------------------------------------------------------------------
def identify_profession(chart: Chart) -> List[Dict]:
    """
    Match chart significators against PROFESSION_COMBINATIONS.
    Returns top 5 professions with confidence scores.
    """
    # Gather chart data for matching.
    career_houses = [2, 6, 7, 10, 11]
    career_sig = significators_of_houses(chart, career_houses)
    career_grades = significator_grades(chart, career_houses)

    # Get the sign index of the 10th cusp for sign matching.
    sign_10 = C.SIGNS.index(chart.sign_of_house(10))
    sign_6 = C.SIGNS.index(chart.sign_of_house(6))
    chart_signs = {sign_10, sign_6}

    # Get planets strongly connected to career houses.
    strong_career_planets = set(career_sig[:5])

    results: List[Dict] = []

    for profession, rules in PROFESSION_COMBINATIONS.items():
        score = 0.0
        max_score = 0.0

        # House matching: how many of the profession's houses are strongly signified.
        prof_houses = rules.get("houses", [])
        max_score += len(prof_houses) * 2
        for h in prof_houses:
            h_sig = significators_of_house(chart, h)
            # Check if career significators overlap with this house.
            if any(p in strong_career_planets for p in h_sig.ordered[:3]):
                score += 2
            elif any(p in strong_career_planets for p in h_sig.ordered):
                score += 1

        # Planet matching: profession planets present in chart's career significators.
        prof_planets = rules.get("planets", [])
        max_score += len(prof_planets) * 3
        for pl in prof_planets:
            if pl in strong_career_planets:
                score += 3
            elif pl in career_sig[:7]:
                score += 1.5

        # Sign matching: profession signs match 10th/6th house signs.
        prof_signs = rules.get("signs", [])
        if prof_signs:
            max_score += 2
            if any(s in chart_signs for s in prof_signs):
                score += 2

        confidence = round((score / max_score * 100) if max_score > 0 else 0, 1)
        if confidence >= 30:
            results.append({
                "profession": profession,
                "confidence": confidence,
                "matching_planets": [p for p in prof_planets if p in career_sig[:7]],
                "matching_houses": [h for h in prof_houses
                                    if any(p in strong_career_planets
                                           for p in significators_of_house(chart, h).ordered[:3])],
            })

    # Sort by confidence descending, return top 5.
    results.sort(key=lambda x: -x["confidence"])
    return results[:5]


# ---------------------------------------------------------------------------
# Transfer judgement
# ---------------------------------------------------------------------------
@dataclass
class KPTransferResult:
    transfer_likely: bool
    csl_findings: List[CSLFinding]
    notes: List[str]


def judge_transfer(chart: Chart) -> KPTransferResult:
    """
    Judge transfer possibility using TRANSFER_RULES.
    Primary: 3rd CSL signifying 3, 9, 10, 12.
    """
    notes: List[str] = []
    transfer_sig_houses = TRANSFER_RULES["cusp_3_sublord_signifies"]

    finding_3 = analyse_csl(chart, 3, transfer_sig_houses, [4, 11])

    findings = [finding_3]

    # Check if 10th CSL also signifies transfer houses (3, 12).
    csl10_houses = houses_signified_by(chart, cuspal_sub_lord(chart, 10))
    transfer_link = bool({3, 12} & csl10_houses)

    transfer_likely = finding_3.favorable

    if transfer_likely:
        notes.append("Transfer is indicated — 3rd CSL signifies movement-related "
                     "houses (3, 9, 10, 12).")
    else:
        notes.append("Transfer is not strongly indicated in the current period; "
                     "stability in the present location is favoured.")

    if transfer_link:
        notes.append("10th CSL also links to 3rd/12th houses, reinforcing "
                     "the possibility of a professional relocation.")

    # Movable sign check.
    csl3 = cuspal_sub_lord(chart, 3)
    csl3_sign = chart.planets[csl3].sign
    if csl3_sign in C.MOVABLE_SIGNS:
        notes.append(f"3rd CSL ({csl3}) is in movable sign {csl3_sign}, "
                     f"further supporting change of place.")

    return KPTransferResult(
        transfer_likely=transfer_likely, csl_findings=findings, notes=notes,
    )


# ---------------------------------------------------------------------------
# Promotion judgement
# ---------------------------------------------------------------------------
@dataclass
class KPPromotionResult:
    promotion_likely: bool
    csl_findings: List[CSLFinding]
    jupiter_aspect: bool
    notes: List[str]


def judge_promotion(chart: Chart) -> KPPromotionResult:
    """
    Judge promotion using PROMOTION_RULES.
    Primary: 10th CSL signifying 2, 6, 10, 11.
    Jupiter aspecting the 10th house strengthens promotion.
    """
    notes: List[str] = []
    promotion_houses = PROMOTION_RULES["cusp_10_sublord_signifies"]

    finding_10 = analyse_csl(chart, 10, promotion_houses, [5, 8, 12])
    finding_11 = analyse_csl(chart, 11, promotion_houses, [5, 8, 12])

    findings = [finding_10, finding_11]

    # Jupiter aspect check: Jupiter in 10th or aspecting it (5th/7th/9th from it).
    jupiter = chart.planets[C.JUPITER]
    jupiter_house = jupiter.house
    # Jupiter aspects: from its position, it aspects 5th, 7th, 9th houses.
    jupiter_aspects = {jupiter_house,
                       (jupiter_house + 4) % 12 + 1 if jupiter_house + 4 <= 12
                       else (jupiter_house + 4) % 12,
                       (jupiter_house + 6) % 12 + 1 if jupiter_house + 6 <= 12
                       else (jupiter_house + 6) % 12,
                       (jupiter_house + 8) % 12 + 1 if jupiter_house + 8 <= 12
                       else (jupiter_house + 8) % 12}
    # Simpler: Jupiter aspects houses 5, 7, 9 from where it sits.
    aspected_houses = set()
    for offset in (0, 4, 6, 8):  # own house + 5th, 7th, 9th aspects
        h = (jupiter_house - 1 + offset) % 12 + 1
        aspected_houses.add(h)

    jupiter_aspect = 10 in aspected_houses

    promotion_likely = finding_10.favorable and finding_11.favorable

    if promotion_likely:
        notes.append("Promotion is strongly indicated — 10th & 11th CSLs "
                     "signify growth houses (2, 6, 10, 11).")
    elif finding_10.favorable or finding_11.favorable:
        notes.append("Promotion is moderately indicated; timing through "
                     "a favourable dasha of 2-6-10-11 significators is key.")
    else:
        notes.append("Promotion is not strongly indicated in the natal promise; "
                     "effort and the right dasha period will be needed.")

    if jupiter_aspect:
        notes.append("Jupiter aspects the 10th house, providing grace and "
                     "support for professional advancement.")

    return KPPromotionResult(
        promotion_likely=promotion_likely, csl_findings=findings,
        jupiter_aspect=jupiter_aspect, notes=notes,
    )
