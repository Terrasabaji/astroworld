/**
 * Adapter: Jyotisa-Suite /api/calculate response → Marriage-Matching chart shape.
 * Used when feeding the core engine chart into marriage module analysis.
 */
const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function houseFromSign(ascSign, planetSign) {
  return ((planetSign - ascSign + 12) % 12) + 1;
}

export function suiteToMarriageChart(calc, meta = {}) {
  const ascSi = calc.ascendant.sign_index;
  const planets = {};
  for (const p of calc.planets) {
    if (p.name === 'Ketu') continue;
    planets[p.name] = {
      lon: p.longitude,
      sign: p.sign_index,
      signName: p.sign,
      degInSign: p.deg_in_sign,
      nakLord: p.nakshatra_lord,
      subLord: p.sub_lord,
      house: houseFromSign(ascSi, p.sign_index),
      retrograde: p.retrograde,
    };
  }
  return {
    input: meta,
    jd: calc.input.jd_ut,
    ayanamsa: calc.input.ayanamsa_value,
    planets,
    ascendant: {
      lon: calc.ascendant.longitude,
      sign: calc.ascendant.sign_index,
      signName: calc.ascendant.sign,
      subLord: calc.ascendant.sub_lord,
      degInSign: calc.ascendant.deg_in_sign,
    },
    cusps: calc.houses.map((h) => ({
      house: h.house,
      lon: h.longitude,
      sign: h.sign_index,
      signName: h.sign,
      subLord: h.sub_lord,
    })),
    kp: null, // KP layer built separately via second calculate call with ayanamsa=kp
  };
}

/** Convert birth record to Marriage-Matching Astro.buildChart input */
export function birthToMarriageInput(birth) {
  return {
    name: birth.name,
    place: birth.place,
    y: birth.year, m: birth.month, d: birth.day,
    hour: birth.hour, min: birth.minute, sec: birth.second || 0,
    tzOffsetHours: birth.tz_offset,
    lat: birth.latitude,
    lonEast: birth.longitude,
  };
}
