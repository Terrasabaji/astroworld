'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Printer } from 'lucide-react';
import { useModuleBirth } from '@/components/birth/BirthSessionProvider';
import PlaceAutocomplete from '@/components/birth/PlaceAutocomplete';
import { nativeBirth } from '@/lib/birth-session';
import { printPrashnaReport } from '@/lib/prashna-print';

const CATEGORIES = [
  { value: 'auto', label: 'Auto-detect from question' },
  { value: 'marriage', label: 'Marriage / partnership' },
  { value: 'career', label: 'Career / job' },
  { value: 'finance', label: 'Finance / wealth' },
  { value: 'health', label: 'Health' },
  { value: 'children', label: 'Children' },
  { value: 'education', label: 'Education' },
  { value: 'property', label: 'Property / vehicle' },
  { value: 'litigation', label: 'Litigation / enemies' },
  { value: 'travel', label: 'Travel' },
  { value: 'foreign', label: 'Foreign stay' },
  { value: 'gains', label: 'Gains' },
  { value: 'fortune', label: 'Fortune / dharma' },
  { value: 'siblings', label: 'Siblings' },
  { value: 'longevity', label: 'Longevity / inheritance' },
  { value: 'missing_item', label: 'Missing article' },
];

function pad(n) {
  return String(n ?? 0).padStart(2, '0');
}

function nowParts(tzOffset = 5.5) {
  const utc = Date.now() + new Date().getTimezoneOffset() * 60000;
  const local = new Date(utc + tzOffset * 3600000);
  return {
    year: local.getFullYear(),
    month: local.getMonth() + 1,
    day: local.getDate(),
    hour: local.getHours(),
    minute: local.getMinutes(),
    second: local.getSeconds(),
  };
}

function VerdictBadge({ promise, delayStatus }) {
  const ok = promise === true;
  const cls = ok
    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
    : 'bg-rose-500/15 text-rose-300 border-rose-500/40';
  return (
    <span className={`inline-flex px-3 py-1 rounded-md border text-sm font-semibold ${cls}`}>
      {ok ? 'YES' : 'NO'}
      {delayStatus ? ` · ${delayStatus}` : ''}
    </span>
  );
}

