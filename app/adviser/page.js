'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Printer, Sparkles } from 'lucide-react';
import AstroWorldLogo from '@/components/layout/AstroWorldLogo';
import { APP_NAME } from '@/lib/branding';
import { birthFormToPayload } from '@/components/birth/BirthForm';
import { useBirthSession } from '@/components/birth/BirthSessionProvider';
import OpenBirthDialog, { OpenBirthButton } from '@/components/birth/OpenBirthDialog';
import { printAdviserReport } from '@/lib/adviser-print';

function pad2(n) {
  return String(n ?? 0).padStart(2, '0');
}

export default function AdviserPage() {
  const { birth, hydrated, setBirth } = useBirthSession();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openBirth, setOpenBirth] = useState(false);

  const runAdviser = useCallback(async () => {
    if (!hydrated || !birth?.latitude) return;
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const b = birthFormToPayload(birth);
      const payload = {
        birth: {
          name: b.name || birth.name,
          year: b.year,
          month: b.month,
          day: b.day,
          time: `${pad2(b.hour)}:${pad2(b.minute)}`,
          latitude: b.latitude,
          longitude: b.longitude,
          tz: b.tz_offset,
          place: b.place,
        },
      };
      const res = await fetch('/api/adviser/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReport(data);
    } catch (e) {
      setError(e.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [birth, hydrated]);

  useEffect(() => {
    if (hydrated && birth?.latitude) runAdviser();
  }, [hydrated, birth?.latitude, birth?.longitude, birth?.year, birth?.month, birth?.day, birth?.hour, birth?.minute, runAdviser]);

  const birthLine = birth
    ? `${birth.name || 'Native'} · ${pad2(birth.day)}/${pad2(birth.month)}/${birth.year} ${pad2(birth.hour)}:${pad2(birth.minute)}${birth.place ? ` · ${birth.place}` : ''}`
    : '';

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <AstroWorldLogo size={32} showName={false} className="mt-1" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-amber-500/80 font-medium">{APP_NAME}</p>
            <h1 className="text-2xl font-bold text-slate-100">Education &amp; Career Adviser</h1>
            {birthLine && <p className="text-sky-300/90 text-sm mt-0.5">{birthLine}</p>}
            <p className="text-slate-400 text-sm mt-1">
              Full KP + Parashara education and career analysis using birth details from the Chart Engine landing page.
            </p>
          </div>
        </div>
        <div className="flex gap-2 print:hidden flex-wrap">
          <OpenBirthButton onClick={() => setOpenBirth(true)} />
          {report && (
            <Button
              variant="outline"
              onClick={() => printAdviserReport(report)}
              className="border-slate-600 text-slate-200 hover:bg-slate-800"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          )}
          <Button onClick={runAdviser} disabled={loading || !hydrated || !birth?.latitude} className="bg-amber-600 hover:bg-amber-500">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {loading ? 'Analyzing…' : 'Re-run'}
          </Button>
        </div>
      </div>

      <OpenBirthDialog open={openBirth} onOpenChange={setOpenBirth} onOpen={setBirth} />

      {!hydrated || loading ? (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="py-12 flex flex-col items-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400 mb-3" />
            <p>Running education &amp; career analysis…</p>
          </CardContent>
        </Card>
      ) : null}

      {error && (
        <Card className="bg-slate-900/60 border-rose-900/50">
          <CardContent className="py-4 text-rose-400 text-sm">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && !birth?.latitude && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="py-6 text-slate-400 text-sm">
            No birth coordinates in session. Return to the landing page, enter birth details, and press Run — then open this module.
          </CardContent>
        </Card>
      )}

      {report && (
        <>
          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="py-4 flex flex-wrap gap-6 text-sm">
              <Meta label="Native" value={report.birth?.name} />
              <Meta label="Age" value={report.native?.current_age} />
              <Meta label="Life Stage" value={report.native?.life_stage} />
              <Meta label="Lagna (KP)" value={`${report.lagna?.kp?.sign} / ${report.lagna?.kp?.sub_lord}`} />
              <Meta label="Lagna (Parashara)" value={report.lagna?.parashara?.sign} />
              <Meta label="Current Dasha" value={`${report.current_dasha?.mahadasha} / ${report.current_dasha?.antardasha} / ${report.current_dasha?.pratyantardasha}`} />
            </CardContent>
          </Card>

          <Tabs defaultValue="education">
            <TabsList className="bg-slate-900/60 border border-slate-800 flex-wrap h-auto">
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="career">Career</TabsTrigger>
              <TabsTrigger value="periods">Best Periods</TabsTrigger>
              <TabsTrigger value="strength">Shadbala & Bhava</TabsTrigger>
              <TabsTrigger value="phala">Ishta Phala</TabsTrigger>
              <TabsTrigger value="faqs">FAQs</TabsTrigger>
              <TabsTrigger value="transits">Transits</TabsTrigger>
            </TabsList>

            <TabsContent value="education" className="mt-3 space-y-4">
              <AdviceSection advice={report.education} />
            </TabsContent>
            <TabsContent value="career" className="mt-3 space-y-4">
              <AdviceSection advice={report.career} isCareer linked={report.career?.linked_fields} />
            </TabsContent>
            <TabsContent value="periods" className="mt-3 space-y-4">
              <PeriodsSection title="Education" periods={report.best_periods?.education} />
              <PeriodsSection title="Career" periods={report.best_periods?.career} />
            </TabsContent>
            <TabsContent value="strength" className="mt-3 space-y-4">
              <ShadbalaSection data={report.shadbala} />
              <BhavaSection data={report.bhava_bala} />
            </TabsContent>
            <TabsContent value="phala" className="mt-3 space-y-4">
              <PhalaSection ranking={report.ishta_ranking} timeline={report.phala_timeline} />
            </TabsContent>
            <TabsContent value="faqs" className="mt-3 space-y-3">
              {(report.faqs || []).map((f, i) => <FAQCard key={i} faq={f} />)}
            </TabsContent>
            <TabsContent value="transits" className="mt-3 space-y-4">
              <TransitSection transits={report.transits} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <span className="text-slate-500 text-xs uppercase block">{label}</span>
      <p className="text-slate-200">{value ?? '—'}</p>
    </div>
  );
}

function AdviceSection({ advice, isCareer, linked }) {
  if (!advice) return null;
  const items = isCareer ? advice.fields : advice.streams;
  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-200">{isCareer ? 'Career Analysis' : 'Education Analysis'}</CardTitle>
          <CardDescription className="text-slate-400">
            {advice.strength_summary || advice.earning_explanation || advice.satisfaction_explanation}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {isCareer ? (
            <div className="flex flex-wrap gap-4">
              <span className="text-slate-400">Earning: <span className="text-amber-300">{advice.earning_rating}/5</span></span>
              <span className="text-slate-400">Satisfaction: <span className="text-amber-300">{advice.satisfaction_rating}/5</span></span>
              <span className="text-slate-400">Path: <span className="text-slate-200">{advice.job_vs_business}</span></span>
            </div>
          ) : (
            <p className="text-slate-300">
              Higher education: {advice.higher_education_likely ? 'Likely' : 'Moderate'} · Promised: {advice.promised ? 'Yes' : 'Conditional'}
            </p>
          )}
          {advice.key_planets?.length > 0 && (
            <p className="text-slate-500 text-xs">Key planets: {advice.key_planets.join(', ')}</p>
          )}
          {linked?.length > 0 && (
            <p className="text-slate-400">Linked fields: {linked.join(', ')}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(items || []).map((s, i) => (
          <Card key={i} className="bg-slate-900/60 border-slate-800">
            <CardContent className="py-3">
              <div className="flex justify-between items-start gap-2">
                <p className="font-medium text-slate-200 text-sm">{s.title}</p>
                <Badge variant="outline" className="text-emerald-300 border-emerald-500/30 text-xs shrink-0">{s.score}</Badge>
              </div>
              {(s.drivers || []).map((d, j) => (
                <p key={j} className="text-xs text-slate-500 mt-1">• {d}</p>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <NotesBlock title="KP Notes" items={advice.kp_notes} />
      <NotesBlock title="Parashara Notes" items={advice.parashara_notes} />
      <NotesBlock title="Yogas" items={advice.yogas} />
      <NotesBlock title="Shadbala Notes" items={advice.shadbala_notes} />
      {advice.divisional_summary && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-slate-200 text-sm">Divisional Summary</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-slate-300">{advice.divisional_summary}</p></CardContent>
        </Card>
      )}
      {(advice.remedies || []).length > 0 && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-slate-200 text-sm">Remedies</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {advice.remedies.map((r, i) => (
              <div key={i} className="text-sm">
                <p className="text-amber-300 font-medium">{r.planet}</p>
                <p className="text-slate-400 text-xs">{r.reason}</p>
                <ul className="text-slate-500 text-xs mt-1 list-disc pl-4">
                  {(Array.isArray(r.measures)
                    ? r.measures.map((m) => [null, m])
                    : Object.entries(r.measures || {})
                  ).map(([k, m], j) => (
                    <li key={k ?? j}>
                      {k != null && <span className="text-slate-400 capitalize">{k}: </span>}
                      {typeof m === 'string' ? m : JSON.stringify(m)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function NotesBlock({ title, items }) {
  if (!items?.length) return null;
  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="pb-2"><CardTitle className="text-slate-200 text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        {items.map((n, i) => <p key={i} className="text-xs text-slate-400">• {n}</p>)}
      </CardContent>
    </Card>
  );
}

function PeriodsSection({ title, periods }) {
  if (!periods?.length) return null;
  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="pb-2"><CardTitle className="text-slate-200 text-sm">{title} — Best Periods</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {periods.map((p, i) => (
          <p key={i} className="text-sm text-slate-300">
            <span className="text-amber-300">{p.chain || p.period}</span>
            {p.start && ` (${p.start} → ${p.end})`}: {p.note || p.reason}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}

function ShadbalaSection({ data }) {
  if (!data) return null;
  const source = data.planets || data.rows || data;
  const rows = Array.isArray(source)
    ? source
    : Object.entries(source)
        .filter(([k]) => k !== 'summary' && k !== 'ranking')
        .map(([k, v]) => (v && typeof v === 'object' ? { planet: v.planet || k, ...v } : { planet: k, value: v }));
  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="pb-2"><CardTitle className="text-slate-200 text-sm">Shadbala</CardTitle></CardHeader>
      <CardContent>
        {data.summary && <p className="text-sm text-slate-300 mb-3">{data.summary}</p>}
        {rows.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-400">Planet</TableHead>
                <TableHead className="text-slate-400">Strength</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i} className="border-slate-800">
                  <TableCell className="text-slate-200">{r.planet || r.name}</TableCell>
                  <TableCell className="text-slate-400">{r.total ?? r.rupas ?? r.score ?? r.value ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function BhavaSection({ data }) {
  if (!data) return null;
  const source = data.houses || [];
  const houses = Array.isArray(source) ? source : Object.values(source);
  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="pb-2"><CardTitle className="text-slate-200 text-sm">Bhava Bala</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        {houses.map((h, i) => (
          <p key={i} className="text-sm text-slate-300">
            House {h.house ?? h.number}: {h.strength ?? h.rupas ?? h.score} — {h.note || h.interpretation || h.lord || ''}
          </p>
        ))}
        {data.summary && <p className="text-xs text-slate-500 mt-2">{data.summary}</p>}
      </CardContent>
    </Card>
  );
}

function PhalaSection({ ranking, timeline }) {
  const rankRows = Array.isArray(ranking) ? ranking : [];
  const periods = Array.isArray(timeline)
    ? timeline
    : [...(timeline?.mahadasha || []), ...(timeline?.antardasha || [])];
  return (
    <div className="space-y-4">
      {rankRows.length > 0 && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-slate-200 text-sm">Ishta Ranking</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {rankRows.map((r, i) => (
              <p key={i} className="text-sm text-slate-300">
                {i + 1}. {typeof r === 'string' ? r : `${r.planet || r.name}: ${r.score ?? r.ishta}`}
              </p>
            ))}
          </CardContent>
        </Card>
      )}
      {periods.length > 0 && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-slate-200 text-sm">Phala Timeline</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {periods.map((t, i) => (
              <p key={i} className="text-sm text-slate-300">
                {t.lord || t.age || t.year}
                {t.start && ` (${t.start} → ${t.end})`}: {t.verdict || t.note || t.summary || ''}
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FAQCard({ faq }) {
  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-200 text-sm">{faq.question}</CardTitle>
        <Badge className="w-fit" variant="outline">{faq.verdict}</Badge>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-slate-300">{faq.summary}</p>
        {faq.kp_basis && <p className="text-xs text-slate-500"><span className="text-slate-400">KP:</span> {faq.kp_basis}</p>}
        {faq.parashara_basis && <p className="text-xs text-slate-500"><span className="text-slate-400">Parashara:</span> {faq.parashara_basis}</p>}
        {(faq.timeline || []).map((w, i) => (
          <p key={i} className="text-xs text-emerald-400/80">{w.chain}: {w.start} → {w.end} — {w.note}</p>
        ))}
      </CardContent>
    </Card>
  );
}

function TransitSection({ transits }) {
  if (!transits) return null;
  const positions = transits.positions || {};
  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/60 border-slate-800">
        <CardContent className="py-4 space-y-2 text-sm">
          <p className="text-slate-300">As of {transits.as_of}</p>
          <p className="text-slate-300">Sade Sati: {transits.sade_sati ? 'Active' : 'Not active'}</p>
          <p className="text-slate-400">{transits.education_trigger}</p>
          <p className="text-slate-400">{transits.career_trigger}</p>
          {(transits.notes || []).map((n, i) => <p key={i} className="text-xs text-slate-500">• {n}</p>)}
        </CardContent>
      </Card>
      {Object.keys(positions).length > 0 && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-slate-200 text-sm">Transit Positions</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Planet</TableHead>
                  <TableHead className="text-slate-400">Sign</TableHead>
                  <TableHead className="text-slate-400">From Lagna</TableHead>
                  <TableHead className="text-slate-400">From Moon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(positions).map(([planet, t]) => (
                  <TableRow key={planet} className="border-slate-800">
                    <TableCell className="text-slate-200">{planet}</TableCell>
                    <TableCell className="text-slate-400">{t.sign}</TableCell>
                    <TableCell className="text-slate-400">H{t.house_from_lagna}</TableCell>
                    <TableCell className="text-slate-400">H{t.house_from_moon}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
