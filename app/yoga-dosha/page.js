'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronDown, ChevronUp, BookOpen, Sparkles, Printer, Download } from 'lucide-react';
import { printYogaDoshaReport } from '@/lib/yoga-dosha-print';
import ModuleShortcuts from '@/components/layout/ModuleShortcuts';
import AstroWorldLogo from '@/components/layout/AstroWorldLogo';
import { APP_NAME } from '@/lib/branding';
import { useBirthSession } from '@/components/birth/BirthSessionProvider';
import { birthFormToPayload } from '@/components/birth/BirthForm';
import OpenBirthDialog, { OpenBirthButton } from '@/components/birth/OpenBirthDialog';

function severityClass(s) {
  if (s === 'benefic' || s === 'low') return 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10';
  if (s === 'high' || s === 'strong') return 'border-rose-500/40 text-rose-300 bg-rose-500/10';
  if (s === 'moderate' || s === 'challenging') return 'border-amber-500/40 text-amber-300 bg-amber-500/10';
  return 'border-slate-500/40 text-slate-400 bg-slate-500/10';
}

function strengthClass(label) {
  if (label === 'Strong') return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40';
  if (label === 'Moderate') return 'text-amber-300 bg-amber-500/15 border-amber-500/40';
  return 'text-rose-300 bg-rose-500/15 border-rose-500/40';
}

