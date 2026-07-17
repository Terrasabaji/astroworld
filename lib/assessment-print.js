import { escHtml, openPrintWindow, listItems } from '@/lib/print-report';

function methodHtml(title, method) {
  if (!method) return '';
  return `<p><strong>${escHtml(title)}</strong> — ${escHtml(method.verdict)} (${escHtml(Math.round(method.score ?? 0))})
    ${listItems(method.reasons || [])}</p>`;
}

export function printAssessmentReport(data) {
  if (!data) return;
  const s = data.summary || {};
  const dasha = data.dasha || {};
  const vim = dasha.vimshottari || {};
  const meta = `Favorable ${escHtml(s.favorable_count ?? 0)} · Mixed ${escHtml(s.mixed_count ?? 0)} · Challenging ${escHtml(s.challenging_count ?? 0)}
    · Method conformity ${escHtml(s.method_conformity_pct ?? '—')}%`;

  const areas = (data.life_areas || [])
    .map(
      (area) => `<div class="section">
      <h3>${escHtml(area.label)} <span class="tag">${escHtml(area.verdict)}</span></h3>
      <p>${escHtml(area.description)}</p>
      ${methodHtml('Parāśara', area.methods?.parashara)}
      ${methodHtml('KP', area.methods?.kp)}
      ${methodHtml('Jaimini', area.methods?.jaimini)}
      ${listItems([...(area.dasha_notes || []), ...(area.chara_dasha_notes || []), ...(area.transit_notes || [])])}
    </div>`
    )
    .join('');

  const body = `
    <div class="summary">
      ${s.top_strengths?.length ? `<p><strong>Strengths:</strong> ${escHtml(s.top_strengths.join(' · '))}</p>` : ''}
      ${s.top_concerns?.length ? `<p><strong>Watch:</strong> ${escHtml(s.top_concerns.join(' · '))}</p>` : ''}
      <p>Vimshottari: ${escHtml(vim.current_md?.lord)} / ${escHtml(vim.current_ad?.lord)} / ${escHtml(vim.current_pd?.lord)}</p>
      <p>Chara: ${escHtml(dasha.chara?.current_md?.sign)} / ${escHtml(dasha.chara?.current_ad?.sign)}</p>
      ${data.mooka_prashna ? `<p><strong>Mooka:</strong> ${escHtml(data.mooka_prashna.headline)}</p>` : ''}
      ${data.adviser?.education_summary ? `<p><strong>Education:</strong> ${escHtml(data.adviser.education_summary)}</p>` : ''}
      ${data.adviser?.career_fields?.length ? `<p><strong>Career:</strong> ${escHtml(data.adviser.career_fields.join(', '))}</p>` : ''}
    </div>
    <h2>Life-area assessments</h2>
    ${areas || '<p>No life areas returned.</p>'}`;

  openPrintWindow('Current Assessment', body, { metaHtml: meta });
}
