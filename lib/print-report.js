import { APP_NAME, DEVELOPER_CREDIT_SHORT } from '@/lib/branding';

/** Escape text for safe HTML report bodies. */
export function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const BASE_STYLES = `
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 760px; margin: 24px auto; color: #111; line-height: 1.45; font-size: 13px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 24px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  h3 { font-size: 13px; margin: 12px 0 6px; }
  .meta { color: #444; font-size: 12px; margin-bottom: 16px; }
  .summary { background: #f5f5f5; padding: 10px 12px; border-radius: 6px; margin-bottom: 16px; }
  .section { margin-bottom: 16px; page-break-inside: avoid; }
  .tag { font-weight: normal; font-size: 11px; color: #666; }
  .foot { margin-top: 32px; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 8px; }
  ul { margin: 4px 0; padding-left: 18px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0; }
  th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; }
  th { background: #f0f0f0; }
  @media print { body { margin: 12px; } }
`;

/**
 * Open a new window with report HTML and trigger the browser print dialog
 * (user can choose Save as PDF or a physical printer).
 */
export function openPrintWindow(title, bodyHtml, { metaHtml = '' } = {}) {
  if (typeof window === 'undefined') return;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>${escHtml(APP_NAME)} — ${escHtml(title)}</title>
<style>${BASE_STYLES}</style></head><body>
  <h1>${escHtml(APP_NAME)} — ${escHtml(title)}</h1>
  ${metaHtml ? `<div class="meta">${metaHtml}</div>` : ''}
  ${bodyHtml}
  <p class="foot">${escHtml(DEVELOPER_CREDIT_SHORT)} · Generated ${escHtml(new Date().toLocaleString())}</p>
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

export function listItems(items, mapFn) {
  if (!items?.length) return '';
  return `<ul>${items.map((item) => `<li>${mapFn ? mapFn(item) : escHtml(item)}</li>`).join('')}</ul>`;
}