export default function PrashnaPage() {
  const { birth, hydrated } = useModuleBirth();
  const native = useMemo(() => nativeBirth(birth), [birth]);

  const [mode, setMode] = useState('manual');
  const [form, setForm] = useState(() => ({
    ...nowParts(native.tz_offset ?? 5.5),
    latitude: native.latitude,
    longitude: native.longitude,
    tz_offset: native.tz_offset ?? 5.5,
    tz_name: native.tz_name || '',
    place: native.place || '',
    question_text: '',
    category: 'auto',
    horary_number: '',
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  // Seed from saved birth place only when empty; geolocation / city pick override.
  useEffect(() => {
    if (!hydrated) return;
    setForm((f) => {
      if (f.place || (f.latitude !== '' && f.latitude != null && f.longitude !== '' && f.longitude != null)) {
        return f;
      }
      return {
        ...f,
        latitude: native.latitude ?? f.latitude,
        longitude: native.longitude ?? f.longitude,
        tz_offset: native.tz_offset ?? f.tz_offset,
        tz_name: native.tz_name || f.tz_name,
        place: native.place || f.place,
      };
    });
  }, [hydrated, native.latitude, native.longitude, native.tz_offset, native.tz_name, native.place]);

  const update = (key) => (e) => {
    const v = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: v }));
  };

  const onPlaceChange = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
  };

  const useNow = () => {
    const n = nowParts(Number(form.tz_offset) || 5.5);
    setForm((f) => ({ ...f, ...n }));
  };

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const payload = {
        mode,
        year: +form.year,
        month: +form.month,
        day: +form.day,
        hour: +form.hour,
        minute: +form.minute,
        second: +form.second || 0,
        latitude: +form.latitude,
        longitude: +form.longitude,
        tz_offset: +form.tz_offset,
        tz_name: form.tz_name || undefined,
        place: form.place,
        question_text: mode === 'mooka' ? '' : form.question_text,
        category: form.category !== 'auto' ? form.category : undefined,
        horary_number: form.horary_number === '' ? undefined : +form.horary_number,
        ayanamsa: 'krishnamurti',
        house_system: 'P',
        name: 'Querent',
      };
      const res = await fetch('/api/prashna/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Prashna analysis failed');
      setReport(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Prashna (Horary)</h1>
          <p className="text-sm text-slate-400 mt-1">
            Exactly two types — <span className="text-saffron-300">Mooka</span> (silent) and{' '}
            <span className="text-saffron-300">Manual</span> (explicit question). KP promise + Parashara context via Swiss Ephemeris.
          </p>
        </div>
        {report && (
          <Button
            type="button"
            variant="outline"
            className="border-slate-600 text-slate-200 hover:bg-slate-800 print:hidden"
            onClick={() => printPrashnaReport(report)}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        )}
      </div>

      <Tabs
        value={mode}
        onValueChange={(next) => {
          setMode(next);
          setReport(null);
          setError(null);
          if (next === 'mooka') setForm((f) => ({ ...f, question_text: '' }));
        }}
      >
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="mooka">1. Mooka Prashna</TabsTrigger>
          <TabsTrigger value="manual">2. Manual Prashna</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4 space-y-4">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100 text-base">Manual Prashna — explicit question</CardTitle>
              <CardDescription>
                Required: question text, timestamp, coordinates. Optional: KP horary number (1–249).
                Keywords map to primary houses (e.g. marriage → 7th).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Question</Label>
                <Input
                  value={form.question_text}
                  onChange={update('question_text')}
                  placeholder="e.g. Will I get the job this year?"
                  className="mt-1.5 bg-slate-950 border-slate-700"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300">Category hint</Label>
                  <Select value={form.category} onValueChange={update('category')}>
                    <SelectTrigger className="mt-1.5 bg-slate-950 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">KP Horary number (1–249)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={249}
                    value={form.horary_number}
                    onChange={update('horary_number')}
                    placeholder="Optional"
                    className="mt-1.5 bg-slate-950 border-slate-700 font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mooka" className="mt-4">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100 text-base">Mooka Prashna — silent question</CardTitle>
              <CardDescription>
                Required: timestamp and coordinates only. Do not enter a question.
                Deduction uses Moon Sign/Star/Sub lords and Lagna Sub Lord significations.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-slate-100 text-base">Judgement moment & place</CardTitle>
              <CardDescription>KP ayanamsa · Placidus houses · Swiss Ephemeris</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" className="border-slate-600" onClick={useNow}>
              Use now
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <div>
              <Label className="text-slate-400 text-xs">Year</Label>
              <Input type="number" value={form.year} onChange={update('year')} className="mt-1 bg-slate-950 border-slate-700" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Month</Label>
              <Input type="number" value={form.month} onChange={update('month')} className="mt-1 bg-slate-950 border-slate-700" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Day</Label>
              <Input type="number" value={form.day} onChange={update('day')} className="mt-1 bg-slate-950 border-slate-700" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Hour</Label>
              <Input type="number" value={form.hour} onChange={update('hour')} className="mt-1 bg-slate-950 border-slate-700" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Minute</Label>
              <Input type="number" value={form.minute} onChange={update('minute')} className="mt-1 bg-slate-950 border-slate-700" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Second</Label>
              <Input type="number" value={form.second} onChange={update('second')} className="mt-1 bg-slate-950 border-slate-700" />
            </div>
          </div>
          <PlaceAutocomplete
            place={form.place}
            latitude={form.latitude}
            longitude={form.longitude}
            tz_offset={form.tz_offset}
            tz_name={form.tz_name}
            year={form.year}
            month={form.month}
            day={form.day}
            hour={form.hour}
            minute={form.minute}
            onChange={onPlaceChange}
            autoDetect
            label="Place of query"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <Label className="text-slate-400 text-xs">Latitude</Label>
              <Input type="number" step="any" value={form.latitude} onChange={update('latitude')} className="mt-1 bg-slate-950 border-slate-700 font-mono" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Longitude</Label>
              <Input type="number" step="any" value={form.longitude} onChange={update('longitude')} className="mt-1 bg-slate-950 border-slate-700 font-mono" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">TZ offset</Label>
              <Input type="number" step="0.25" value={form.tz_offset} onChange={update('tz_offset')} className="mt-1 bg-slate-950 border-slate-700 font-mono" />
            </div>
          </div>
          {form.tz_name && (
            <p className="text-[10px] text-slate-500 font-mono">IANA: {form.tz_name}</p>
          )}

          <Button
            type="button"
            onClick={analyze}
            disabled={loading || (mode === 'manual' && !form.question_text.trim() && form.category === 'auto')}
            className="bg-gradient-to-r from-saffron-500 to-saffron-600 text-slate-950 font-semibold"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing…</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" />{mode === 'mooka' ? 'Run Mooka Prashna' : 'Run Manual Prashna'}</>
            )}
          </Button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </CardContent>
      </Card>

      {report && (
        <div className="space-y-4">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-slate-100 text-base">
                  {report.prashna_type || (report.mode === 'mooka' ? 'Mooka Prashna' : 'Manual Prashna')}
                </CardTitle>
                <VerdictBadge promise={report.the_promise_result} delayStatus={report.delay_status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {report.deduced_query && (
                <p><span className="text-slate-500">deduced_query:</span> <span className="text-saffron-200">{report.deduced_query}</span></p>
              )}
              {report.parsed_query && (
                <p>
                  <span className="text-slate-500">parsed_query:</span>{' '}
                  <span className="text-slate-200">{report.parsed_query.question_text || '—'}</span>
                  {' · '}
                  <span className="text-saffron-300">{report.parsed_query.label}</span>
                  {' · H'}{report.primary_house}
                </p>
              )}
              <p>
                <span className="text-slate-500">the_promise_result:</span>{' '}
                <span className="text-slate-100 font-semibold">{String(report.the_promise_result)}</span>
                {report.delay_status && <span className="text-amber-300"> · {report.delay_status}</span>}
              </p>
              <p><span className="text-slate-500">timing_prediction:</span> <span className="text-slate-200">{report.timing_prediction}</span></p>
              <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3 text-slate-300 leading-relaxed">
                <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">astrological_justification</p>
                {report.astrological_justification}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-100 text-sm">KP Engine</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2 text-slate-300">
                <p>CSL: <b className="text-saffron-300">{report.kp?.promise?.cuspal_sub_lord || '—'}</b> → star {report.kp?.promise?.csl_star_lord || '—'}</p>
                <p>Favorable hits: {(report.kp?.promise?.favorable_hits || []).join(', ') || '—'}</p>
                <p>Denial hits: {(report.kp?.promise?.denial_hits || []).join(', ') || '—'}</p>
                <p>Active RPs: {(report.kp?.ruling_planets?.active_ruling_planets || []).join(', ') || '—'}</p>
                <p>Rahu proxies: {(report.kp?.node_proxies?.Rahu || []).join(', ') || '—'}</p>
                <p>Ketu proxies: {(report.kp?.node_proxies?.Ketu || []).join(', ') || '—'}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-100 text-sm">Parashara Engine</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2 text-slate-300">
                <p>
                  Karaka {report.parashara?.karaka_dignity?.planet}: D1 {report.parashara?.karaka_dignity?.d1_status}
                  {' / '}D9 {report.parashara?.karaka_dignity?.d9_status}
                </p>
                <p>Ithasala: {String(!!report.parashara?.tajika?.ithasala)} · Esharpha: {String(!!report.parashara?.tajika?.esharpha)} · Kamboola: {String(!!report.parashara?.tajika?.kamboola)}</p>
                <p>Arudha Lagna: {report.parashara?.arudha_lagna?.sign || '—'} (H{report.parashara?.arudha_lagna?.house_from_lagna || '—'})</p>
                {(report.parashara?.tajika?.notes || []).map((n, i) => (
                  <p key={i} className="text-slate-400">{n}</p>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100 text-sm">Chart snapshot</CardTitle>
              <CardDescription className="text-[11px]">
                {report.chart?.input?.date} {report.chart?.input?.time} · Asc {report.chart?.ascendant?.sign} {report.chart?.ascendant?.dms}
                {report.chart?.horary_number ? ` · Horary #${report.chart.horary_number}` : ''}
                {' · '}{report.chart?.engine?.ephemeris}
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="text-left py-2 pr-2">Body</th>
                    <th className="text-left py-2 pr-2">Sign</th>
                    <th className="text-left py-2 pr-2">H</th>
                    <th className="text-left py-2 pr-2">Star</th>
                    <th className="text-left py-2 pr-2">Sub</th>
                    <th className="text-left py-2">R</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.chart?.planets || []).map((p) => (
                    <tr key={p.name} className="border-b border-slate-800/60 text-slate-300">
                      <td className="py-1.5 pr-2 text-slate-100">{p.name}</td>
                      <td className="py-1.5 pr-2">{p.sign}</td>
                      <td className="py-1.5 pr-2 font-mono">{p.house}</td>
                      <td className="py-1.5 pr-2">{p.star_lord}</td>
                      <td className="py-1.5 pr-2 text-saffron-300">{p.sub_lord}</td>
                      <td className="py-1.5">{p.retrograde ? 'R' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-slate-600 mt-3 font-mono">
                Moment {pad(form.day)}/{pad(form.month)}/{form.year} {pad(form.hour)}:{pad(form.minute)}:{pad(form.second)}
              </p>
            </CardContent>
          </Card>

          {report.mooka?.candidates?.length > 0 && (
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-100 text-sm">Mooka candidates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {report.mooka.candidates.map((c) => (
                  <div key={c.category} className="flex justify-between gap-3 text-slate-300 border-b border-slate-800/50 py-1.5">
                    <span>{c.question}</span>
                    <span className="font-mono text-saffron-300">{c.score}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}
