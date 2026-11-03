/* =============================================================================
 * separation.js  —  Promise of Separation / Divorce / Widowhood
 *
 * Reads the chart for structural indicators of marital break (separation,
 * divorce) and quality / longevity of married life across THREE views:
 *   - D1 (Rāśi): 7th lord in dusthāna, malefics in 7th/2nd, Maṅgala dosha,
 *     affliction of the kāraka (Venus / Jupiter), 8th-from-7th affliction.
 *   - D9 (Navāṁśa): D9 7th occupants & aspects, D9 7th-lord status, Venus /
 *     Jupiter dignity & affliction in D9, nodes on 1–7, Kuja from D9 lagna,
 *     spouse-longevity (D9 2nd), protective benefics.
 *   - KP: 7th cusp star/sub-lord promise vs denial (2/7/11 vs 1/6/10/12),
 *     Venus/Jupiter significations, strong separative significators of 6/8/12,
 *     Saturn–Ketu–Mars divorce links, widowhood (maraka + 8th).
 *
 * It also returns a weighted map of "separative planets" — planets whose
 * dasha periods can TRIGGER the promised event. The relationship-strength
 * engine penalises commitment more heavily when such a dasha lord is running
 * AND transits are simultaneously adverse.
 * ========================================================================== */

const Separation = (function () {
  'use strict';

  const MAL = ['Mars', 'Saturn', 'Rahu', 'Ketu', 'Sun'];
  const BEN = ['Jupiter', 'Venus', 'Mercury', 'Moon'];
  const REAL = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

  function aspectsHouse(planet, fromHouse, targetHouse) {
    return Astro.aspectsHouses(planet).some((a) => (((fromHouse - 1 + a - 1) % 12) + 1) === targetHouse);
  }

  // malefics conjunct or aspecting a given planet
  function afflictorsOfPlanet(target, chart) {
    const th = chart.planets[target].house;
    const res = [];
    ['Mars', 'Saturn', 'Rahu', 'Ketu'].forEach((m) => {
      if (m === target) return;
      const mh = chart.planets[m].house;
      if (mh === th) res.push(m);
      else if (aspectsHouse(m, mh, th)) res.push(m);
    });
    return res;
  }

  // Maṅgala (Kuja) Dosha: Mars in 1/2/4/7/8/12 from Lagna, Moon or Venus
  function mangalDosha(chart) {
    const marsSign = chart.planets.Mars.sign;
    const refs = { Lagna: chart.ascendant.sign, Moon: chart.planets.Moon.sign, Venus: chart.planets.Venus.sign };
    const doshaHouses = [1, 2, 4, 7, 8, 12];
    const hit = [];
    for (const k in refs) {
      const h = ((marsSign - refs[k] + 12) % 12) + 1;
      if (doshaHouses.includes(h)) hit.push(`${k} (${h}H)`);
    }
    return hit.length ? hit.join(', ') : null;
  }

  function navMap(chart) {
    const m = { lagna: ChartDraw.navamsaSign(chart.ascendant.lon) };
    Astro.PLANETS.forEach((p) => { m[p] = ChartDraw.navamsaSign(chart.planets[p].lon); });
    return m;
  }

  /** Whole-sign house of a D9 sign from D9 lagna (1–12). */
  function d9HouseOf(signIdx, navLagna) {
    return ((signIdx - navLagna + 12) % 12) + 1;
  }

  function dignityLabel(planet, signIdx) {
    if (Astro.EXALT[planet] === signIdx) return 'exalted';
    if (Astro.DEBIL[planet] === signIdx) return 'debilitated';
    if ((Astro.OWN[planet] || []).includes(signIdx)) return 'in own sign';
    return null;
  }

  /** Malefics conjunct or aspecting a planet in the D9 (by D9 house). */
  function d9Afflictors(target, nav) {
    const th = d9HouseOf(nav[target], nav.lagna);
    const res = [];
    ['Mars', 'Saturn', 'Rahu', 'Ketu'].forEach((m) => {
      if (m === target) return;
      const mh = d9HouseOf(nav[m], nav.lagna);
      if (mh === th) res.push(m);
      else if (aspectsHouse(m, mh, th)) res.push(m);
    });
    return res;
  }

  function analyze(chart, gender) {
    const lagna = chart.ascendant.sign;
    const lordOf = (h) => Astro.RASHI_LORD[(lagna + h - 1) % 12];
    const sep = {};
    const add = (p, x) => { if (p && REAL.includes(p)) sep[p] = (sep[p] || 0) + x; };
    const d1 = [], d9 = [], kp = [];
    let sepScore = 0, divScore = 0, widScore = 0;

    const seventhL = lordOf(7), sixthL = lordOf(6), eighthL = lordOf(8), twelfthL = lordOf(12);

    /* ---------- D1 (Rāśi) ---------- */
    const sl = chart.planets[seventhL];
    if ([6, 8, 12].includes(sl.house)) {
      d1.push(`7th lord ${seventhL} placed in dusthāna (H${sl.house}) — undermines partnership stability.`);
      add(seventhL, 1.0); sepScore += 18; divScore += 14;
    }
    // malefics in 7th
    const occ7 = Astro.PLANETS.filter((p) => chart.planets[p].house === 7);
    occ7.forEach((p) => {
      if (MAL.includes(p)) {
        const w = p === 'Mars' ? 1.2 : (p === 'Saturn' ? 1.0 : (p === 'Rahu' || p === 'Ketu' ? 0.9 : 0.7));
        add(p, w);
        d1.push(`${p} occupies the 7th house — ${p === 'Mars' ? 'friction/anger' : p === 'Saturn' ? 'coldness/distance' : p === 'Rahu' ? 'unconventional pulls/deception' : p === 'Ketu' ? 'detachment' : 'ego clashes'} in marriage.`);
        sepScore += 12;
        if (p === 'Mars' || p === 'Rahu') divScore += 12;
        if (p === 'Saturn' || p === 'Sun') widScore += 8;
      }
    });
    // 6/8/12 lords are inherently separative (their dashas can trigger)
    add(sixthL, 0.8); add(twelfthL, 0.7); add(eighthL, 0.9);
    // 7th lord conjunct/aspected by 6/8/12 lord
    [sixthL, eighthL, twelfthL].forEach((dl) => {
      if (!dl || dl === seventhL) return;
      const dh = chart.planets[dl].house;
      if (dh === sl.house) { d1.push(`7th lord ${seventhL} conjunct ${dl} (dusthāna lord) — separative link.`); sepScore += 6; }
      else if (aspectsHouse(dl, dh, sl.house)) { d1.push(`7th lord ${seventhL} aspected by ${dl} (dusthāna lord).`); sepScore += 4; }
    });
    // Venus (kāraka) affliction
    const vA = afflictorsOfPlanet('Venus', chart);
    if (vA.length) { vA.forEach((p) => add(p, 0.6)); d1.push(`Venus (marriage kāraka) afflicted by ${vA.join(', ')} — love/harmony under strain.`); divScore += 10; sepScore += 8; }
    if (gender === 'female') {
      const jA = afflictorsOfPlanet('Jupiter', chart);
      if (jA.length) { jA.forEach((p) => add(p, 0.5)); d1.push(`Jupiter (husband kāraka) afflicted by ${jA.join(', ')}.`); widScore += 8; }
    }
    // Maṅgala (Kuja) Dosha — with cancellation (Bhaṅga) from D1
    if (typeof KujaDosha !== 'undefined') {
      const kj = KujaDosha.analyze(chart);
      if (kj.present && kj.netIntensity >= 12) {
        add('Mars', 0.5 + (kj.netIntensity / 100) * 1.0);
        d1.push(`Maṅgala (Kuja) Dosha — Mars ${kj.fromText} (net intensity ${kj.netIntensity}/100${kj.reductionPct ? `, reduced ${kj.reductionPct}% by Bhaṅga` : ''}) — discord/aggression risk.`);
        divScore += Math.round(kj.netIntensity * 0.2); sepScore += Math.round(kj.netIntensity * 0.14);
      } else if (kj.present) {
        d1.push(`Maṅgala (Kuja) Dosha present but cancelled (Bhaṅga): ${kj.reasons.slice(0, 2).join('; ') || 'low intensity'} — minimal marital impact.`);
      }
    } else {
      const md = mangalDosha(chart);
      if (md) { d1.push(`Maṅgala (Kuja) Dosha — Mars in ${md} — discord/aggression risk.`); add('Mars', 0.8); divScore += 12; sepScore += 8; }
    }
    // 8th-from-7th (= 2nd house) affliction → longevity of spouse
    const occ2 = Astro.PLANETS.filter((p) => chart.planets[p].house === 2);
    const mal2 = occ2.filter((p) => MAL.includes(p));
    if (mal2.length) { d1.push(`Malefic(s) ${mal2.join(', ')} in the 2nd (8th-from-7th, spouse longevity) — health/longevity caution for spouse.`); mal2.forEach((p) => add(p, 0.5)); widScore += 10; }

    /* ---------- D9 (Navāṁśa) — marriage quality + separation ---------- */
    const nav = navMap(chart);
    const navLagna = nav.lagna;
    const nav7Sign = (navLagna + 6) % 12;
    const d9Lord7 = Astro.RASHI_LORD[nav7Sign];
    const d9H = (p) => d9HouseOf(nav[p], navLagna);

    d9.push(`Navāṁśa Lagna in ${SIGN_NAMES[navLagna]} — D9 sets the dharmic quality of married life.`);

    // Occupants of D9 7th (benefic + malefic)
    const d9Occ7 = Astro.PLANETS.filter((p) => nav[p] === nav7Sign);
    if (d9Occ7.length) {
      d9Occ7.forEach((p) => {
        if (MAL.includes(p)) {
          add(p, 0.7);
          d9.push(`${p} in the Navāṁśa 7th (${SIGN_NAMES[nav7Sign]}) — afflicts the inner/dharmic marriage (D9).`);
          sepScore += 8;
          if (p === 'Mars' || p === 'Rahu') divScore += 8;
          if (p === 'Saturn' || p === 'Sun') widScore += 6;
        } else if (BEN.includes(p)) {
          d9.push(`${p} in the Navāṁśa 7th — supports marital harmony / spouse dignity in D9.`);
          divScore = Math.max(0, divScore - 4);
          sepScore = Math.max(0, sepScore - 3);
        } else {
          d9.push(`${p} occupies the Navāṁśa 7th — colours spouse nature and partnership style.`);
        }
      });
    } else {
      d9.push(`Navāṁśa 7th (${SIGN_NAMES[nav7Sign]}) empty of planets — quality judged from D9 7th-lord ${d9Lord7} and aspects.`);
    }

    // Malefics aspecting D9 7th
    MAL.forEach((p) => {
      if (nav[p] === nav7Sign) return;
      const mh = d9H(p);
      if (aspectsHouse(p, mh, 7)) {
        add(p, 0.45);
        d9.push(`${p} aspects the Navāṁśa 7th from D9 H${mh} — pressure on marital peace.`);
        sepScore += 5;
        if (p === 'Mars' || p === 'Saturn') divScore += 4;
      }
    });

    // D9 7th lord placement & dignity
    if (d9Lord7 && nav[d9Lord7] != null) {
      const lh = d9H(d9Lord7);
      const dig = dignityLabel(d9Lord7, nav[d9Lord7]);
      const digTxt = dig ? ` (${dig} in ${SIGN_NAMES[nav[d9Lord7]]})` : ` in ${SIGN_NAMES[nav[d9Lord7]]}`;
      if ([6, 8, 12].includes(lh)) {
        add(d9Lord7, 0.85);
        d9.push(`D9 7th-lord ${d9Lord7}${digTxt} falls in dusthāna D9 H${lh} — weakens marriage promise at the Navāṁśa level.`);
        sepScore += 10; divScore += 8;
      } else if ([1, 4, 5, 7, 9, 10, 11].includes(lh)) {
        d9.push(`D9 7th-lord ${d9Lord7}${digTxt} in D9 H${lh} — ${lh === 7 ? 'strong self-contained marriage focus' : 'supports continuity of married life'}.`);
        if (dig === 'exalted' || dig === 'in own sign') {
          divScore = Math.max(0, divScore - 5);
          sepScore = Math.max(0, sepScore - 4);
        }
      } else {
        d9.push(`D9 7th-lord ${d9Lord7}${digTxt} placed in D9 H${lh} — mixed influence on marriage quality.`);
      }
      const lordAff = d9Afflictors(d9Lord7, nav);
      if (lordAff.length) {
        lordAff.forEach((p) => add(p, 0.4));
        d9.push(`D9 7th-lord ${d9Lord7} afflicted in Navāṁśa by ${lordAff.join(', ')} — spouse happiness under strain.`);
        sepScore += 6; divScore += 5;
      }
    }

    // Venus in D9 — primary marriage kāraka
    {
      const vh = d9H('Venus');
      const vDig = dignityLabel('Venus', nav.Venus);
      if (vDig === 'debilitated') {
        d9.push(`Venus debilitated in Navāṁśa (${SIGN_NAMES[nav.Venus]}, D9 H${vh}) — weakened marital significator; love/comfort strained.`);
        divScore += 8; sepScore += 5; add('Venus', 0.3);
      } else if (vDig === 'exalted') {
        d9.push(`Venus exalted in Navāṁśa (${SIGN_NAMES[nav.Venus]}, D9 H${vh}) — protective for marriage quality (mitigates).`);
        divScore = Math.max(0, divScore - 6); sepScore = Math.max(0, sepScore - 4);
      } else if (vDig === 'in own sign') {
        d9.push(`Venus in own sign in Navāṁśa (${SIGN_NAMES[nav.Venus]}, D9 H${vh}) — supports affection and marital contentment.`);
        divScore = Math.max(0, divScore - 3);
      } else {
        d9.push(`Venus in Navāṁśa ${SIGN_NAMES[nav.Venus]} (D9 H${vh}) — sets tone of intimacy and partnership comfort.`);
      }
      if ([6, 8, 12].includes(vh)) {
        add('Venus', 0.5);
        d9.push(`Venus in dusthāna from D9 Lagna (H${vh}) — marital happiness / bed comfort challenged in D9.`);
        sepScore += 7; divScore += 6;
      } else if (vh === 7) {
        d9.push('Venus in Navāṁśa 7th — strong focus on partner; marriage is a life theme.');
      }
      const vAff = d9Afflictors('Venus', nav);
      if (vAff.length) {
        vAff.forEach((p) => add(p, 0.55));
        d9.push(`Venus afflicted in Navāṁśa by ${vAff.join(', ')} — harmony, desire, and spouse rapport under pressure.`);
        divScore += 8; sepScore += 6;
      }
    }

    // Jupiter in D9 (husband kāraka for female; general dharma for all)
    {
      const jh = d9H('Jupiter');
      const jDig = dignityLabel('Jupiter', nav.Jupiter);
      const jAff = d9Afflictors('Jupiter', nav);
      if (gender === 'female' || jAff.length || jDig === 'debilitated' || [6, 8, 12].includes(jh)) {
        if (jDig === 'debilitated') {
          d9.push(`Jupiter debilitated in Navāṁśa (${SIGN_NAMES[nav.Jupiter]}, D9 H${jh}) — ${gender === 'female' ? 'husband-kāraka weakened' : 'dharma/guidance in marriage weakened'}.`);
          widScore += 6; sepScore += 4;
        } else {
          d9.push(`Jupiter in Navāṁśa ${SIGN_NAMES[nav.Jupiter]} (D9 H${jh})${jDig ? ` (${jDig})` : ''}${gender === 'female' ? ' — husband kāraka status' : ''}.`);
        }
        if (jAff.length) {
          jAff.forEach((p) => add(p, 0.45));
          d9.push(`Jupiter afflicted in Navāṁśa by ${jAff.join(', ')} — ${gender === 'female' ? 'husband fortune / spouse dignity challenged' : 'wisdom and marital ethics under strain'}.`);
          if (gender === 'female') widScore += 6;
          sepScore += 5;
        }
        if ([6, 8, 12].includes(jh)) {
          d9.push(`Jupiter in dusthāna from D9 Lagna (H${jh}) — reduced protective grace for marriage.`);
          sepScore += 4;
        }
      } else if (jDig === 'exalted' || jDig === 'in own sign') {
        d9.push(`Jupiter ${jDig} in Navāṁśa (${SIGN_NAMES[nav.Jupiter]}, D9 H${jh}) — protective dharmic support for marriage.`);
        sepScore = Math.max(0, sepScore - 3);
      }
    }

    // Nodes on D9 1–7 axis
    ['Rahu', 'Ketu'].forEach((node) => {
      const h = d9H(node);
      if (h === 1 || h === 7) {
        add(node, 0.75);
        d9.push(`${node} on the Navāṁśa ${h === 7 ? '7th' : 'Lagna (1st)'} — karmic / unconventional pull on marriage axis.`);
        sepScore += 7; divScore += 5;
      }
    });

    // D1 7th lord in D9
    if (seventhL && nav[seventhL] != null) {
      const h7l = d9H(seventhL);
      d9.push(`D1 7th-lord ${seventhL} falls in Navāṁśa ${SIGN_NAMES[nav[seventhL]]} (D9 H${h7l}) — shows how the marriage promise matures.`);
      if ([6, 8, 12].includes(h7l)) {
        add(seventhL, 0.5);
        d9.push(`D1 7th-lord ${seventhL} in D9 dusthāna H${h7l} — marriage results obstructed at the Navāṁśa level.`);
        sepScore += 6; divScore += 5;
      }
    }

    // Kuja from D9 Lagna / D9 Moon / D9 Venus
    {
      const marsHFrom = (refSign) => ((nav.Mars - refSign + 12) % 12) + 1;
      const kujaHouses = [1, 2, 4, 7, 8, 12];
      const hits = [];
      const fromL = marsHFrom(navLagna);
      const fromMo = marsHFrom(nav.Moon);
      const fromVe = marsHFrom(nav.Venus);
      if (kujaHouses.includes(fromL)) hits.push(`D9 Lagna (${fromL}H)`);
      if (kujaHouses.includes(fromMo)) hits.push(`D9 Moon (${fromMo}H)`);
      if (kujaHouses.includes(fromVe)) hits.push(`D9 Venus (${fromVe}H)`);
      if (hits.length) {
        add('Mars', 0.55);
        d9.push(`Maṅgala influence in Navāṁśa — Mars from ${hits.join(', ')} — friction / heat in married life (D9).`);
        divScore += 6; sepScore += 5;
      }
    }

    // D9 2nd = 8th-from-7th (spouse longevity)
    {
      const malD9_2 = Astro.PLANETS.filter((p) => d9H(p) === 2 && MAL.includes(p));
      if (malD9_2.length) {
        malD9_2.forEach((p) => add(p, 0.45));
        d9.push(`Malefic(s) ${malD9_2.join(', ')} in Navāṁśa 2nd (8th-from-7th) — spouse health / longevity caution in D9.`);
        widScore += 8;
      }
    }

    /* ---------- KP — promise, denial, quality & separation ---------- */
    try {
      const promise = KP.marriagePromise(chart);
      const subSig = KP.significatorHouses(promise.subLord, chart);
      const cusp7 = promise.cusp7 || chart.kp.cusps[6];
      const starLord = cusp7?.nakLord || cusp7?.starLord;
      const promiseHits = subSig.filter((h) => [2, 7, 11].includes(h));
      const denialHits = subSig.filter((h) => [1, 6, 10].includes(h));
      const sepHits = subSig.filter((h) => [6, 12].includes(h));

      kp.push(`7th cusp sub-lord is ${promise.subLord} — signifies houses [${subSig.join(', ')}] (KP).`);
      if (starLord) {
        const starSig = KP.significatorHouses(starLord, chart);
        kp.push(`7th cusp star-lord is ${starLord} — signifies [${starSig.join(', ')}] (sets marriage timing/quality flavour).`);
      }

      if (promiseHits.length) {
        kp.push(`Marriage promise houses [${promiseHits.join(', ')}] linked to 7th CSL ${promise.subLord} — union/fulfilment supported (2/7/11).`);
      } else {
        kp.push(`7th CSL ${promise.subLord} does not signify 2/7/11 — weak KP promise of lasting marital fulfilment.`);
        sepScore += 8; divScore += 6;
      }
      if (promise.promised === false) {
        kp.push(`KP marriage promise assessed as denied/weak (confidence ${promise.confidence}).`);
        sepScore += 6;
      } else if (promise.confidence != null) {
        kp.push(`KP marriage promise confidence ≈ ${promise.confidence}% (${promise.promised ? 'promised' : 'not clearly promised'}).`);
      }
      (promise.notes || []).forEach((n) => kp.push(n));

      if (subSig.includes(6)) { kp.push(`7th cusp sub-lord ${promise.subLord} signifies the 6th — separation / legal disputes / enmity with partner.`); add(promise.subLord, 1.0); sepScore += 14; divScore += 14; }
      if (subSig.includes(12)) { kp.push(`7th cusp sub-lord ${promise.subLord} signifies the 12th — separation / life apart / bed-loss.`); add(promise.subLord, 0.9); sepScore += 12; }
      if (subSig.includes(8)) { kp.push(`7th cusp sub-lord ${promise.subLord} signifies the 8th — disharmony, sudden breaks, or spouse-related crises.`); add(promise.subLord, 0.5); widScore += 4; sepScore += 5; }
      if (subSig.includes(1) || subSig.includes(10)) {
        const parts = [];
        if (subSig.includes(1)) parts.push('1st (self over union)');
        if (subSig.includes(10)) parts.push('10th (against the 7th)');
        kp.push(`7th cusp sub-lord ${promise.subLord} signifies ${parts.join(' and ')} — works against togetherness.`);
        add(promise.subLord, 0.6); sepScore += 8;
      }
      if (denialHits.length && promiseHits.length) {
        kp.push(`Dual signification: 7th CSL links both fulfilment [${promiseHits.join(', ')}] and denial/separation [${denialHits.concat(sepHits).filter((v, i, a) => a.indexOf(v) === i).join(', ')}] — unstable / conditional married life.`);
        sepScore += 6; divScore += 5;
      }

      // Venus & Jupiter as KP significators of marriage vs separation
      ['Venus', 'Jupiter'].forEach((karaka) => {
        const sig = KP.significatorHouses(karaka, chart);
        const good = sig.filter((h) => [2, 7, 11].includes(h));
        const bad = sig.filter((h) => [1, 6, 8, 10, 12].includes(h));
        if (good.length || bad.length) {
          kp.push(`${karaka} (kāraka) signifies [${sig.join(', ')}] — ${good.length ? `supports marriage via ${good.join('/')}` : 'little direct 2/7/11 support'}${bad.length ? `; also tied to ${bad.join('/')} (stress/separation)` : ''}.`);
        }
        if (bad.includes(6) || bad.includes(12)) {
          add(karaka, 0.35);
          sepScore += 4; divScore += 3;
        }
      });

      // Enhanced KP separation rules
      if (typeof KPMarriageRules !== 'undefined') {
        if (subSig.includes(6) && subSig.includes(12)) {
          kp.push(`7th cusp sub-lord ${promise.subLord} signifies BOTH 6th and 12th — definite separation indicated.`);
          add(promise.subLord, 0.5); sepScore += 10; divScore += 12;
        }

        const widowhoodHouses = KPMarriageRules.SEPARATION_RULES.widowhood_houses; // [2, 7]
        const subSignifiesMaraka = subSig.filter((h) => widowhoodHouses.includes(h));
        if (subSignifiesMaraka.length > 0 && subSig.includes(8)) {
          kp.push(`7th cusp sub-lord ${promise.subLord} signifies maraka houses [${subSignifiesMaraka.join(', ')}] AND 8th — widowhood / spouse-loss risk.`);
          widScore += 15;
          add(promise.subLord, 0.8);
        }

        // 2nd cusp CSL — family / spouse longevity flavour
        try {
          const cusp2 = chart.kp.cusps[1];
          if (cusp2?.subLord) {
            const sig2 = KP.significatorHouses(cusp2.subLord, chart);
            kp.push(`2nd cusp sub-lord ${cusp2.subLord} signifies [${sig2.join(', ')}] — family continuity / spouse-resource axis.`);
            if (sig2.includes(7) && (sig2.includes(6) || sig2.includes(12) || sig2.includes(8))) {
              kp.push(`2nd CSL linked to 7th and stress houses — married-life quality unstable from family/status angle.`);
              sepScore += 4;
            }
          }
        } catch (e2) { /* optional */ }

        // Saturn / Mars / Ketu divorce-formula links to 6–7–12
        const rolePlanets = [
          { p: 'Saturn', label: 'delay, coldness, forced distance' },
          { p: 'Mars', label: 'quarrels, bold break, litigation heat' },
          { p: 'Ketu', label: 'exit, detachment, sudden cut' },
        ];
        rolePlanets.forEach(({ p, label }) => {
          const sig = KP.significatorHouses(p, chart);
          const link = sig.filter((h) => [6, 7, 12].includes(h));
          if (link.length >= 2) {
            add(p, 0.4);
            kp.push(`${p} signifies [${sig.join(', ')}] with strong 6/7/12 link [${link.join(', ')}] — ${label} in KP divorce/separation formula.`);
            sepScore += 5; divScore += 4;
          }
        });

        if (KPMarriageRules.RETROGRADE_RULES?.significator_retrograde_delays) {
          Astro.PLANETS.forEach((p) => {
            const pData = chart.kp.planets[p];
            if (pData && pData.retrograde) {
              const pSig = KP.significatorHouses(p, chart);
              const isSeparative = pSig.includes(6) || pSig.includes(12) || pSig.includes(8);
              if (isSeparative) {
                kp.push(`${p} (retrograde) signifies separative house(s) [${pSig.filter((h) => [6, 8, 12].includes(h)).join(', ')}] — delayed but intensified separation trigger.`);
                add(p, 0.3);
                sepScore += 4;
              }
            }
          });
        }
      }

      // Strong KP significators of 6/8/12 — list them (previously scored but never shown)
      const sepSigList = [];
      Astro.PLANETS.forEach((p) => {
        const sig = KP.significatorHouses(p, chart);
        let s = 0;
        const hit = [];
        if (sig.includes(6)) { s += 0.5; hit.push(6); }
        if (sig.includes(12)) { s += 0.4; hit.push(12); }
        if (sig.includes(8)) { s += 0.4; hit.push(8); widScore += 2; }
        if (s > 0) add(p, s);
        const strength = typeof KP.significatorStrength === 'function'
          ? KP.significatorStrength(p, chart, [6, 8, 12])
          : s;
        if (strength >= 2 || s >= 0.8) {
          sepSigList.push(`${p}→[${hit.join(',')}]`);
        }
      });
      if (sepSigList.length) {
        kp.push(`Strong KP separative significators (6/8/12): ${sepSigList.join('; ')} — their daśās can trigger marital stress.`);
      }
    } catch (e) {
      kp.push('KP indicators unavailable for this chart (cusp/sub-lord data missing).');
    }

    sepScore = Math.min(100, sepScore);
    divScore = Math.min(100, divScore);
    widScore = Math.min(100, widScore);
    const overallRisk = Math.min(100, Math.round(sepScore * 0.4 + divScore * 0.4 + widScore * 0.2));

    let verdict;
    if (overallRisk >= 60) verdict = { label: 'High Separation Risk', cls: 'bad' };
    else if (overallRisk >= 38) verdict = { label: 'Moderate Risk', cls: 'mid' };
    else if (overallRisk >= 20) verdict = { label: 'Mild Indications', cls: 'mid' };
    else verdict = { label: 'Low Risk', cls: 'good' };

    return {
      separativePlanets: sep,
      d1Factors: d1, d9Factors: d9, kpFactors: kp,
      separation: sepScore, divorce: divScore, widowhood: widScore,
      overallRisk, verdict, nav,
    };
  }

  // Couple-level (max of the two charts drives caution)
  function couple(boyChart, girlChart) {
    const b = analyze(boyChart, 'male');
    const g = analyze(girlChart, 'female');
    const combined = Math.round(Math.max(b.overallRisk, g.overallRisk) * 0.6 + ((b.overallRisk + g.overallRisk) / 2) * 0.4);
    return { boy: b, girl: g, combined };
  }

  return { analyze, couple, mangalDosha, afflictorsOfPlanet };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Separation;
