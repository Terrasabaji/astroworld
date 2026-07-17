/*
 * kp.js
 * Health analysis using Krishnamurti Paddhati (KP):
 *   - Placidus cuspal sub-lords
 *   - 4-fold significators of houses (occupant's star, occupant, owner's star, owner)
 *   - Health verdict from sub-lords of cusps 1 (body), 6 (disease), 8 (chronic), 12 (hospitalization)
 *   - A planet gives primarily the results of the house(s) signified by its STAR (nakshatra) lord
 *
 * Works in browser (window.AHS.kp) and Node.
 */
(function (root) {
  "use strict";

  var core = (typeof require !== "undefined") ? require("./astro-core.js") : root.AHS.core;
  var data = (typeof require !== "undefined") ? require("./data.js") : root.AHS.data;

  var GRAHAS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

  function uniq(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }); }

  // Houses (1..12) owned by a planet = cusps falling in signs ruled by that planet.
  function ownedHouses(chart, planet) {
    var houses = [];
    for (var h = 0; h < 12; h++) {
      if (chart.cusps[h].signLord === planet) houses.push(h + 1);
    }
    return houses;
  }

  function occupiedHouse(chart, planet) {
    return chart.planets[planet].placidusHouse;
  }

  /*
   * Houses signified by a planet (KP). The planet primarily delivers the
   * houses signified by its STAR lord, then its own occupation/ownership.
   * Returns { strong:[houses via star lord], own:[occupied+owned], all:[...] }
   */
  function planetSignifications(chart, planet) {
    var starLord = chart.planets[planet].nakshatraLord;
    var viaStar = [occupiedHouse(chart, starLord)].concat(ownedHouses(chart, starLord));
    var own = [occupiedHouse(chart, planet)].concat(ownedHouses(chart, planet));

    // Nodes also act for their sign-lord (depositor)
    if (planet === "Rahu" || planet === "Ketu") {
      var dep = chart.planets[planet].signLord;
      own = own.concat([occupiedHouse(chart, dep)]).concat(ownedHouses(chart, dep));
    }
    viaStar = uniq(viaStar);
    own = uniq(own);
    return { strong: viaStar, own: own, all: uniq(viaStar.concat(own)) };
  }

  // 4-fold significators of a house (which planets signify it).
  function houseSignificators(chart, houseNum) {
    var sigs = [];
    // occupants of the house
    var occupants = GRAHAS.filter(function (p) { return occupiedHouse(chart, p) === houseNum; });
    // owner(s) of the house
    var owners = GRAHAS.filter(function (p) { return ownedHouses(chart, p).indexOf(houseNum) >= 0; });

    // Level 1: planets in the star of occupants
    GRAHAS.forEach(function (p) {
      if (occupants.indexOf(chart.planets[p].nakshatraLord) >= 0) sigs.push({ planet: p, level: 1 });
    });
    // Level 2: occupants
    occupants.forEach(function (p) { sigs.push({ planet: p, level: 2 }); });
    // Level 3: planets in the star of owners
    GRAHAS.forEach(function (p) {
      if (owners.indexOf(chart.planets[p].nakshatraLord) >= 0) sigs.push({ planet: p, level: 3 });
    });
    // Level 4: owners
    owners.forEach(function (p) { sigs.push({ planet: p, level: 4 }); });

    // dedupe keeping strongest (lowest level)
    var best = {};
    sigs.forEach(function (s) {
      if (best[s.planet] === undefined || s.level < best[s.planet]) best[s.planet] = s.level;
    });
    return Object.keys(best).map(function (p) { return { planet: p, level: best[p] }; })
      .sort(function (a, b) { return a.level - b.level; });
  }

  function signifiesAny(chart, planet, houseList) {
    var sig = planetSignifications(chart, planet);
    return houseList.some(function (h) { return sig.all.indexOf(h) >= 0; });
  }

  function bodyPartsFor(planet, signIndex) {
    return uniq((data.PLANET_BODY[planet] || []).slice(0, 3)
      .concat((data.SIGN_BODY[signIndex] || []).slice(0, 2)));
  }

  /*
   * Main KP health analysis.
   */
  function analyze(chart) {
    var DIS = data.KP_DISEASE_HOUSES;   // [6,8,12]
    var REC = data.KP_RECOVERY_HOUSES;  // [1,5,11]
    var findings = [];
    var cuspReports = [];
    var score = 70;

    // ---- Cuspal sub-lord verdicts for health-relevant cusps ----
    var healthCusps = [
      { h: 1, label: "Body & general health (1st cusp)" },
      { h: 6, label: "Disease & illness (6th cusp)" },
      { h: 8, label: "Chronic ailments / surgery (8th cusp)" },
      { h: 12, label: "Hospitalization / bed-rest (12th cusp)" }
    ];

    healthCusps.forEach(function (c) {
      var subLord = chart.cusps[c.h - 1].subLord;
      var sig = planetSignifications(chart, subLord);
      var signifiesDisease = DIS.some(function (h) { return sig.all.indexOf(h) >= 0; });
      var signifiesRecovery = REC.some(function (h) { return sig.all.indexOf(h) >= 0; });

      var verdict, sev;
      if (c.h === 1) {
        // 1st cusp sub-lord: good health if it signifies 1/5/11 and NOT 6/8/12
        if (signifiesDisease && !signifiesRecovery) { verdict = "indicates vulnerability to ill-health"; sev = "high"; score -= 10; }
        else if (signifiesDisease && signifiesRecovery) { verdict = "mixed - health challenges with capacity to recover"; sev = "moderate"; score -= 4; }
        else { verdict = "supports good general health"; sev = "low"; score += 6; }
      } else {
        // 6/8/12 cusp sub-lord signifying disease houses => that affliction can manifest
        if (signifiesDisease) {
          verdict = "active - its sub-lord signifies disease houses (6/8/12), so this area can manifest";
          sev = c.h === 8 ? "high" : "moderate";
          score -= (c.h === 8 ? 8 : 5);
        } else if (signifiesRecovery) {
          verdict = "subdued - sub-lord leans toward recovery houses (1/5/11)";
          sev = "low";
          score += 3;
        } else {
          verdict = "neutral";
          sev = "low";
        }
      }

      cuspReports.push({
        cusp: c.h,
        label: c.label,
        subLord: subLord,
        signifies: sig.all.slice().sort(function (a, b) { return a - b; }),
        verdict: verdict,
        severity: sev
      });
    });

    // ---- Planets that are significators of disease houses 6/8/12 ----
    var diseaseSignificators = {};
    DIS.forEach(function (h) {
      houseSignificators(chart, h).forEach(function (s) {
        if (!diseaseSignificators[s.planet] || s.level < diseaseSignificators[s.planet].level) {
          diseaseSignificators[s.planet] = { level: s.level, house: h };
        }
      });
    });

    Object.keys(diseaseSignificators).forEach(function (p) {
      var info = diseaseSignificators[p];
      var signIndex = chart.planets[p].signIndex;
      var nakIndex = Math.floor(chart.planets[p].lon / (360 / 27));
      // strong significator (level 1-2) and the planet itself afflicting => emphasise
      var sev = info.level <= 2 ? "moderate" : "low";

      // Nakshatra-body-part analysis from KPHealthRules
      var nakVulnerabilities = [];
      if (typeof KPHealthRules !== "undefined" && KPHealthRules.NAKSHATRA_BODY[nakIndex]) {
        var nakData = KPHealthRules.NAKSHATRA_BODY[nakIndex];
        nakVulnerabilities = nakData.parts || [];
      }

      // Planet-sign-disease correlation
      var signDiseases = [];
      if (typeof KPHealthRules !== "undefined" && KPHealthRules.PLANET_SIGN_DISEASE[p] &&
          KPHealthRules.PLANET_SIGN_DISEASE[p][signIndex]) {
        signDiseases = KPHealthRules.PLANET_SIGN_DISEASE[p][signIndex];
      }

      var bodyParts = bodyPartsFor(p, signIndex);
      if (nakVulnerabilities.length) bodyParts = uniq(bodyParts.concat(nakVulnerabilities.slice(0, 2)));

      findings.push({
        area: p + " - significator of disease house " + info.house,
        severity: sev,
        basis: p + " (in " + chart.planets[p].sign + ", star of " + chart.planets[p].nakshatraLord +
          ", nakshatra " + (KPHealthRules && KPHealthRules.NAKSHATRA_BODY[nakIndex] ? KPHealthRules.NAKSHATRA_BODY[nakIndex].name : "") +
          ") is a level-" + info.level + " significator of house " + info.house +
          ". In KP this links its governed organs/functions to that house's matters.",
        bodyParts: bodyParts,
        nakshatra: (typeof KPHealthRules !== "undefined" && KPHealthRules.NAKSHATRA_BODY[nakIndex]) ? KPHealthRules.NAKSHATRA_BODY[nakIndex].name : null,
        nakshatraDiseases: (typeof KPHealthRules !== "undefined" && KPHealthRules.NAKSHATRA_BODY[nakIndex]) ? KPHealthRules.NAKSHATRA_BODY[nakIndex].diseases : [],
        signDiseases: signDiseases
      });
    });

    score = Math.max(5, Math.min(95, Math.round(score)));

    // ---- Overall verdict ----
    var firstCusp = cuspReports[0];
    var band = score >= 75 ? "favourable" : score >= 60 ? "reasonably stable" :
      score >= 45 ? "guarded - several cuspal links to disease houses" : "fragile - strong cuspal links to 6/8/12";

    var summary = "KP assessment: health outlook appears " + band + " (index " + score + "/100). " +
      "The 1st cuspal sub-lord is " + firstCusp.subLord + ", which " + firstCusp.verdict + ". " +
      "Cuspal sub-lords and the significators of houses 6/8/12 below point to the systems most likely involved.";

    return {
      method: "KP (Krishnamurti Paddhati)",
      score: score,
      summary: summary,
      cuspReports: cuspReports,
      findings: findings,
      ascendant: chart.ascendant.sign
    };
  }

  /*
   * specificDiseaseDetection(chart)
   * Match chart patterns against KPHealthRules.DISEASE_PATTERNS.
   * Returns array of { disease, confidence, matchedPlanets, matchedConditions }.
   */
  function specificDiseaseDetection(chart) {
    if (typeof KPHealthRules === "undefined" || !KPHealthRules.DISEASE_PATTERNS) return [];
    var results = [];
    var patterns = KPHealthRules.DISEASE_PATTERNS;
    var DIS = data.KP_DISEASE_HOUSES;

    patterns.forEach(function (pattern) {
      var score = 0;
      var maxScore = 0;
      var matchedPlanets = [];
      var matchedConditions = [];

      // Check planet involvement: planet must signify disease houses (6/8/12)
      maxScore += pattern.planets.length * 2;
      pattern.planets.forEach(function (p) {
        if (!chart.planets[p]) return;
        var sig = planetSignifications(chart, p);
        var diseaseLink = DIS.some(function (h) { return sig.all.indexOf(h) >= 0; });
        if (diseaseLink) {
          score += 2;
          matchedPlanets.push(p);
          matchedConditions.push(p + " signifies disease house(s)");
        } else if (sig.all.indexOf(1) >= 0) {
          score += 0.5;
        }
      });

      // Check sign involvement: disease significators placed in relevant signs
      if (pattern.signs && pattern.signs.length) {
        maxScore += pattern.signs.length;
        pattern.signs.forEach(function (signIdx) {
          var found = pattern.planets.some(function (p) {
            return chart.planets[p] && chart.planets[p].signIndex === signIdx;
          });
          if (found) {
            score += 1;
            matchedConditions.push("planet in " + (core.SIGNS[signIdx] || "sign " + signIdx));
          }
        });
      }

      // Check house involvement: significators occupy or signify relevant houses
      if (pattern.houses && pattern.houses.length) {
        maxScore += pattern.houses.length;
        pattern.houses.forEach(function (h) {
          var sigs = houseSignificators(chart, h);
          var overlap = sigs.filter(function (s) { return pattern.planets.indexOf(s.planet) >= 0 && s.level <= 2; });
          if (overlap.length) {
            score += 1;
            matchedConditions.push("house " + h + " signified by " + overlap[0].planet);
          }
        });
      }

      var confidence = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      if (confidence >= 30) {
        results.push({
          disease: pattern.name,
          confidence: confidence,
          matchedPlanets: matchedPlanets,
          matchedConditions: matchedConditions,
          conditions: pattern.conditions
        });
      }
    });

    results.sort(function (a, b) { return b.confidence - a.confidence; });
    return results.slice(0, 8);
  }

  /*
   * surgeryTiming(chart)
   * Using KPHealthRules.SURGERY_TIMING rules, identify favorable/unfavorable periods.
   */
  function surgeryTiming(chart) {
    if (typeof KPHealthRules === "undefined" || !KPHealthRules.SURGERY_TIMING) {
      return { indication: "none", periods: [], notes: [] };
    }
    var rules = KPHealthRules.SURGERY_TIMING;
    var notes = [];
    var favorable = [];
    var unfavorable = [];

    var marsSig = planetSignifications(chart, "Mars");
    var marsSignifies8 = marsSig.all.indexOf(8) >= 0;
    var marsSignifies6 = marsSig.all.indexOf(6) >= 0;
    var marsSignifies12 = marsSig.all.indexOf(12) >= 0;

    if (marsSignifies8) {
      notes.push("Mars signifies 8th house (surgery house) — surgery is indicated in Mars periods/sub-periods");
      favorable.push("Mars Dasha/Bhukti/Anthra periods (direct connection to 8th)");
    }
    if (marsSignifies6 && marsSignifies8) {
      notes.push("Mars connects 6th (disease) and 8th (surgery) — curative surgery likely");
    }

    var ketuSig = planetSignifications(chart, "Ketu");
    if (ketuSig.all.indexOf(8) >= 0 || ketuSig.all.indexOf(6) >= 0) {
      notes.push("Ketu signifies disease/surgery houses — indicates removal/excision procedures");
      favorable.push("Ketu sub-periods (headless planet = removal)");
    }

    var satSig = planetSignifications(chart, "Saturn");
    if (satSig.all.indexOf(8) >= 0) {
      notes.push("Saturn signifies 8th — may indicate prolonged surgical procedure or body-part removal");
    }

    if (marsSig.all.indexOf(4) >= 0 && marsSignifies8) {
      notes.push("Mars connected to 4th and 8th houses — cardiac/chest surgery possible");
    }

    var surgerySignificators = [];
    GRAHAS.forEach(function (p) {
      var sig = planetSignifications(chart, p);
      var has6 = sig.all.indexOf(6) >= 0;
      var has8 = sig.all.indexOf(8) >= 0;
      var has12 = sig.all.indexOf(12) >= 0;
      if ((has6 && has8) || (has8 && has12) || (has6 && has8 && has12)) {
        surgerySignificators.push(p);
      }
    });
    if (surgerySignificators.length) {
      favorable.push("Joint periods of: " + surgerySignificators.join(", ") + " (signify 6/8/12)");
    }

    unfavorable.push("Avoid surgery when Moon transits the sign governing the affected organ");
    unfavorable.push("Avoid waxing Moon period for surgery (bleeding risk increases)");

    var indication = marsSignifies8 ? "strong" : (marsSignifies6 ? "moderate" : "low");

    return {
      indication: indication,
      surgerySignificators: surgerySignificators,
      favorable: favorable,
      unfavorable: unfavorable,
      notes: notes,
      rules: rules
    };
  }

  /*
   * recoveryPrediction(chart)
   * Analyze recovery potential using CSL of 1st, 5th, 11th with KPHealthRules.RECOVERY_RULES.
   */
  function recoveryPrediction(chart) {
    if (typeof KPHealthRules === "undefined" || !KPHealthRules.RECOVERY_RULES) {
      return { outlook: "unknown", factors: [], notes: [] };
    }
    var REC = data.KP_RECOVERY_HOUSES;
    var factors = [];
    var score = 50;
    var notes = [];

    REC.forEach(function (h) {
      var subLord = chart.cusps[h - 1].subLord;
      var sig = planetSignifications(chart, subLord);
      var signifiesRecovery = REC.some(function (rh) { return sig.all.indexOf(rh) >= 0; });
      var signifiesDisease = [6, 8, 12].some(function (dh) { return sig.all.indexOf(dh) >= 0; });

      if (signifiesRecovery && !signifiesDisease) {
        score += 12;
        factors.push({ cusp: h, subLord: subLord, effect: "positive", note: "Sub-lord of " + h + "th cusp (" + subLord + ") signifies recovery houses" });
      } else if (signifiesDisease && !signifiesRecovery) {
        score -= 10;
        factors.push({ cusp: h, subLord: subLord, effect: "negative", note: "Sub-lord of " + h + "th cusp (" + subLord + ") signifies disease houses — recovery hindered" });
      } else if (signifiesRecovery && signifiesDisease) {
        score += 2;
        factors.push({ cusp: h, subLord: subLord, effect: "mixed", note: "Sub-lord of " + h + "th cusp (" + subLord + ") mixed — recovery with setbacks" });
      }
    });

    var jupSig = planetSignifications(chart, "Jupiter");
    var jupRecovery = REC.filter(function (h) { return jupSig.all.indexOf(h) >= 0; });
    if (jupRecovery.length >= 2) {
      score += 10;
      notes.push("Jupiter signifies multiple recovery houses (" + jupRecovery.join(", ") + ") — strong recovery assured");
    } else if (jupRecovery.length === 1) {
      score += 5;
      notes.push("Jupiter connected to recovery house " + jupRecovery[0]);
    }

    var sixth = chart.cusps[5];
    var signData = (typeof KPHealthRules !== "undefined" && KPHealthRules.SIGN_BODY) ? KPHealthRules.SIGN_BODY[sixth.signIndex] : null;
    if (signData) {
      if (signData.quality === "movable") {
        notes.push("6th cusp in movable sign — disease curable quickly");
        score += 5;
      } else if (signData.quality === "fixed") {
        notes.push("6th cusp in fixed sign — disease tends to be chronic/lingering");
        score -= 8;
      } else if (signData.quality === "common") {
        notes.push("6th cusp in common sign — disease may relapse before full cure");
        score -= 3;
      }
    }

    var sixthLord = chart.cusps[5].signLord;
    if (chart.planets[sixthLord] && chart.planets[sixthLord].placidusHouse === 5) {
      score += 8;
      notes.push("6th lord in 5th house (12th from 6th) — negation of disease, recovery favored");
    }

    score = Math.max(5, Math.min(95, score));
    var outlook = score >= 70 ? "good" : score >= 50 ? "moderate" : score >= 30 ? "guarded" : "poor";

    return {
      outlook: outlook,
      score: score,
      factors: factors,
      notes: notes,
      recoveryTiming: "Recovery during joint period of significators of houses 1, 5, and 11"
    };
  }

  /*
   * mentalHealthIndicators(chart)
   * Moon/Mercury affliction + 4th/5th/12th house analysis.
   */
  function mentalHealthIndicators(chart) {
    if (typeof KPHealthRules === "undefined" || !KPHealthRules.MENTAL_HEALTH) {
      return { risk: "low", indicators: [], notes: [] };
    }
    var mh = KPHealthRules.MENTAL_HEALTH;
    var indicators = [];
    var score = 0;

    var moonSig = planetSignifications(chart, "Moon");
    var moonInDisease = [6, 8, 12].some(function (h) { return moonSig.all.indexOf(h) >= 0; });
    var moonHouse = chart.planets.Moon.placidusHouse;

    if (mh.moon_affliction.houses.indexOf(moonHouse) >= 0 && moonInDisease) {
      score += 2;
      indicators.push({ planet: "Moon", type: "affliction", detail: "Moon in house " + moonHouse + " signifying disease houses — " + mh.moon_affliction.effect });
    }

    var mercSig = planetSignifications(chart, "Mercury");
    var mercInDisease = [6, 8, 12].some(function (h) { return mercSig.all.indexOf(h) >= 0; });
    var mercHouse = chart.planets.Mercury.placidusHouse;
    if (mh.mercury_affliction.houses.indexOf(mercHouse) >= 0 && mercInDisease) {
      score += 2;
      indicators.push({ planet: "Mercury", type: "affliction", detail: "Mercury in house " + mercHouse + " signifying disease houses — " + mh.mercury_affliction.effect });
    }

    if (chart.planets.Ketu.placidusHouse === 1) {
      score += 1;
      indicators.push({ planet: "Ketu", type: "position", detail: mh.ketu_in_lagna });
    }

    var satSig = planetSignifications(chart, "Saturn");
    var satMoonOverlap = moonSig.all.filter(function (h) { return satSig.all.indexOf(h) >= 0 && [4, 5, 8, 12].indexOf(h) >= 0; });
    if (satMoonOverlap.length) {
      score += 2;
      indicators.push({ planet: "Saturn-Moon", type: "combination", detail: mh.saturn_afflicting_moon + " (both signify house(s) " + satMoonOverlap.join(", ") + ")" });
    }

    var marsSig = planetSignifications(chart, "Mars");
    var marsMoonOverlap = moonSig.all.filter(function (h) { return marsSig.all.indexOf(h) >= 0 && [1, 6, 8].indexOf(h) >= 0; });
    if (marsMoonOverlap.length) {
      score += 1.5;
      indicators.push({ planet: "Mars-Moon", type: "combination", detail: mh.mars_afflicting_moon + " (overlap in house(s) " + marsMoonOverlap.join(", ") + ")" });
    }

    var fourthSigs = houseSignificators(chart, 4);
    var maleficsIn4 = fourthSigs.filter(function (s) { return ["Saturn", "Mars", "Rahu", "Ketu"].indexOf(s.planet) >= 0 && s.level <= 2; });
    if (maleficsIn4.length) {
      score += maleficsIn4.length * 0.5;
      indicators.push({ planet: maleficsIn4.map(function (m) { return m.planet; }).join(", "), type: "house4",
        detail: "Malefic(s) strongly signify 4th house (mind/emotions): " + maleficsIn4.map(function (m) { return m.planet; }).join(", ") });
    }

    var fifthSigs = houseSignificators(chart, 5);
    var maleficsIn5 = fifthSigs.filter(function (s) { return ["Saturn", "Rahu", "Ketu"].indexOf(s.planet) >= 0 && s.level <= 2; });
    if (maleficsIn5.length) {
      score += maleficsIn5.length * 0.5;
      indicators.push({ planet: maleficsIn5.map(function (m) { return m.planet; }).join(", "), type: "house5",
        detail: "Malefic(s) strongly signify 5th house (intellect): " + maleficsIn5.map(function (m) { return m.planet; }).join(", ") });
    }

    var twelfthSigs = houseSignificators(chart, 12);
    var moonIn12 = twelfthSigs.some(function (s) { return s.planet === "Moon" && s.level <= 2; });
    if (moonIn12) {
      score += 1.5;
      indicators.push({ planet: "Moon", type: "house12", detail: "Moon strongly signifies 12th house — emotional isolation, subconscious disturbances" });
    }

    var risk = score >= 5 ? "high" : score >= 3 ? "moderate" : "low";
    var notes = [];
    if (risk === "high") notes.push("Multiple mental health indicators present — monitor emotional/psychological wellbeing closely");
    else if (risk === "moderate") notes.push("Some mental health indicators present — periodic stress/anxiety possible");

    return {
      risk: risk,
      score: Math.round(score * 10) / 10,
      indicators: indicators,
      notes: notes,
      mentalHouses: mh.mental_houses,
      mentalHouseMeaning: mh.mental_house_meaning
    };
  }

  /*
   * retrogradeHealthEffects(chart, shabalaMap)
   * Planets signifying 6/8/12 when retrograde indicate chronic conditions.
   */
  function retrogradeHealthEffects(chart, shabalaMap) {
    if (typeof KPHealthRules === "undefined" || !KPHealthRules.RETROGRADE_HEALTH) return [];
    if (!shabalaMap) return [];
    var DIS = data.KP_DISEASE_HOUSES;
    var effects = [];

    GRAHAS.forEach(function (p) {
      if (!shabalaMap[p] || !shabalaMap[p].retro) return;
      var sig = planetSignifications(chart, p);
      var diseaseHouses = DIS.filter(function (h) { return sig.all.indexOf(h) >= 0; });
      if (!diseaseHouses.length) return;

      var detail = "";
      if (p === "Mars") detail = "Retrograde Mars intensifies disease — acute conditions become recurrent";
      else if (p === "Jupiter") detail = "Retrograde Jupiter — chronic illness with slow degeneration";
      else if (p === "Saturn") detail = "Retrograde Saturn — self-reinforcing chronic condition, very slow recovery";
      else if (p === "Mercury") detail = "Retrograde Mercury — recurrent nervous/mental conditions";
      else detail = "Retrograde " + p + " signifying disease houses — delayed recovery, recurring ailment";

      effects.push({
        planet: p,
        houses: diseaseHouses,
        chronic: true,
        detail: detail,
        severity: diseaseHouses.length >= 2 ? "high" : "moderate"
      });
    });

    return effects;
  }

  var api = {
    analyze: analyze,
    planetSignifications: planetSignifications,
    houseSignificators: houseSignificators,
    ownedHouses: ownedHouses,
    specificDiseaseDetection: specificDiseaseDetection,
    surgeryTiming: surgeryTiming,
    recoveryPrediction: recoveryPrediction,
    mentalHealthIndicators: mentalHealthIndicators,
    retrogradeHealthEffects: retrogradeHealthEffects
  };
  root.AHS = root.AHS || {};
  root.AHS.kp = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
