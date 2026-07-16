/* =============================================================================
 * kp.js  —  Krishnamurti Paddhati (KP) marriage analysis
 *
 * KP judges events by the SUB-LORD of the relevant cusp. For marriage the
 * primary cusp is the 7th; the 2nd (family addition) and 11th (fulfilment of
 * desire / permanent friendship) are supporting. A marriage is promised when
 * the sub-lord of the 7th cusp is a significator of houses 2, 7 or 11.
 *
 * Significators of a house (4-step KP rule):
 *   1. Planets in the star (nakshatra) of the occupant(s) of the house
 *   2. Occupants of the house
 *   3. Planets in the star of the owner of the house (cusp sign lord)
 *   4. Owner of the house
 * Planets conjunct Rahu/Ketu also signify what the node signifies.
 * ========================================================================== */

const KP = (function () {
  'use strict';

  // Build star-lord -> planets map and occupant maps for a chart
  function buildMaps(chart) {
    const occByHouse = {};
    for (let h = 1; h <= 12; h++) occByHouse[h] = [];
    Astro.PLANETS.forEach((p) => {
      occByHouse[chart.kp.planets[p].kpHouse].push(p);
    });
    // sign lord of each cusp (house owner)
    const ownerByHouse = {};
    chart.kp.cusps.forEach((c) => {
      ownerByHouse[c.house] = Astro.RASHI_LORD[c.sign];
    });
    return { occByHouse, ownerByHouse };
  }

  // houses a given planet "owns" (its signs appear on which cusps)
  function ownedHouses(planet, chart) {
    const res = [];
    chart.kp.cusps.forEach((c) => {
      if (Astro.RASHI_LORD[c.sign] === planet) res.push(c.house);
    });
    return res;
  }

  // planets located in the nakshatra (star) ruled by `lord`
  function planetsInStarOf(lord, chart) {
    return Astro.PLANETS.filter((p) => chart.kp.planets[p].nakLord === lord);
  }

  // Significator houses for a planet (the houses it signifies in KP)
  function significatorHouses(planet, chart) {
    const houses = new Set();
    const p = chart.kp.planets[planet];
    // (b) house it occupies
    houses.add(p.kpHouse);
    // (a) it is in the star of the occupant of some house -> signifies that house
    const starLord = p.nakLord;
    // houses occupied by the star lord
    if (chart.kp.planets[starLord]) houses.add(chart.kp.planets[starLord].kpHouse);
    // (d) houses it owns
    ownedHouses(planet, chart).forEach((h) => houses.add(h));
    // (c) houses owned by its star lord
    ownedHouses(starLord, chart).forEach((h) => houses.add(h));
    return [...houses].sort((a, b) => a - b);
  }

  // Strength tier of a planet as significator (star lord placement dominates in KP)
  function significatorStrength(planet, chart, targetHouses) {
    const p = chart.kp.planets[planet];
    const starLord = p.nakLord;
    const starHouse = chart.kp.planets[starLord] ? chart.kp.planets[starLord].kpHouse : null;
    let tier = 0; // higher = stronger
    if (targetHouses.includes(starHouse)) tier += 3; // in star of occupant of target house — strongest
    if (targetHouses.includes(p.kpHouse)) tier += 2; // occupant of target house
    const owned = ownedHouses(starLord, chart);
    if (owned.some((h) => targetHouses.includes(h))) tier += 1;
    const ownedSelf = ownedHouses(planet, chart);
    if (ownedSelf.some((h) => targetHouses.includes(h))) tier += 1;
    return tier;
  }

  function cuspSubLord(houseNum, chart) {
    return chart.kp.cusps[houseNum - 1];
  }

  // Is marriage promised? sub-lord of 7th cusp must signify 2/7/11
  function marriagePromise(chart) {
    const cusp7 = cuspSubLord(7, chart);
    const subLord = cusp7.subLord;
    const sigHouses = significatorHouses(subLord, chart);
    const promiseHouses = [2, 7, 11];
    const matched = sigHouses.filter((h) => promiseHouses.includes(h));
    const denialHouses = [1, 6, 10]; // 1 (single/self), 6 (separation/litigation), 10 (against 7th)
    const denials = sigHouses.filter((h) => denialHouses.includes(h));
    let promised = matched.length > 0;
    // refine: if sub-lord signifies more denial than promise, weaken
    let confidence = matched.length * 25 - denials.length * 12 + 25;

    // --- Enhanced checks using KPMarriageRules ---
    const notes = [];

    // Barren sign check on 7th cusp sub-lord
    if (typeof KPMarriageRules !== 'undefined') {
      const subLordSign = chart.kp.planets[subLord] ? chart.kp.planets[subLord].sign : null;
      if (subLordSign !== null && KPMarriageRules.BARREN_SIGNS.includes(subLordSign)) {
        confidence += KPMarriageRules.PROMISE_RULES.weights.barren_sign_penalty;
        notes.push(`Sub-lord ${subLord} in barren sign — weakens marriage promise.`);
      }

      // Fruitful sign bonus
      if (subLordSign !== null && KPMarriageRules.FRUITFUL_SIGNS.includes(subLordSign)) {
        confidence += KPMarriageRules.PROMISE_RULES.weights.fruitful_sign_bonus;
        notes.push(`Sub-lord ${subLord} in fruitful sign — strengthens marriage promise.`);
      }

      // Retrograde sub-lord penalty
      if (KPMarriageRules.RETROGRADE_RULES.sublord_retrograde_weakens) {
        const pData = chart.kp.planets[subLord];
        if (pData && pData.retrograde) {
          confidence += KPMarriageRules.PROMISE_RULES.weights.retrograde_sublord_penalty;
          notes.push(`Sub-lord ${subLord} is retrograde — delays/weakens marriage promise.`);
        }
      }

      // Saturn-Ketu combination denial detection
      if (KPMarriageRules.PROMISE_RULES.saturn_ketu_combo_denial) {
        const saturnSig = significatorHouses('Saturn', chart);
        const ketuSig = significatorHouses('Ketu', chart);
        const saturnLinked = saturnSig.includes(7) || subLord === 'Saturn';
        const ketuLinked = ketuSig.includes(7) || subLord === 'Ketu';
        const hasBarren = subLordSign !== null && KPMarriageRules.BARREN_SIGNS.includes(subLordSign);
        const has6or12 = sigHouses.includes(6) || sigHouses.includes(12);
        if (saturnLinked && ketuLinked && hasBarren && has6or12) {
          confidence += KPMarriageRules.PROMISE_RULES.weights.saturn_ketu_combo_denial;
          promised = false;
          notes.push('Saturn-Ketu combo with barren sign and 6/12 connection — strong denial of marriage.');
        }
      }
    }

    confidence = Math.max(5, Math.min(98, confidence));
    return { subLord, sigHouses, matched, denials, promised, confidence, cusp7, notes };
  }

  // Planets that are strong significators of the marriage houses (2,7,11)
  function marriageSignificators(chart) {
    const targets = [2, 7, 11];
    const list = Astro.PLANETS.map((p) => ({
      planet: p,
      houses: significatorHouses(p, chart),
      strength: significatorStrength(p, chart, targets),
    })).filter((x) => x.strength > 0);
    list.sort((a, b) => b.strength - a.strength);
    return list;
  }

  // Negative/separative significators (6,10,12 from love angle, plus 1)
  function separativeSignificators(chart) {
    const targets = [1, 6, 10];
    const results = Astro.PLANETS.map((p) => ({
      planet: p,
      strength: significatorStrength(p, chart, targets),
    })).filter((x) => x.strength > 1);

    // Extend with node priority rules from KPMarriageRules
    if (typeof KPMarriageRules !== 'undefined') {
      results.forEach((item) => {
        if (item.planet === 'Rahu' || item.planet === 'Ketu') {
          const pData = chart.kp.planets[item.planet];
          // Nodes are stronger than the planet they represent
          if (KPMarriageRules.NODE_RULES.stronger_than_represented) {
            item.strength += 0.5;
          }
          // Check if node is conjoined with separative planet (highest priority)
          const nodeHouse = pData ? pData.kpHouse : null;
          if (nodeHouse) {
            const conjoined = Astro.PLANETS.filter((cp) =>
              cp !== item.planet && chart.kp.planets[cp].kpHouse === nodeHouse
            );
            if (conjoined.length > 0) {
              item.nodePriority = KPMarriageRules.NODE_PRIORITY[0]; // 'conjoined'
            }
          }
        }
      });
    }

    return results;
  }

  function assess(chart) {
    const maps = buildMaps(chart);
    const promise = marriagePromise(chart);
    const sigs = marriageSignificators(chart);
    const seps = separativeSignificators(chart);

    // cusp table for 2,7,11
    const cusps = [2, 7, 11, 5, 8].map((h) => {
      const c = cuspSubLord(h, chart);
      return {
        house: h,
        sign: c.signName,
        deg: c.degInSign,
        nakLord: c.nakLord,
        subLord: c.subLord,
        subSubLord: c.subSubLord,
        subSignifies: significatorHouses(c.subLord, chart),
      };
    });

    let verdict;
    if (promise.confidence >= 65) verdict = { label: 'Marriage Strongly Promised', cls: 'good' };
    else if (promise.confidence >= 45) verdict = { label: 'Marriage Promised', cls: 'good' };
    else if (promise.confidence >= 30) verdict = { label: 'Marriage Indicated with Effort', cls: 'mid' };
    else verdict = { label: 'Weak / Delayed Indication', cls: 'bad' };

    return { promise, significators: sigs, separative: seps, cusps, verdict, maps };
  }

  // Couple-level KP synthesis
  function coupleAssessment(boyChart, girlChart) {
    const b = assess(boyChart);
    const g = assess(girlChart);
    const combined = Math.round((b.promise.confidence + g.promise.confidence) / 2);
    const notes = [];
    notes.push(
      `Boy 7th cusp sub-lord ${b.promise.subLord} signifies houses [${b.promise.sigHouses.join(', ')}] ` +
      `— marriage houses matched: [${b.promise.matched.join(', ') || 'none'}].`
    );
    notes.push(
      `Girl 7th cusp sub-lord ${g.promise.subLord} signifies houses [${g.promise.sigHouses.join(', ')}] ` +
      `— marriage houses matched: [${g.promise.matched.join(', ') || 'none'}].`
    );
    // shared significators (planets that promote marriage in both)
    const bSet = new Set(b.significators.map((s) => s.planet));
    const shared = g.significators.filter((s) => bSet.has(s.planet)).map((s) => s.planet);
    if (shared.length) {
      notes.push(`Common marriage significators in both charts: ${shared.join(', ')} — a positive linking factor.`);
    }
    let verdict;
    if (combined >= 60) verdict = { label: 'KP: Favourable Union', cls: 'good' };
    else if (combined >= 40) verdict = { label: 'KP: Workable Union', cls: 'mid' };
    else verdict = { label: 'KP: Needs Careful Timing', cls: 'bad' };

    return { boy: b, girl: g, combined, verdict, notes };
  }

  // Love marriage indication: checks 5th-7th-11th CSL connection, Venus-Mars links
  function loveMarriageIndication(chart) {
    if (typeof KPMarriageRules === 'undefined') return { indicated: false, score: 0, notes: [] };

    const rules = KPMarriageRules.LOVE_MARRIAGE;
    const notes = [];
    let score = 0;

    // 5th cusp sub-lord must connect to 7th house
    const cusp5 = cuspSubLord(5, chart);
    const cusp7 = cuspSubLord(7, chart);
    const sub5Houses = significatorHouses(cusp5.subLord, chart);
    const sub7Houses = significatorHouses(cusp7.subLord, chart);

    const fifthLinksTo7 = sub5Houses.includes(7);
    const seventhLinksTo5 = sub7Houses.includes(5);

    if (fifthLinksTo7) {
      score += 25;
      notes.push(`5th cusp sub-lord ${cusp5.subLord} signifies 7th house — love leading to marriage link.`);
    }
    if (seventhLinksTo5) {
      score += 25;
      notes.push(`7th cusp sub-lord ${cusp7.subLord} signifies 5th house — romance connected to marriage.`);
    }

    // 11th cusp sub-lord connection to 5 and 7
    const cusp11 = cuspSubLord(11, chart);
    const sub11Houses = significatorHouses(cusp11.subLord, chart);
    if (sub11Houses.includes(5) || sub11Houses.includes(7)) {
      score += 15;
      notes.push(`11th cusp sub-lord ${cusp11.subLord} signifies ${sub11Houses.includes(5) ? '5th' : ''}${sub11Houses.includes(5) && sub11Houses.includes(7) ? ' and ' : ''}${sub11Houses.includes(7) ? '7th' : ''} — fulfilment of love desire.`);
    }

    // Venus as significator of both 5th and 7th
    const venusSig = significatorHouses('Venus', chart);
    if (venusSig.includes(5) && venusSig.includes(7)) {
      score += 20;
      notes.push('Venus signifies both 5th and 7th — strong love marriage karaka.');
    }

    // Venus-Mars link (passion + love)
    const marsSig = significatorHouses('Mars', chart);
    if (venusSig.includes(5) && marsSig.includes(7)) {
      score += 10;
      notes.push('Venus signifies 5th and Mars signifies 7th — passionate love marriage.');
    } else if (venusSig.includes(7) && marsSig.includes(5)) {
      score += 10;
      notes.push('Venus signifies 7th and Mars signifies 5th — romance-driven marriage.');
    }

    // Denial check: 5th CSL signifying 6 (lover withdraws) or 12 (native drops idea)
    if (sub5Houses.includes(6)) {
      score -= 15;
      notes.push(`5th cusp sub-lord ${cusp5.subLord} signifies 6th — ${rules.denial.significator_of_6}.`);
    }
    if (sub5Houses.includes(12)) {
      score -= 12;
      notes.push(`5th cusp sub-lord ${cusp5.subLord} signifies 12th — ${rules.denial.significator_of_12}.`);
    }

    score = Math.max(0, Math.min(100, score));
    return { indicated: score >= 35, score, notes, cusp5SubLord: cusp5.subLord, cusp7SubLord: cusp7.subLord };
  }

  // Second marriage indication: 9th cusp sub-lord signifying 2, 9, 11
  function secondMarriageIndication(chart) {
    if (typeof KPMarriageRules === 'undefined') return { indicated: false, score: 0, notes: [] };

    const rules = KPMarriageRules.SECOND_MARRIAGE;
    const notes = [];
    let score = 0;

    // 9th cusp sub-lord (3rd from 7th = second partner)
    const cusp9 = cuspSubLord(9, chart);
    const sub9Houses = significatorHouses(cusp9.subLord, chart);

    // Check if 9th CSL signifies 2, 9, 11
    const targetHouses = rules.houses; // [2, 9, 11]
    const matched = sub9Houses.filter((h) => targetHouses.includes(h));
    if (matched.length > 0) {
      score += matched.length * 15;
      notes.push(`9th cusp sub-lord ${cusp9.subLord} signifies houses [${matched.join(', ')}] — second marriage houses.`);
    }

    // Condition 1: Dual sign connection
    const cusp7 = cuspSubLord(7, chart);
    const sub7 = cusp7.subLord;
    const sub7Data = chart.kp.planets[sub7];
    const sub7Sign = sub7Data ? sub7Data.sign : null;
    const dualSigns = KPMarriageRules.DUAL_SIGNS;
    let dualCondition = false;

    if (sub7Sign !== null && dualSigns.includes(sub7Sign)) {
      dualCondition = true;
      notes.push(`7th cusp sub-lord ${sub7} in dual sign — plurality indicator.`);
    }
    if (sub7 === 'Mercury') {
      dualCondition = true;
      notes.push('7th cusp sub-lord is Mercury — natural duality/plurality indicator.');
    }
    if (!dualCondition && sub7Data) {
      // Check if sub-lord is in star of planet in/owning dual sign
      const starLord = sub7Data.nakLord;
      const starLordSign = chart.kp.planets[starLord] ? chart.kp.planets[starLord].sign : null;
      if (starLordSign !== null && dualSigns.includes(starLordSign)) {
        dualCondition = true;
        notes.push(`7th cusp sub-lord ${sub7} in star of ${starLord} (in dual sign) — dual connection.`);
      }
    }

    // Condition 2: 7th cusp sub-lord signifies 2 or 11
    const sub7Houses = significatorHouses(sub7, chart);
    const houseCondition = sub7Houses.includes(2) || sub7Houses.includes(11);
    if (houseCondition) {
      notes.push(`7th cusp sub-lord ${sub7} signifies ${sub7Houses.includes(2) ? '2nd' : ''}${sub7Houses.includes(2) && sub7Houses.includes(11) ? ' and ' : ''}${sub7Houses.includes(11) ? '11th' : ''} house.`);
    }

    // Both conditions must be met for strong indication
    if (dualCondition && houseCondition) {
      score += 25;
      notes.push('Both dual sign and house signification conditions met — second marriage strongly indicated.');
    } else if (dualCondition || houseCondition) {
      score += 10;
    }

    score = Math.max(0, Math.min(100, score));
    return { indicated: score >= 30, score, notes, cusp9SubLord: cusp9.subLord, matched };
  }

  // Verify ruling planets: cross-checks timing significators against ruling planets
  function verifyRulingPlanets(chart, significators) {
    if (typeof KPMarriageRules === 'undefined') return { verified: [], rejected: [], agreement: 0 };

    const rpConfig = KPMarriageRules.TRANSIT_TIMING.ruling_planets_verification;
    // Compute ruling planets from chart's current moment
    const rulingPlanets = [];
    // Lagna sign lord
    if (chart.ascendant && chart.ascendant.sign !== undefined) {
      rulingPlanets.push(Astro.RASHI_LORD[chart.ascendant.sign]);
    }
    // Lagna star lord (nakshatra lord of ascendant)
    if (chart.kp && chart.kp.cusps && chart.kp.cusps[0]) {
      const lagnaStarLord = chart.kp.cusps[0].nakLord;
      if (lagnaStarLord) rulingPlanets.push(lagnaStarLord);
    }
    // Moon sign lord
    if (chart.planets && chart.planets.Moon) {
      rulingPlanets.push(Astro.RASHI_LORD[chart.planets.Moon.sign]);
    }
    // Moon star lord
    if (chart.kp && chart.kp.planets && chart.kp.planets.Moon) {
      const moonStarLord = chart.kp.planets.Moon.nakLord;
      if (moonStarLord) rulingPlanets.push(moonStarLord);
    }

    const rpSet = new Set(rulingPlanets);
    const sigPlanets = Array.isArray(significators)
      ? significators.map((s) => (typeof s === 'string' ? s : s.planet))
      : [];

    const verified = sigPlanets.filter((p) => rpSet.has(p));
    const rejected = sigPlanets.filter((p) => !rpSet.has(p));
    const agreement = sigPlanets.length > 0 ? Math.round((verified.length / sigPlanets.length) * 100) : 0;

    return { rulingPlanets: [...rpSet], verified, rejected, agreement };
  }

  return {
    buildMaps, ownedHouses, planetsInStarOf, significatorHouses,
    significatorStrength, marriagePromise, marriageSignificators,
    separativeSignificators, assess, coupleAssessment, cuspSubLord,
    loveMarriageIndication, secondMarriageIndication, verifyRulingPlanets,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = KP;