function StrengthBar({ score, label, compact = false }) {
  if (score == null) return null;
  const pct = Math.max(0, Math.min(100, score));
  const barColor = label === 'Strong' ? 'bg-emerald-500' : label === 'Moderate' ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-500">Strength</span>
        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${strengthClass(label)}`}>
          {label} · {score}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DashaStrengthRow({ level, entry }) {
  if (!entry?.strength) return null;
  const s = entry.strength;
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wider text-slate-500">{level}</span>
        <span className="text-sm font-medium text-sky-200">{entry.lord}</span>
      </div>
      <StrengthBar score={s.score} label={s.label} compact />
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
        {s.dignity && <span>{s.dignity}{s.house ? ` · ${s.house}H` : ''}</span>}
        {s.rupas != null && <span>Shadbala {s.rupas} rupas</span>}
        {s.ratio != null && <span>ratio {s.ratio}</span>}
        {s.phala && <span className="text-slate-400">{s.phala}</span>}
      </div>
    </div>
  );
}

function sortByStrength(items) {
  return [...items].sort((a, b) => {
    const aAct = a.strength?.activated_now ? 1 : 0;
    const bAct = b.strength?.activated_now ? 1 : 0;
    if (bAct !== aAct) return bAct - aAct;
    return (b.strength?.score ?? 0) - (a.strength?.score ?? 0);
  });
}

function filterItems(items, mode) {
  const list = items || [];
  if (mode === 'active') return list.filter((i) => i.strength?.activated_now);
  if (mode === 'benefic') return list.filter((i) => i.severity === 'benefic' || i.kind === 'yoga');
  if (mode === 'challenging') return list.filter((i) => ['challenging', 'strong', 'high', 'moderate'].includes(i.severity) && i.kind !== 'note');
  return list;
}

function phaseLabel(p) {
  const map = {
    rising: 'Sade Sati — Rising (12th from Moon)',
    peak: 'Sade Sati — Peak (over Moon sign)',
    setting: 'Sade Sati — Setting (2nd from Moon)',
    ardha_ashtama: 'Ardha-Ashtama Shani (4th from Moon)',
    ashtama_shani: 'Ashtama Shani (8th from Moon)',
  };
  return map[p] || p;
}

function ItemCard({ item, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!item.present && item.kind !== 'note') return null;

  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] uppercase">{item.kind}</Badge>
              <Badge variant="outline" className={severityClass(item.severity)}>{item.severity}</Badge>
              {item.strength?.label && (
                <Badge variant="outline" className={`text-[10px] ${strengthClass(item.strength.label)}`}>
                  {item.strength.label} · {item.strength.score}%
                </Badge>
              )}
              {item.strength?.activated_now && (
                <Badge variant="outline" className="text-[10px] border-sky-500/40 text-sky-300 bg-sky-500/10">
                  dasha active
                </Badge>
              )}
            </div>
            <CardTitle className="text-slate-100 text-base mt-1">{item.name}</CardTitle>
            <CardDescription className="text-xs mt-1">{item.detail}</CardDescription>
            {item.accident?.level && (
              <p className="text-[10px] text-slate-500 mt-1">
                Accident risk: {item.accident.level} ({item.accident.score})
              </p>
            )}
            {item.gand_mool?.nakshatra && (
              <p className="text-[10px] text-amber-500/70 mt-1">Nakshatra: {item.gand_mool.nakshatra}</p>
            )}
            {item.kuja?.net_intensity != null && (
              <p className="text-[10px] text-slate-500 mt-1">
                Kuja net intensity: {item.kuja.net_intensity}/100
                {item.kuja.level ? ` · ${item.kuja.level}` : ''}
              </p>
            )}
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />}
        </div>
      </CardHeader>
      {open && (
        <CardContent className="space-y-4 text-sm">
          {item.strength && (
            <StrengthBar score={item.strength.score} label={item.strength.label} />
          )}

          {item.strength?.factors?.length > 0 && (
            <ul className="text-[11px] text-slate-500 space-y-0.5 list-disc list-inside">
              {item.strength.factors.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}

          {item.neecha?.navamsa_sign && (
            <p className="text-[10px] text-slate-500 mt-1">
              Navamsa: {item.neecha.navamsa_sign}
              {item.neecha.navamsa_dignity ? ` (${item.neecha.navamsa_dignity})` : ''}
              {item.neecha.cancelled === false ? ' · no cancellation' : ''}
            </p>
          )}

          {item.neecha?.reasons?.length > 0 && (
            <ul className="text-[11px] text-emerald-500/80 space-y-0.5 list-disc list-inside">
              {item.neecha.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}

          {item.activating_lords?.length > 0 && (
            <p className="text-xs text-slate-500">Activating grahas: {item.activating_lords.join(', ')}</p>
          )}

          {item.active_periods?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-sky-400/80 mb-2">Vimshottari active periods (MD–AD)</p>
              <div className="space-y-1 max-h-48 overflow-auto">
                {item.active_periods.map((p, i) => (
                  <div key={i} className={`text-xs px-2 py-1.5 rounded border ${p.active_now ? 'border-sky-500/40 bg-sky-500/10 text-sky-200' : 'border-slate-700 text-slate-400'}`}>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{p.md}–{p.ad} · {p.start} → {p.end}</span>
                      {p.strength?.combined_label && (
                        <span className={`px-1 py-0.5 rounded border text-[9px] ${strengthClass(p.strength.combined_label)}`}>
                          {p.strength.combined_label} · {p.strength.combined_score}%
                        </span>
                      )}
                      {p.active_now && <span className="text-sky-400">● running now</span>}
                    </div>
                    {p.strength && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        MD {p.strength.md?.lord}: {p.strength.md?.label} ({p.strength.md?.score}%)
                        {' · '}
                        AD {p.strength.ad?.lord}: {p.strength.ad?.label} ({p.strength.ad?.score}%)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {item.accident?.factors?.length > 0 && (
            <ul className="text-[11px] text-rose-400/70 space-y-0.5 list-disc list-inside">
              {item.accident.factors.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}

          {item.remedies?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-amber-400/80 mb-2 flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> Remedies (Mantra · Yantra · Tantra · Lal Kitab · Homa)
              </p>
              <div className="space-y-3">
                {item.remedies.map((r) => (
                  <div key={r.id} className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {(r.types || []).map((t) => (
                        <Badge key={t} variant="outline" className="text-[9px] border-slate-600 text-slate-400">{t}</Badge>
                      ))}
                    </div>
                    <p className="text-slate-200 font-medium text-xs">{r.title}</p>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{r.text}</p>
                    {r.citations?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                        {r.citations.map((c, ci) => (
                          <p key={ci} className="text-[10px] text-slate-500">
                            <span className="text-slate-400">{c.work}</span>
                            {c.chapter && <> · Ch. {c.chapter}</>}
                            {c.section && <> · {c.section}</>}
                            {c.note && <> — {c.note}</>}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function YogaDoshaPage() {
  const { birth, hydrated, setBirth } = useBirthSession();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const analyze = useCallback(async () => {
    if (!hydrated || !birth) return;
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const payload = birthFormToPayload(birth);
      const res = await fetch('/api/yoga-dosha/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReport(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [birth, hydrated]);

  useEffect(() => {
    if (hydrated && birth?.latitude) analyze();
  }, [hydrated, birth?.latitude, birth?.longitude, analyze]);

  const md = report?.current_dasha?.md;
  const ad = report?.current_dasha?.ad;
  const pd = report?.current_dasha?.pd;
  const activeNow = report?.active_now;
  const yogaList = sortByStrength(filterItems(report?.yogas?.filter((y) => y.present) || [], filter));
  const doshaList = sortByStrength(filterItems(report?.doshas?.filter((d) => d.present || d.kind === 'note') || [], filter));

  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Dasha active' },
    { id: 'benefic', label: 'Benefic' },
    { id: 'challenging', label: 'Challenging' },
  ];

  const downloadJson = () => {
    if (!report) return;
    const name = (report.native?.name || 'native').replace(/[^\w.-]+/g, '_');
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yoga-dosha-${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container py-6 space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <AstroWorldLogo size={36} showName={false} className="mt-1" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-amber-500/80 font-medium">{APP_NAME}</p>
            <h1 className="text-2xl font-bold text-slate-100">Yogas &amp; Doshas</h1>
            {report?.native?.name && (
              <p className="text-sky-300/90 text-sm mt-0.5">{report.native.name}{report.native.place ? ` · ${report.native.place}` : ''}</p>
            )}
            {!report && birth?.name && (
              <p className="text-sky-300/90 text-sm mt-0.5">{birth.name}{birth.place ? ` · ${birth.place}` : ''}</p>
            )}
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Full chart yoga and dosha analysis with Vimshottari activation periods, Sade Sati timeline,
              Balarishta (under age 15), and remedies from BPHS, Phaladeepika, Lal Kitab, and Tantra sources.
            </p>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <OpenBirthButton />
          {report && (
            <Button
              variant="outline"
              onClick={downloadJson}
              className="border-slate-600 text-slate-200 hover:bg-slate-800"
            >
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
          )}
          {report && (
            <Button
              variant="outline"
              onClick={() => printYogaDoshaReport(report)}
              className="border-slate-600 text-slate-200 hover:bg-slate-800"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          )}
          <Button onClick={analyze} disabled={loading || !hydrated} className="bg-amber-600 hover:bg-amber-500">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Analyze Chart
          </Button>
        </div>
      </div>

      <OpenBirthDialog onSelect={setBirth} />

      {error && <p className="text-rose-400 text-sm">{error}</p>}

      {report && (
        <>
          <Card className="bg-slate-900/40 border-slate-800">
            <CardContent className="py-4 flex flex-wrap gap-4 text-sm">
              <div><span className="text-slate-500">Age: </span><span className="text-slate-200">{report.native?.age_years} yrs</span></div>
              <div><span className="text-slate-500">Yogas: </span><span className="text-emerald-400">{report.summary?.yogas_count}</span></div>
              <div><span className="text-slate-500">Doshas: </span><span className="text-amber-400">{report.summary?.doshas_count}</span></div>
              <div><span className="text-slate-500">Active yogas (dasha): </span><span className="text-emerald-300">{report.summary?.active_yogas_count ?? 0}</span></div>
              <div><span className="text-slate-500">Active doshas (dasha): </span><span className="text-amber-300">{report.summary?.active_doshas_count ?? 0}</span></div>
              <div><span className="text-slate-500">Sade Sati now: </span><span className={report.summary?.sade_sati_active ? 'text-rose-300' : 'text-slate-400'}>{report.summary?.sade_sati_active ? 'Active' : 'No'}</span></div>
              {md && (
                <div><span className="text-slate-500">Current dasha: </span><span className="text-sky-300">{md.lord}{ad ? `–${ad.lord}` : ''}{pd ? `–${pd.lord}` : ''}</span></div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2 print:hidden">
            {FILTERS.map((f) => (
              <Button
                key={f.id}
                size="sm"
                variant={filter === f.id ? 'default' : 'outline'}
                className={filter === f.id ? 'bg-amber-600 hover:bg-amber-500' : 'border-slate-700 text-slate-400'}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {(md || ad || pd) && (
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-200 text-sm">Running dasha strength (Shadbala)</CardTitle>
                <CardDescription className="text-xs">Vimshottari MD · AD · PD with dignity, rupas, and phala verdict</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                {md && <DashaStrengthRow level="Mahadasha" entry={md} />}
                {ad && <DashaStrengthRow level="Antardasha" entry={ad} />}
                {pd && <DashaStrengthRow level="Pratyantardasha" entry={pd} />}
              </CardContent>
            </Card>
          )}

          {((activeNow?.yogas?.length ?? 0) > 0 || (activeNow?.doshas?.length ?? 0) > 0) && (
            <Card className="bg-slate-900/60 border-sky-900/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-200 text-sm">Activated now by running dasha</CardTitle>
                <CardDescription className="text-xs">
                  Lords {activeNow?.dasha_lords?.join(', ')} are currently running — these combinations are live.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[...(activeNow?.yogas || []), ...(activeNow?.doshas || [])].map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-xs px-2 py-1.5 rounded border border-sky-800/50 bg-sky-950/30">
                    <span className="text-slate-200">{item.name}</span>
                    {item.strength && (
                      <span className={`px-1.5 py-0.5 rounded border text-[10px] shrink-0 ${strengthClass(item.strength.label)}`}>
                        {item.strength.label} · {item.strength.score}%
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {report.special_periods?.sade_sati_timeline?.length > 0 && (
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-200 text-sm">Saturn special periods (vs natal Moon)</CardTitle>
                <CardDescription className="text-xs">{report.special_periods.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 max-h-56 overflow-auto">
                {report.special_periods.sade_sati_timeline.map((p, i) => (
                  <div key={i} className={`text-xs px-2 py-1.5 rounded border ${p.active_now ? 'border-violet-500/40 bg-violet-500/10 text-violet-200' : 'border-slate-700 text-slate-400'}`}>
                    {phaseLabel(p.phase)} · {p.start} → {p.end}
                    {p.active_now && <span className="ml-2">● now</span>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="text-lg font-semibold text-slate-100 mb-3">Yogas</h2>
            <div className="space-y-3">
              {yogaList.length === 0 ? (
                <p className="text-slate-500 text-sm">No yogas match this filter.</p>
              ) : (
                yogaList.map((y, i) => (
                  <ItemCard key={y.id} item={y} defaultOpen={i < 2} />
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-100 mb-3">Doshas &amp; afflictions</h2>
            <div className="space-y-3">
              {doshaList.length === 0 ? (
                <p className="text-slate-500 text-sm">No doshas match this filter.</p>
              ) : (
                doshaList.map((d, i) => (
                  <ItemCard key={d.id} item={d} defaultOpen={i < 2} />
                ))
              )}
            </div>
          </div>

          <ModuleShortcuts title="Other modules" className="print:hidden pt-2" />
        </>
      )}
    </div>
  );
}
