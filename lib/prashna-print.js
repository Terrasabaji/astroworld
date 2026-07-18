import { escHtml, openPrintWindow, listItems } from '@/lib/print-report';

export function printPrashnaReport(report) {
  if (!report) return;
  const title = report.prashna_type || (report.mode === 'mooka' ? 'Mooka Prashna' : 'Manual Prashna');
  const meta = `<strong>${escHtml(title)}</strong>
    · Promise: ${escHtml(String(report.the_promise_result))}
    ${report.delay_status ? ` · ${escHtml(report.delay_status)}` : ''}
    · ${escHtml(report.chart?.input?.date || '')} ${escHtml(report.chart?.input?.time || '')}`;

  const planets = (report.chart?.planets || [])
    .map(
      (p) => `<tr><td>${escHtml(p.name)}</td><td>${escHtml(p.sign)}</td><td>${escHtml(p.house)}</td>
      <td>${escHtml(p.star_lord)}</td><td>${escHtml(p.sub_lord)}</td><td>${p.retrograde ? 'R' : '—'}</td></tr>`
    )
    .join('');

  const body = `
    <div class="summary">
      ${report.deduced_query ? `<p><strong>Deduced query:</strong> ${escHtml(report.deduced_query)}</p>` : ''}
      ${report.parsed_query ? `<p><strong>Parsed:</strong> ${escHtml(report.parsed_query.question_text || '—')} · ${escHtml(report.parsed_query.label)} · H${escHtml(report.primary_house)}</p>` : ''}
      <p><strong>Timing:</strong> ${escHtml(report.timing_prediction)}</p>
    </div>
    <h2>Astrological justification</h2>
    <p>${escHtml(report.astrological_justification)}</p>
    <h2>KP Engine</h2>
    <p>CSL: ${escHtml(report.kp?.promise?.cuspal_sub_lord)} → star ${escHtml(report.kp?.promise?.csl_star_lord)}</p>
    <p>Favorable: ${escHtml((report.kp?.promise?.favorable_hits || []).join(', ') || '—')}</p>
    <p>Denial: ${escHtml((report.kp?.promise?.denial_hits || []).join(', ') || '—')}</p>
    <h2>Parashara Engine</h2>
    <p>Karaka ${escHtml(report.parashara?.karaka_dignity?.planet)}: D1 ${escHtml(report.parashara?.karaka_dignity?.d1_status)} / D9 ${escHtml(report.parashara?.karaka_dignity?.d9_status)}</p>
    ${listItems(report.parashara?.tajika?.notes || [])}
    <h2>Chart snapshot</h2>
    <p>Asc ${escHtml(report.chart?.ascendant?.sign)} ${escHtml(report.chart?.ascendant?.dms)}
      ${report.chart?.horary_number ? ` · Horary #${escHtml(report.chart.horary_number)}` : ''}</p>
    <table><thead><tr><th>Body</th><th>Sign</th><th>H</th><th>Star</th><th>Sub</th><th>R</th></tr></thead>
    <tbody>${planets}</tbody></table>
    ${
      report.mooka?.candidates?.length
        ? `<h2>Mooka candidates</h2>${listItems(report.mooka.candidates, (c) => `${escHtml(c.question)} (${escHtml(c.score)})`)}`
        : ''
    }`;

  openPrintWindow(title, body, { metaHtml: meta });
}
