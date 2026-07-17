'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

function verdictClass(cls) {
  if (cls === 'good') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (cls === 'bad') return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
}

function VerdictBadge({ verdict, cls }) {
  return (
    <Badge variant="outline" className={verdictClass(cls)}>
      {verdict}
    </Badge>
  );
}

function ScoreBar({ score }) {
  const color = score >= 62 ? 'bg-emerald-500' : score >= 42 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-400 w-8 text-right">{Math.round(score)}</span>
    </div>
  );
}

function MethodBlock({ title, method, accent }) {
  if (!method) return null;
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`text-xs font-semibold uppercase tracking-wide ${accent}`}>{title}</span>
        <VerdictBadge verdict={method.verdict} cls={method.verdict === 'Favorable' ? 'good' : method.verdict === 'Challenging' ? 'bad' : 'mid'} />
      </div>
      <ScoreBar score={method.score} />
      <ul className="mt-2 space-y-1">
        {(method.reasons || []).map((r, i) => (
          <li key={i} className="text-[11px] text-slate-400 leading-snug">• {r}</li>
        ))}
      </ul>
    </div>
  );
}

function LifeAreaCard({ area }) {
  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-slate-100 text-base">{area.label}</CardTitle>
            <CardDescription className="text-[11px] mt-0.5">{area.description}</CardDescription>
          </div>
          <div className="text-right">
            <VerdictBadge verdict={area.verdict} cls={area.verdict_class} />
            <p className="text-[10px] text-slate-500 mt-1">Houses: {area.houses?.join(', ')}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <MethodBlock title="Parāśara" method={area.methods?.parashara} accent="text-saffron-300" />
          <MethodBlock title="KP" method={area.methods?.kp} accent="text-sky-300" />
          <MethodBlock title="Jaimini" method={area.methods?.jaimini} accent="text-violet-300" />
        </div>
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            Method conformity: <b className="text-slate-200">{area.conformity?.pct}%</b> — {area.conformity?.label}
          </span>
        </div>
        {(area.dasha_notes?.length > 0 || area.chara_dasha_notes?.length > 0 || area.transit_notes?.length > 0) && (
          <div className="rounded border border-slate-800/80 p-2 space-y-1">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Timing & transits</p>
            {[...(area.dasha_notes || []), ...(area.chara_dasha_notes || []), ...(area.transit_notes || [])].map((n, i) => (
              <p key={i} className="text-[11px] text-slate-400">• {n}</p>
            ))}
            <p className="text-[10px] text-slate-600 italic">{area.conditional_dasha}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ComprehensiveStatusPanel({ data, loading, error }) {
  if (loading) {
    return (
      <Card className="bg-slate-900/60 border-slate-800">
        <CardContent className="py-12 flex flex-col items-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-saffron-400 mb-3" />
          <p>Running comprehensive analysis — Parāśara, KP, Jaimini, dashas, transits & Mooka Prashna…</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-900/60 border-rose-900/50">
        <CardContent className="py-6 text-rose-400 text-sm">{error}</CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const s = data.summary || {};
  const dasha = data.dasha || {};
  const vim = dasha.vimshottari || {};
  const mooka = data.mooka_prashna;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-slate-900/80 to-indigo-950/40 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-100">Comprehensive Native Status</CardTitle>
          <CardDescription className="text-slate-400">
            Synthesised at chart cast from Parāśara, KP & Jaimini with Vimshottari + Chara dasha and current transits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="rounded-lg bg-slate-950/50 border border-slate-800 p-3">
              <div className="text-2xl font-bold text-emerald-400">{s.favorable_count ?? 0}</div>
              <div className="text-[10px] text-slate-500 uppercase">Favorable areas</div>
            </div>
            <div className="rounded-lg bg-slate-950/50 border border-slate-800 p-3">
              <div className="text-2xl font-bold text-amber-400">{s.mixed_count ?? 0}</div>
              <div className="text-[10px] text-slate-500 uppercase">Mixed</div>
            </div>
            <div className="rounded-lg bg-slate-950/50 border border-slate-800 p-3">
              <div className="text-2xl font-bold text-rose-400">{s.challenging_count ?? 0}</div>
              <div className="text-[10px] text-slate-500 uppercase">Challenging</div>
            </div>
            <div className="rounded-lg bg-slate-950/50 border border-slate-800 p-3">
              <div className="text-2xl font-bold text-sky-400">{s.method_conformity_pct ?? '—'}%</div>
              <div className="text-[10px] text-slate-500 uppercase">Method conformity</div>
            </div>
          </div>
          {(s.top_strengths?.length > 0 || s.top_concerns?.length > 0) && (
            <div className="grid md:grid-cols-2 gap-3 mt-4 text-sm">
              {s.top_strengths?.length > 0 && (
                <p className="text-slate-400"><span className="text-emerald-400 font-medium">Strengths:</span> {s.top_strengths.join(' · ')}</p>
              )}
              {s.top_concerns?.length > 0 && (
                <p className="text-slate-400"><span className="text-amber-400 font-medium">Watch:</span> {s.top_concerns.join(' · ')}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-200 text-sm">Vimshottari Dasha (current)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1 text-slate-300">
            <p>MD: <b className="text-saffron-300">{vim.current_md?.lord || '—'}</b></p>
            <p>AD: <b className="text-saffron-300">{vim.current_ad?.lord || '—'}</b></p>
            <p>PD: <b className="text-saffron-300">{vim.current_pd?.lord || '—'}</b></p>
            {vim.balance_years != null && (
              <p className="text-xs text-slate-500">Birth balance: {Number(vim.balance_years).toFixed(2)} yrs of {vim.lord_at_birth}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-200 text-sm">Chara Dasha (Jaimini — conditional)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1 text-slate-300">
            <p>MD: <b className="text-violet-300">{dasha.chara?.current_md?.sign || '—'}</b></p>
            <p>AD: <b className="text-violet-300">{dasha.chara?.current_ad?.sign || '—'}</b></p>
            <p className="text-[11px] text-slate-500 mt-2">{dasha.conditional_note}</p>
          </CardContent>
        </Card>
      </div>

      {mooka && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-200 text-sm">Mooka Prashna (at cast moment)</CardTitle>
            <CardDescription className="text-[11px]">{mooka.cast_note}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-200 mb-3">{mooka.headline}</p>
            <div className="flex flex-wrap gap-2">
              {(mooka.candidates || []).map((c) => (
                <Badge key={c.category} variant="outline" className="border-slate-600 text-slate-300">
                  {c.category.replace(/_/g, ' ')} ({c.score})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.adviser && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-200 text-sm">Education & Career (Adviser module)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-400 space-y-1">
            {data.adviser.education_summary && <p>Education stream: <b className="text-slate-200">{data.adviser.education_summary}</b></p>}
            {data.adviser.career_fields?.length > 0 && (
              <p>Career fields: <b className="text-slate-200">{data.adviser.career_fields.join(', ')}</b></p>
            )}
            {data.adviser.job_vs_business && <p>Job vs business: <b className="text-slate-200">{data.adviser.job_vs_business}</b></p>}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">Life-area assessments</h3>
        {(data.life_areas || []).map((area) => (
          <LifeAreaCard key={area.id} area={area} />
        ))}
      </div>
    </div>
  );
}
