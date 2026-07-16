import { APP_NAME, DEVELOPER_CREDIT_SHORT } from '@/lib/branding';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function itemBlock(item) {
  const strength = item.strength
    ? `<p><strong>Strength:</strong> ${esc(item.strength.label)} (${item.strength.score}%)${item.strength.activated_now ? ' · dasha active' : ''}</p>`
    : '';
  const periods = (item.active_periods || [])
    .filter((p) => p.active_now)
    .map((p) => `<li>${esc(p.md)}–${esc(p.ad)} · ${esc(p.start)} → ${esc(p.end)}</li>`)
    .join('');
  const remedies = (item.remedies || [])
    .map((r) => {
      const cites = (r.citations || [])
        .map((c) => `${esc(c.work)}${c.chapter ? ` Ch.${c.chapter}` : ''}${c.section ? ` · ${esc(c.section)}` : ''}`)
        .join('; ');
      return `<div class="remedy"><strong>${esc(r.title)}</strong><p>${esc(r.text)}</p>${cites ? `<p class="cite">${cites}</p>` : ''}</div>`;
    })
    .join('');
  return `
    <section class="item">
      <h3>${esc(item.name)} <span class="tag">${esc(item.kind)} · ${esc(item.severity)}</span></h3>
      <p>${esc(item.detail)}</p>
      ${strength}
      ${periods ? `<p><strong>Running period:</strong></p><ul>${periods}</ul>` : ''}
      ${remedies ? `<div class="remedies">${remedies}</div>` : ''}
    </section>`;
}

export function printYogaDoshaReport(report) {
  if (!report) return;
  const n = report.native || {};
  const md = report.current_dasha?.md;
  const ad = report.current_dasha?.ad;
  const pd = report.current_dasha?.pd;
  const dashaLine = [md, ad, pd].filter(Boolean).map((x) => `${x.lord} (${x.strength?.label || '—'})`).join(' · ');

  const yogas = (report.yogas || []).filter((y) => y.present).map(itemBlock).join('');
  const doshas = (report.doshas || []).filter((d) => d.present || d.kind === 'note').map(itemBlock).join('');
  const sade = (report.special_periods?.sade_sati_timeline || [])
    .filter((p) => p.active_now)
    .map((p) => `<li>${esc(p.phase)} · ${esc(p.start)} → ${esc(p.end)}</li>`)
    .join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${esc(APP_NAME)} — Yogas &amp; Doshas</title>
<style>
  body { font-family: Georgia, serif; max-width: 720px; margin: 24px auto; color: #111; line-height: 1.45; font-size: 13px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 24px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  h3 { font-size: 13px; margin: 0 0 6px; }
  .meta { color: #444; font-size: 12px; margin-bottom: 16px; }
  .summary { background: #f5f5f5; padding: 10px 12px; border-radius: 6px; margin-bottom: 16px; }
  .item { margin-bottom: 16px; page-break-inside: avoid; }
  .tag { font-weight: normal; font-size: 11px; color: #666; }
  .remedy { margin-top: 8px; padding-left: 10px; border-left: 2px solid #ddd; }
  .cite { font-size: 10px; color: #666; margin: 4px 0 0; }
  .foot { margin-top: 32px; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 8px; }
  ul { margin: 4px 0; padding-left: 18px; }
</style></head><body>
  <h1>${esc(APP_NAME)} — Yogas &amp; Doshas Report</h1>
  <p class="meta"><strong>${esc(n.name)}</strong> · ${esc(n.birth)} ${esc(n.time)} · ${esc(n.place)} · age ${esc(n.age_years)} yrs</p>
  <div class="summary">
    <p>Yogas: ${report.summary?.yogas_count ?? 0} · Doshas: ${report.summary?.doshas_count ?? 0} · Sade Sati: ${report.summary?.sade_sati_active ? 'Active' : 'No'}</p>
    ${dashaLine ? `<p>Current dasha: ${esc(dashaLine)}</p>` : ''}
    ${sade ? `<p>Active Saturn phases:</p><ul>${sade}</ul>` : ''}
  </div>
  <h2>Yogas</h2>${yogas || '<p>None detected.</p>'}
  <h2>Doshas &amp; afflictions</h2>${doshas || '<p>None detected.</p>'}
  <p class="foot">${esc(DEVELOPER_CREDIT_SHORT)} · Generated ${new Date().toLocaleString()}</p>
</body></html>`;

  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.onload = () => {
    w.print();
    w.onafterprint = () => w.close();
  };
}
