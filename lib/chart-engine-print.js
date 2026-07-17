import { escHtml, openPrintWindow } from '@/lib/print-report';

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

function planetRow(p) {
  if (!p) return '';
  const sign = p.sign || (p.sign_index != null ? SIGNS[p.sign_index] : '—');
  const dms = p.dms_in_sign || (p.deg_in_sign != null ? `${Number(p.deg_in_sign).toFixed(2)}°` : '—');
  return `<tr>
    <td>${escHtml(p.name || 'Ascendant')}</td>
    <td>${escHtml(sign)}</td>
    <td>${escHtml(dms)}</td>
    <td>${escHtml(p.longitude != null ? Number(p.longitude).toFixed(4) : '—')}</td>
    <td>${escHtml(p.nakshatra || '—')}</td>
    <td>${escHtml(p.pada ?? '—')}</td>
    <td>${escHtml(p.star_lord || '—')}</td>
    <td>${p.retrograde ? 'R' : '—'}</td>
  </tr>`;
}

export function printChartEngineReport(result, birth) {
  if (!result) return;
  const name = birth?.name || result.input?.name || 'Native';
  const place = birth?.place || result.input?.place || '';
  const meta = `<strong>${escHtml(name)}</strong>${place ? ` · ${escHtml(place)}` : ''}
    · Ayanamsa ${escHtml(String(result.input?.ayanamsa || '').toUpperCase())}
    · JD ${escHtml(result.input?.jd_ut != null ? result.input.jd_ut.toFixed(6) : '—')}`;

  const rows = [planetRow(result.ascendant), ...(result.planets || []).map(planetRow)].join('');

  const body = `
    <div class="summary">
      <p>Ascendant: ${escHtml(
        result.ascendant
          ? `${result.ascendant.sign || SIGNS[result.ascendant.sign_index] || ''} ${
              result.ascendant.deg_in_sign != null ? Number(result.ascendant.deg_in_sign).toFixed(2) + '°' : ''
            }`
          : '—'
      )}</p>
      <p>Engine: Swiss Ephemeris ${escHtml(result.engine?.swe_version || '')}</p>
    </div>
    <h2>D1 Planetary Positions</h2>
    <table>
      <thead><tr><th>Body</th><th>Sign</th><th>DMS</th><th>Longitude</th><th>Nakshatra</th><th>Pada</th><th>Star Lord</th><th>R</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  openPrintWindow('Chart Engine', body, { metaHtml: meta });
}
