import { escHtml, openPrintWindow, listItems } from '@/lib/print-report';

function adviceBlock(title, advice, isCareer) {
  if (!advice) return '';
  const items = isCareer ? advice.fields : advice.streams;
  const itemHtml = (items || [])
    .map(
      (s) => `<div class="section"><h3>${escHtml(s.title)} <span class="tag">score ${escHtml(s.score)}</span></h3>
      ${listItems(s.drivers || [])}</div>`
    )
    .join('');

  const ratings = isCareer
    ? `<p>Earning: ${escHtml(advice.earning_rating)}/5 · Satisfaction: ${escHtml(advice.satisfaction_rating)}/5 · Path: ${escHtml(advice.job_vs_business)}</p>
       ${advice.earning_explanation ? `<p>${escHtml(advice.earning_explanation)}</p>` : ''}
       ${advice.satisfaction_explanation ? `<p>${escHtml(advice.satisfaction_explanation)}</p>` : ''}`
    : `<p>Higher education: ${advice.higher_education_likely ? 'Likely' : 'Moderate'} · Promised: ${advice.promised ? 'Yes' : 'Conditional'}</p>
       ${advice.strength_summary ? `<p>${escHtml(advice.strength_summary)}</p>` : ''}`;

  const notes = [
    ['KP Notes', advice.kp_notes],
    ['Parashara Notes', advice.parashara_notes],
    ['Yogas', advice.yogas],
    ['Shadbala Notes', advice.shadbala_notes],
  ]
    .filter(([, arr]) => arr?.length)
    .map(([label, arr]) => `<h3>${escHtml(label)}</h3>${listItems(arr)}`)
    .join('');

  const remedies = (advice.remedies || [])
    .map((r) => {
      const measures = Array.isArray(r.measures)
        ? r.measures.map((m) => escHtml(typeof m === 'string' ? m : JSON.stringify(m)))
        : Object.entries(r.measures || {}).map(([k, m]) => `${escHtml(k)}: ${escHtml(typeof m === 'string' ? m : JSON.stringify(m))}`);
      return `<div class="section"><strong>${escHtml(r.planet)}</strong><p>${escHtml(r.reason)}</p>${listItems(measures)}</div>`;
    })
    .join('');

  return `
    <h2>${escHtml(title)}</h2>
    <div class="summary">${ratings}
      ${advice.key_planets?.length ? `<p>Key planets: ${escHtml(advice.key_planets.join(', '))}</p>` : ''}
      ${isCareer && advice.linked_fields?.length ? `<p>Linked fields: ${escHtml(advice.linked_fields.join(', '))}</p>` : ''}
    </div>
    ${itemHtml}
    ${notes}
    ${advice.divisional_summary ? `<p><strong>Divisional:</strong> ${escHtml(advice.divisional_summary)}</p>` : ''}
    ${remedies ? `<h3>Remedies</h3>${remedies}` : ''}`;
}

function periodsBlock(title, periods) {
  if (!periods?.length) return '';
  return `<h2>${escHtml(title)} — Best Periods</h2>${listItems(periods, (p) => {
    const chain = escHtml(p.chain || p.period || '');
    const range = p.start ? ` (${escHtml(p.start)} → ${escHtml(p.end)})` : '';
    return `${chain}${range}: ${escHtml(p.note || p.reason || '')}`;
  })}`;
}

function faqsBlock(faqs) {
  if (!faqs?.length) return '';
  return `<h2>FAQs</h2>${faqs
    .map(
      (f) => `<div class="section"><h3>${escHtml(f.question)} <span class="tag">${escHtml(f.verdict)}</span></h3>
      <p>${escHtml(f.summary)}</p>
      ${f.kp_basis ? `<p><strong>KP:</strong> ${escHtml(f.kp_basis)}</p>` : ''}
      ${f.parashara_basis ? `<p><strong>Parashara:</strong> ${escHtml(f.parashara_basis)}</p>` : ''}
      ${listItems(f.timeline || [], (w) => `${escHtml(w.chain)}: ${escHtml(w.start)} → ${escHtml(w.end)} — ${escHtml(w.note)}`)}
      </div>`
    )
    .join('')}`;
}

export function printAdviserReport(report) {
  if (!report) return;
  const b = report.birth || {};
  const n = report.native || {};
  const meta = `<strong>${escHtml(b.name || n.name || 'Native')}</strong>
    · age ${escHtml(n.current_age)} (${escHtml(n.life_stage)})
    · Lagna KP ${escHtml(report.lagna?.kp?.sign)} / ${escHtml(report.lagna?.kp?.sub_lord)}
    · Current dasha ${escHtml(report.current_dasha?.mahadasha)} / ${escHtml(report.current_dasha?.antardasha)} / ${escHtml(report.current_dasha?.pratyantardasha)}`;

  const transits = report.transits
    ? `<h2>Transits</h2>
      <p>As of ${escHtml(report.transits.as_of)} · Sade Sati: ${report.transits.sade_sati ? 'Active' : 'Not active'}</p>
      <p>${escHtml(report.transits.education_trigger)}</p>
      <p>${escHtml(report.transits.career_trigger)}</p>
      ${listItems(report.transits.notes || [])}`
    : '';

  const body = [
    adviceBlock('Education', report.education, false),
    adviceBlock('Career', report.career, true),
    periodsBlock('Education', report.best_periods?.education),
    periodsBlock('Career', report.best_periods?.career),
    faqsBlock(report.faqs),
    transits,
  ].join('');

  openPrintWindow('Education & Career Adviser', body, { metaHtml: meta });
}
