import { escHtml, openPrintWindow, listItems } from '@/lib/print-report';

export function printMuhurtaReport(result) {
  if (!result) return;
  const ev = result.event || {};
  const sum = result.summary || {};
  const meta = `<strong>${escHtml(ev.name || 'Muhurta')}</strong>
    · ${escHtml(result.place || '')}
    · Found ${escHtml(sum.total_found)}
    (Excellent ${escHtml(sum.excellent)} · Good ${escHtml(sum.good)} · Suitable ${escHtml(sum.suitable)})`;

  const slots = (result.muhurtas || [])
    .map((m) => {
      const p = m.panchanga || {};
      return `<div class="section">
        <h3>${escHtml((m.local_time || '').replace('T', ' ').slice(0, 16))}
          <span class="tag">${escHtml(m.score)}% · ${escHtml(m.grade)}</span></h3>
        <p>${escHtml(p.weekday)} · ${escHtml(p.tithi?.tithi_name)} (${escHtml(p.tithi?.paksha)}) ·
          ${escHtml(p.nakshatra)} · Lagna ${escHtml(p.lagna)} · Yoga ${escHtml(p.yoga)} ·
          Karana ${escHtml(p.karana)} · Choghadiya ${escHtml(p.choghadiya)} · Hora ${escHtml(p.hora)}</p>
        ${m.strengths?.length ? `<p><strong>Favorable:</strong></p>${listItems(m.strengths)}` : ''}
        ${(m.dosha_details || [])
          .map((d) => `<p><strong>${escHtml(d.dosha)}</strong> — ${escHtml(d.remedy)}</p>`)
          .join('') || '<p>No significant doshas.</p>'}
      </div>`;
    })
    .join('');

  openPrintWindow('Muhurta Finder', `${ev.notes ? `<div class="summary">${escHtml(ev.notes)}</div>` : ''}${slots || '<p>No muhurtas found.</p>'}`, {
    metaHtml: meta,
  });
}
