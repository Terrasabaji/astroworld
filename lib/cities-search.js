// Server-only city search over the bundled GeoNames cities15000 dataset.
import fs from 'fs';
import path from 'path';

let CITIES = null;

function load() {
  if (CITIES) return CITIES;
  const p = path.join(process.cwd(), 'lib', 'cities-data.json');
  const raw = fs.readFileSync(p, 'utf-8');
  CITIES = JSON.parse(raw);
  return CITIES;
}

// Simple accent-strip for search normalization
function norm(s) {
  return (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Search returns top `limit` matches ranked by (match-quality, population).
export function searchCities(query, limit = 12) {
  const q = norm(query).trim();
  if (!q) return [];
  const cities = load();
  const hits = [];
  for (let i = 0; i < cities.length; i++) {
    const c = cities[i];
    const n = norm(c.n);
    const a = c.a ? norm(c.a) : n;
    let score = 0;
    if (n === q || a === q) score = 4;
    else if (n.startsWith(q) || a.startsWith(q)) score = 3;
    else if ((' ' + n).includes(' ' + q) || (' ' + a).includes(' ' + q)) score = 2;
    else if (n.includes(q) || a.includes(q)) score = 1;
    if (score > 0) hits.push({ score, idx: i });
  }
  hits.sort((x, y) => {
    if (y.score !== x.score) return y.score - x.score;
    return (cities[y.idx].p || 0) - (cities[x.idx].p || 0);
  });
  return hits.slice(0, limit).map(h => cities[h.idx]);
}

/** Nearest bundled city to a lat/lon (haversine), for reverse-filling place after geolocation. */
export function nearestCity(lat, lon) {
  const la = Number(lat);
  const lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
  const cities = load();
  let best = null;
  let bestD = Infinity;
  const toRad = Math.PI / 180;
  const rla = la * toRad;
  for (let i = 0; i < cities.length; i++) {
    const c = cities[i];
    const dLat = (c.la - la) * toRad;
    const dLon = (c.lo - lo) * toRad;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rla) * Math.cos(c.la * toRad) * Math.sin(dLon / 2) ** 2;
    const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}
