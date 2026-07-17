'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Loader2, Sparkles } from 'lucide-react';
import JaiminiPanel from '@/components/astrology/JaiminiPanel';
import SouthIndianChart from '@/components/astrology/SouthIndianChart';
import NorthIndianChart from '@/components/astrology/NorthIndianChart';

import { birthFormToPayload } from '@/components/birth/BirthForm';
import LandingBirthForm from '@/components/birth/LandingBirthForm';
import { useBirthSession } from '@/components/birth/BirthSessionProvider';
import { nativeBirth, DEFAULT_BIRTH } from '@/lib/birth-session';
import { authHeaders } from '@/lib/api-client';

const VARGA_KEYS = ['D1','D2','D3','D4','D7','D9','D10','D12','D16','D20','D24','D27','D30','D40','D45','D60'];

const PLANET_GLYPH = {
  Sun:'\u2609', Moon:'\u263D', Mars:'\u2642', Mercury:'\u263F', Jupiter:'\u2643',
  Venus:'\u2640', Saturn:'\u2644', Rahu:'\u260A', Ketu:'\u260B', Ascendant:'ASC',
};

// Short 2-char labels for chart wheel display
const SHORT = {
  Sun:'Su', Moon:'Mo', Mars:'Ma', Mercury:'Me', Jupiter:'Ju',
  Venus:'Ve', Saturn:'Sa', Rahu:'Ra', Ketu:'Ke',
  Gulika:'Gu', Maandi:'Mn',
};

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
               'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_ABBR = ['Ar','Ta','Ge','Cn','Le','Vi','Li','Sc','Sg','Cp','Aq','Pi'];

// South Indian chart: fixed sign positions in 4x4 grid. Center 2x2 is metadata.
// Row/col -> sign_index
const SI_LAYOUT = [
  [11, 0, 1, 2],   // Pisces, Aries, Taurus, Gemini
  [10,-1,-1, 3],   // Aquarius, ., ., Cancer
  [ 9,-1,-1, 4],   // Capricorn, ., ., Leo
  [ 8, 7, 6, 5],   // Sagittarius, Scorpio, Libra, Virgo
];

export default function Home() {
  const { birth, setBirth, hydrated } = useBirthSession();
  const [form, setForm] = useState(() => nativeBirth(birth));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [result, setResult] = useState(null);
  const [chartStyle, setChartStyle] = useState('south');

  useEffect(() => {
    if (hydrated) setForm(nativeBirth(birth));
  }, [hydrated, birth]);

  const updateForm = (next) => {
    setForm(next);
    setBirth(next);
  };

  const castChart = async (data) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = birthFormToPayload(data);
      if (payload.ayanamsa === 'kp') payload.house_system = 'P';

      const calcRes = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const calc = await calcRes.json();
      if (!calcRes.ok || calc.error) throw new Error(calc.error || 'Calculation failed');
      setResult(calc);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const runChart = async () => {
    setSaveMessage(null);
    setBirth(form);
    await castChart(form);
  };

  const cancelForm = (resetTo = DEFAULT_BIRTH) => {
    const next = nativeBirth(resetTo);
    setForm(next);
    setBirth(next);
    setResult(null);
    setError(null);
    setSaveMessage(null);
  };

  const saveBirthRecord = async () => {
    setSaving(true);
    setSaveMessage(null);
    setError(null);
    try {
      setBirth(form);
      const payload = {
        ...birthFormToPayload(form),
        id: form.record_id,
        name: form.name?.trim() || 'Native',
      };
      const res = await fetch('/api/births', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
      });
      const saved = await res.json();
      if (saved.error) throw new Error(saved.error);
      const next = { ...form, record_id: saved.id, name: saved.name };
      setForm(next);
      setBirth(next);
      setSaveMessage('Birth record saved.');
    } catch (e) {
      setError(e.message);
    } finally { setSaving(false); }
  };

  return (
    <main className="bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.08),_transparent_40%),linear-gradient(180deg,#020617_0%,#0f172a_55%,#111827_100%)] text-slate-100">
      <div className={`container py-8 sm:py-12 pb-10 ${result ? 'lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start' : ''}`}>
        <div className={result ? 'lg:col-span-4 lg:sticky lg:top-4' : ''}>
          <LandingBirthForm
            form={form}
            onChange={updateForm}
            onSave={saveBirthRecord}
            onCancel={cancelForm}
            onRun={runChart}
            loading={loading}
            saving={saving}
            message={saveMessage}
            error={error}
          />
        </div>

      {result && (
        <div className="mt-8 lg:mt-0 lg:col-span-8 space-y-4">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="py-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <MetaPill label="Ayanamsa" value={`${result.input.ayanamsa.toUpperCase()} → ${result.input.ayanamsa_value.toFixed(4)}°`} />
              <MetaPill label="House Sys" value={houseSysName(result.input.house_system)} />
              <MetaPill label="JD (UT)" value={result.input.jd_ut.toFixed(6)} />
              <MetaPill label="Engine" value={`SwE ${result.engine.swe_version}`} />
              <Link href="/yoga-dosha" className="ml-auto">
                <Button size="sm" className="bg-emerald-700 hover:bg-emerald-600 text-white">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Yogas &amp; Doshas
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList className="bg-slate-900/60 border border-slate-800 overflow-x-auto flex-nowrap w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="vargas">Vargas</TabsTrigger>
              <TabsTrigger value="planets">Planets</TabsTrigger>
              <TabsTrigger value="houses">Cusps</TabsTrigger>
              <TabsTrigger value="kp">KP</TabsTrigger>
              <TabsTrigger value="jaimini">Jaimini</TabsTrigger>
              <TabsTrigger value="ashtaka">Ashtakavarga</TabsTrigger>
              <TabsTrigger value="sudarshana">Sudarshana</TabsTrigger>
              <TabsTrigger value="chakras">Chakras</TabsTrigger>
              <TabsTrigger value="transit">Transit</TabsTrigger>
              <TabsTrigger value="dasha">Dasha</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-3">
              <Card className="bg-slate-900/60 border-slate-800">
                <CardContent className="py-5 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-400">Ascendant:</span>
                    <span className="font-medium text-slate-100">
                      {result.ascendant ? `${SIGNS[result.ascendant.sign_index]} ${result.ascendant.deg_in_sign.toFixed(2)}°` : '—'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {result.planets.slice(0, 9).map((p) => (
                      <div key={p.name} className="rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2">
                        <p className="text-[11px] text-slate-500">{p.name}</p>
                        <p className="text-sm text-slate-200">{SIGNS[p.sign_index]} {p.deg_in_sign.toFixed(1)}°{p.retrograde ? ' R' : ''}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 pt-2">
                    For comprehensive current assessment, see the <Link href="/current-assessment" className="text-saffron-400 hover:underline">Current Assessment</Link> tab.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts" className="mt-3">
              <div className="flex gap-1 mb-3">
                {['south', 'north'].map(s => (
                  <button key={s} onClick={() => setChartStyle(s)}
                    className={`px-3 min-h-[44px] py-1.5 rounded text-xs ${chartStyle === s ? 'bg-saffron/20 text-saffron-300 border border-saffron/30' : 'text-slate-400 border border-slate-700 hover:border-saffron/30'}`}>
                    {s === 'south' ? 'South Indian' : 'North Indian'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {chartStyle === 'south' ? (
                  <SouthIndianChart title="D1 — Rashi" ascSign={result.ascendant.sign_index}
                    placements={buildPlacements(result, 'sign_index')} />
                ) : (
                  <NorthIndianChart title="D1 — Rashi" ascSign={result.ascendant.sign_index}
                    placements={buildPlacements(result, 'sign_index')} />
                )}
                {chartStyle === 'south' ? (
                  <SouthIndianChart title="D9 — Navamsa"
                    ascSign={(Math.floor((result.ascendant.longitude * 9) % 360 / 30))}
                    placements={buildPlacements(result, 'd9_sign_index')} />
                ) : (
                  <NorthIndianChart title="D9 — Navamsa"
                    ascSign={(Math.floor((result.ascendant.longitude * 9) % 360 / 30))}
                    placements={buildPlacements(result, 'd9_sign_index')} />
                )}
                <BhavChalitChart result={result} chartStyle={chartStyle} />
              </div>
            </TabsContent>

            <TabsContent value="planets" className="mt-3">
              <Card className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-400">Body</TableHead>
                        <TableHead className="text-slate-400">Sign (D1)</TableHead>
                        <TableHead className="text-slate-400">DMS in Sign</TableHead>
                        <TableHead className="text-slate-400">Longitude</TableHead>
                        <TableHead className="text-slate-400">Nav (D9)</TableHead>
                        <TableHead className="text-slate-400">Nakshatra</TableHead>
                        <TableHead className="text-slate-400 text-center">Pada</TableHead>
                        <TableHead className="text-slate-400">Star Lord</TableHead>
                        <TableHead className="text-slate-400">Sub</TableHead>
                        <TableHead className="text-slate-400">Sub-Sub</TableHead>
                        <TableHead className="text-slate-400 text-center">R</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <PlanetRow p={result.ascendant} highlight />
                      {result.planets.map(p => <PlanetRow key={p.name} p={p} />)}
                      {result.upagrahas && (
                        <>
                          <PlanetRow key="Gulika" p={result.upagrahas.gulika} upagraha />
                          <PlanetRow key="Maandi" p={result.upagrahas.maandi} upagraha />
                        </>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="houses" className="mt-3">
              <Card className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-400">Cusp</TableHead>
                        <TableHead className="text-slate-400">Sign</TableHead>
                        <TableHead className="text-slate-400">DMS in Sign</TableHead>
                        <TableHead className="text-slate-400">Longitude</TableHead>
                        <TableHead className="text-slate-400">Nakshatra</TableHead>
                        <TableHead className="text-slate-400">Star Lord</TableHead>
                        <TableHead className="text-slate-400">Sub Lord</TableHead>
                        <TableHead className="text-slate-400">Sub-Sub Lord</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.houses.map(h => (
                        <TableRow key={h.name} className="border-slate-800">
                          <TableCell className="font-mono text-slate-200">{h.name}</TableCell>
                          <TableCell><SignBadge sign={h.sign} /></TableCell>
                          <TableCell className="font-mono text-slate-300">{h.dms}</TableCell>
                          <TableCell className="font-mono text-slate-500 text-xs">{h.longitude.toFixed(4)}°</TableCell>
                          <TableCell className="text-slate-300">{h.nakshatra}</TableCell>
                          <TableCell className="text-slate-300">{h.nakshatra_lord}</TableCell>
                          <TableCell className="text-saffron-300 font-medium">{h.sub_lord}</TableCell>
                          <TableCell className="text-saffron-200/70">{h.sub_sub_lord}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dasha" className="mt-3">
              <DashaPanel dasha={result.dasha} />
            </TabsContent>

            <TabsContent value="vargas" className="mt-3">
              <VargasPanel result={result} chartStyle={chartStyle} />
            </TabsContent>

            <TabsContent value="kp" className="mt-3">
              <KPPanel result={result} />
            </TabsContent>

            <TabsContent value="jaimini" className="mt-3">
              <JaiminiPanel result={result} />
            </TabsContent>

            <TabsContent value="transit" className="mt-3">
              <TransitPanel result={result} form={form} setResult={setResult} />
            </TabsContent>

            <TabsContent value="ashtaka" className="mt-3">
              <AshtakavargaPanel result={result} />
            </TabsContent>

            <TabsContent value="sudarshana" className="mt-3">
              <SudarshanaPanel result={result} />
            </TabsContent>

            <TabsContent value="chakras" className="mt-3">
              <ChakrasPanel result={result} />
            </TabsContent>
          </Tabs>
        </div>
      )}
      </div>
    </main>
  );
}

// ---------------- helpers & subcomponents ----------------

function MetaPill({ label, value }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-slate-500">{label}</span>
      <span className="font-mono text-slate-200">{value}</span>
    </div>
  );
}

function SignBadge({ sign }) {
  return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{sign}</span>;
}

function PlanetRow({ p, highlight, upagraha }) {
  const isAsc = p.name === 'Ascendant';
  return (
    <TableRow className={`border-slate-800 ${highlight ? 'bg-saffron-500/5' : ''} ${upagraha ? 'bg-violet-500/5' : ''}`}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center justify-center h-6 min-w-6 px-1 rounded-md text-xs ${
            isAsc ? 'bg-saffron-500/20 text-saffron-300' :
            upagraha ? 'bg-violet-500/20 text-violet-300' :
            'bg-slate-800 text-slate-300'}`}>
            {PLANET_GLYPH[p.name] || p.name.slice(0, 2)}
          </span>
          <span className="text-slate-100">{p.name}</span>
          {p.karaka_7 && (
            <span className="inline-flex items-center px-1.5 py-0 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" title={`Jaimini ${p.karaka_7}`}>
              {p.karaka_7}
            </span>
          )}
          {upagraha && <span className="text-[9px] uppercase tracking-wider text-violet-400/70">upagraha</span>}
        </div>
      </TableCell>
      <TableCell><SignBadge sign={p.sign} /></TableCell>
      <TableCell className="font-mono text-slate-300">{p.dms}</TableCell>
      <TableCell className="font-mono text-slate-500 text-xs">{p.longitude.toFixed(4)}°</TableCell>
      <TableCell className="text-slate-300">{p.d9_sign}</TableCell>
      <TableCell className="text-slate-300">{p.nakshatra}</TableCell>
      <TableCell className="text-center text-slate-300">{p.pada}</TableCell>
      <TableCell className="text-slate-300">{p.nakshatra_lord}</TableCell>
      <TableCell className="text-saffron-300 font-medium">{p.sub_lord}</TableCell>
      <TableCell className="text-saffron-200/70">{p.sub_sub_lord}</TableCell>
      <TableCell className="text-center">
        {p.retrograde ? <span className="text-rose-400 text-xs font-semibold">R</span> : <span className="text-slate-600">—</span>}
      </TableCell>
    </TableRow>
  );
}

function houseSysName(k) {
  return { P:'Placidus', W:'Whole Sign', E:'Equal', K:'Koch', R:'Regiomontanus', B:'Alcabitius' }[k] || k;
}

function houseOfPlanet(lon, cusps) {
  const pl = ((lon % 360) + 360) % 360;
  for (let h = 0; h < 12; h++) {
    const c1 = ((cusps[h] % 360) + 360) % 360;
    const c2 = ((cusps[(h + 1) % 12] % 360) + 360) % 360;
    if (c1 <= c2) {
      if (pl >= c1 && pl < c2) return h + 1;
    } else if (pl >= c1 || pl < c2) {
      return h + 1;
    }
  }
  return 12;
}

function buildBhavChalitPlacements(result) {
  const cusps = result.houses.map((h) => h.longitude);
  const placements = Array.from({ length: 12 }, () => []);
  const cuspHouseLabels = Array.from({ length: 12 }, () => []);

  result.houses.forEach((h, i) => {
    cuspHouseLabels[h.sign_index].push(i + 1);
  });

  const place = (body) => {
    const bhava = houseOfPlanet(body.longitude, cusps);
    const chalitSign = result.houses[bhava - 1].sign_index;
    placements[chalitSign].push(body);
  };

  for (const p of result.planets) {
    place({
      name: p.name,
      deg: p.deg_in_sign,
      longitude: p.longitude,
      rasiSign: p.sign_index,
      retrograde: p.retrograde,
    });
  }
  if (result.upagrahas) {
    ['gulika', 'maandi'].forEach((k) => {
      const u = result.upagrahas[k];
      place({
        name: k === 'gulika' ? 'Gulika' : 'Maandi',
        deg: u.deg_in_sign,
        longitude: u.longitude,
        rasiSign: u.sign_index,
        isUpa: true,
      });
    });
  }
  placements[result.ascendant.sign_index].push({
    name: 'Asc',
    deg: result.ascendant.deg_in_sign,
    longitude: result.ascendant.longitude,
    isAsc: true,
    bhava: 1,
  });

  return { placements, ascSign: result.ascendant.sign_index, cuspHouseLabels };
}

function BhavChalitChart({ result, chartStyle }) {
  const { placements, ascSign, cuspHouseLabels } = buildBhavChalitPlacements(result);
  const hs = houseSysName(result.input.house_system);
  if (chartStyle === 'north') {
    return (
      <NorthIndianChart
        title={`KP Bhav Chalit — ${hs}`}
        ascSign={ascSign}
        placements={placements}
      />
    );
  }
  return (
    <SouthIndianChart
      title={`KP Bhav Chalit — ${hs}`}
      ascSign={ascSign}
      placements={placements}
      cuspHouseLabels={cuspHouseLabels}
      centerLabel="Bhav Chalit"
      centerSubtitle={`Planets by bhava · ${hs} cusps`}
      showBhavaShift
    />
  );
}

// Build map: signIndex -> [{name, deg_in_sign}]
function buildPlacements(result, key) {
  const map = Array.from({ length: 12 }, () => []);
  for (const p of result.planets) map[p[key]].push({ name: p.name, deg: p.deg_in_sign });
  // Upagrahas (Gulika, Maandi) — distinct kind flag for styling
  if (result.upagrahas) {
    const g = result.upagrahas.gulika, m = result.upagrahas.maandi;
    if (key === 'd9_sign_index') {
      map[g.d9_sign_index].push({ name: 'Gulika', deg: ((g.longitude * 9) % 360) % 30, isUpa: true });
      map[m.d9_sign_index].push({ name: 'Maandi', deg: ((m.longitude * 9) % 360) % 30, isUpa: true });
    } else {
      map[g.sign_index].push({ name: 'Gulika', deg: g.deg_in_sign, isUpa: true });
      map[m.sign_index].push({ name: 'Maandi', deg: m.deg_in_sign, isUpa: true });
    }
  }
  const ascKey = key === 'd9_sign_index'
    ? Math.floor(((result.ascendant.longitude * 9) % 360) / 30)
    : result.ascendant.sign_index;
  map[ascKey].push({ name: 'Asc', deg: result.ascendant.deg_in_sign, isAsc: true });
  return map;
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const yy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth()+1).padStart(2,'0');
  const dd = String(d.getUTCDate()).padStart(2,'0');
  return `${yy}-${mm}-${dd}`;
}

function DashaPanel({ dasha }) {
  if (!dasha) return null;
  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/60 border-slate-800">
        <CardContent className="py-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <MetaPill label="Moon Nakshatra" value={dasha.nakshatra_at_birth} />
          <MetaPill label="Birth Lord" value={dasha.lord_at_birth} />
          <MetaPill label="Balance" value={`${dasha.balance_years.toFixed(4)} yrs`} />
          <MetaPill label="Now (UTC)" value={fmtDate(dasha.now_utc)} />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DashaTable title="Mahadasha (MD)" rows={dasha.mds} lordKey="lord" />
        <DashaTable title="Antardasha (AD) — Current MD" rows={dasha.ads} lordKey="lord" parentKey="md_lord" />
        <DashaTable title="Pratyantardasha (PD) — Current AD" rows={dasha.pds} lordKey="lord" parentKey="ad_lord" />
      </div>
    </div>
  );
}

function DashaTable({ title, rows, lordKey, parentKey }) {  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-200 text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="px-4 pb-4 text-xs text-slate-500">No period active.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 text-xs">Lord</TableHead>
                <TableHead className="text-slate-400 text-xs">Start</TableHead>
                <TableHead className="text-slate-400 text-xs">End</TableHead>
                <TableHead className="text-slate-400 text-xs text-right">Yrs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i} className={`border-slate-800 ${r.current ? 'bg-saffron-500/10' : ''}`}>
                  <TableCell className="py-2">
                    <span className={`text-sm ${r.current ? 'text-saffron-300 font-semibold' : 'text-slate-200'}`}>
                      {parentKey ? `${r[parentKey]}-${r[lordKey]}` : r[lordKey]}
                    </span>
                    {r.is_balance && <span className="ml-2 text-[10px] text-emerald-400/80 uppercase">balance</span>}
                  </TableCell>
                  <TableCell className="font-mono text-slate-400 text-xs">{fmtDate(r.start)}</TableCell>
                  <TableCell className="font-mono text-slate-400 text-xs">{fmtDate(r.end)}</TableCell>
                  <TableCell className="font-mono text-slate-500 text-xs text-right">{r.years.toFixed(3)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Vargas Panel: 16 divisional charts in a responsive grid ----------
function VargasPanel({ result, chartStyle }) {
  const [selected, setSelected] = useState('D9');
  if (!result.vargas) return null;
  const varga = result.vargas[selected];
  const bodyList = ['Ascendant', ...result.planets.map(p => p.name)];
  // Compute placements: for each sign 0-11, list bodies whose selected-varga-sign = that sign
  const map = Array.from({ length: 12 }, () => []);
  const ascKey = varga['Ascendant'];
  for (const p of result.planets) {
    map[varga[p.name]].push({ name: p.name });
  }
  map[ascKey].push({ name: 'Asc', isAsc: true });
  const vargaName = result.varga_names?.[selected] || selected;

  return (
    <div className="space-y-3">
      <Card className="bg-slate-900/60 border-slate-800">
        <CardContent className="py-3 flex flex-wrap gap-1.5">
          {VARGA_KEYS.map(k => (
            <button key={k} onClick={() => setSelected(k)}
              className={`text-xs px-2.5 py-1 rounded-md border transition font-mono ${
                selected === k ? 'bg-saffron-500/20 border-saffron-500/40 text-saffron-300' :
                'bg-slate-800/70 hover:bg-slate-700 border-slate-700 text-slate-300'}`}>
              {k}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-500 self-center">{vargaName}</span>
        </CardContent>
      </Card>
      <VargaChart title={`${selected} — ${vargaName}`} ascSign={ascKey} placements={map} big chartStyle={chartStyle} />
      {/* All-16 overview grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {VARGA_KEYS.map(k => {
          const v = result.vargas[k];
          const m = Array.from({ length: 12 }, () => []);
          for (const p of result.planets) m[v[p.name]].push({ name: p.name });
          m[v['Ascendant']].push({ name: 'Asc', isAsc: true });
          return (
            <button key={k} onClick={() => setSelected(k)}
              className={`text-left rounded-md border transition ${selected === k ? 'border-saffron-500/50' : 'border-slate-800 hover:border-slate-700'}`}>
              <VargaChart title={`${k} · ${result.varga_names?.[k] || k}`} ascSign={v['Ascendant']} placements={m} compact chartStyle={chartStyle} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// A generic chart that accepts pre-computed placements (works for any varga)
function VargaChart({ title, ascSign, placements, compact, big, chartStyle }) {
  if (chartStyle === 'north') {
    return (
      <NorthIndianChart title={title} ascSign={ascSign} placements={placements}
        className={big ? 'max-w-2xl mx-auto' : ''} />
    );
  }
  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className={compact ? "p-2 pb-1" : "pb-2"}>
        <CardTitle className={`text-slate-200 ${compact ? 'text-[11px]' : 'text-sm'} font-medium tracking-wide`}>{title}</CardTitle>
      </CardHeader>
      <CardContent className={compact ? 'p-1 pt-0' : ''}>
        <div className={`grid grid-cols-4 grid-rows-4 aspect-square border border-slate-700 bg-slate-950/50 rounded overflow-hidden ${big ? 'max-w-2xl mx-auto' : ''}`}>
          {SI_LAYOUT.flat().map((si, idx) => {
            const r = Math.floor(idx / 4), c = idx % 4;
            if (si === -1) {
              if (r === 1 && c === 1) return (
                <div key="center" className="col-span-2 row-span-2 border border-slate-800 flex items-center justify-center bg-slate-900/40">
                  <div className="text-center">
                    <div className={`text-slate-500 ${compact ? 'text-[8px]' : 'text-[10px]'} uppercase tracking-widest`}>Asc: {SIGNS[ascSign]}</div>
                  </div>
                </div>
              );
              return null;
            }
            const house = ((si - ascSign + 12) % 12) + 1;
            const isAsc = house === 1;
            const bodies = placements[si] || [];
            return (
              <div key={idx} className={`relative border border-slate-800 ${compact ? 'p-0.5' : 'p-1'} ${compact ? 'text-[8px]' : 'text-[10px]'} leading-tight ${isAsc ? 'bg-saffron-500/10' : 'bg-slate-950/30'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{SIGN_ABBR[si]}</span>
                  <span className={`${isAsc ? 'text-saffron-400 font-semibold' : 'text-slate-600'} ${compact ? 'text-[7px]' : 'text-[9px]'}`}>H{house}</span>
                </div>
                <div className={`mt-0.5 flex flex-wrap ${compact ? 'gap-0.5' : 'gap-x-1 gap-y-0.5'}`}>
                  {bodies.map((b, i) => (
                    <span key={i} className={`${
                      b.isAsc ? 'text-saffron-300 font-semibold' :
                      b.name === 'Rahu' || b.name === 'Ketu' ? 'text-fuchsia-300' :
                      'text-slate-200'}`}>
                      {b.isAsc ? 'Asc' : SHORT[b.name] || b.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- KP Panel: Cuspal Interlink + Planet Significators ----------
const KP_LORD_LABELS = ['Star Lord', 'Sub Lord', 'Sub-Sub Lord', 'Sub³ Lord', 'Sub⁴ Lord'];

function kpLordTone(level) {
  return ['text-slate-300', 'text-saffron-300 font-medium', 'text-saffron-200/80', 'text-saffron-200/60', 'text-saffron-200/45'][level] || 'text-slate-300';
}

function kpLordsFromBody(body) {
  if (body.kp_lords?.length >= 5) return body.kp_lords;
  return [
    body.star_lord || body.nakshatra_lord,
    body.sub_lord,
    body.sub_sub_lord,
    body.sub_sub_sub_lord,
    body.sub_sub_sub_sub_lord,
  ];
}

function collectKPBodies(result) {
  const rows = [{ ...result.ascendant, name: 'Ascendant' }, ...result.planets];
  if (result.upagrahas) {
    rows.push({ ...result.upagrahas.gulika, name: 'Gulika' });
    rows.push({ ...result.upagrahas.maandi, name: 'Maandi' });
  }
  return rows;
}

function KPPanel({ result }) {
  if (!result.kp_cuspal_interlink) return null;
  const bodies = collectKPBodies(result);
  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-200 text-sm">KP Planetary Lordship — 5 Levels</CardTitle>
          <CardDescription className="text-[11px]">
            Vimshottari subdivision chain per body: Star Lord through four sub-lords (Sub⁴). Each level subdivides the parent span in 120-year proportions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Body</TableHead>
                <TableHead className="text-slate-400">Sign</TableHead>
                <TableHead className="text-slate-400">Longitude</TableHead>
                <TableHead className="text-slate-400">Nakshatra</TableHead>
                {KP_LORD_LABELS.map((label) => (
                  <TableHead key={label} className="text-slate-400">{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {bodies.map((b) => {
                const lords = kpLordsFromBody(b);
                return (
                  <TableRow key={b.name} className="border-slate-800">
                    <TableCell className="font-medium text-slate-100">{b.name}</TableCell>
                    <TableCell><SignBadge sign={b.sign} /></TableCell>
                    <TableCell className="font-mono text-slate-500 text-xs">{b.longitude?.toFixed(4)}°</TableCell>
                    <TableCell className="text-slate-300">{b.nakshatra} <span className="text-slate-500">P{b.pada}</span></TableCell>
                    {lords.map((lord, i) => (
                      <TableCell key={i} className={kpLordTone(i)}>{lord || '—'}</TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-200 text-sm">KP Cuspal Interlink</CardTitle>
          <CardDescription className="text-[11px]">Each cusp&apos;s sub-lord chain determines whether the matter of that house materializes. Rashi Lord = sign owner; levels 1–5 = Star through Sub⁴.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">House</TableHead>
                <TableHead className="text-slate-400">Cusp</TableHead>
                <TableHead className="text-slate-400">Sign</TableHead>
                <TableHead className="text-slate-400">Rashi Lord</TableHead>
                {KP_LORD_LABELS.map((label) => (
                  <TableHead key={label} className="text-slate-400">{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.kp_cuspal_interlink.map((c) => {
                const lords = c.kp_lords?.length >= 5 ? c.kp_lords : kpLordsFromBody(c);
                return (
                  <TableRow key={c.house} className="border-slate-800">
                    <TableCell className="font-mono text-slate-200">{c.house}</TableCell>
                    <TableCell className="font-mono text-slate-300">{c.cusp_dms}</TableCell>
                    <TableCell><SignBadge sign={c.sign} /></TableCell>
                    <TableCell className="text-slate-300">{c.rashi_lord}</TableCell>
                    {lords.map((lord, i) => (
                      <TableCell key={i} className={kpLordTone(i)}>{lord || '—'}</TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-200 text-sm">KP Planet Significators</CardTitle>
          <CardDescription className="text-[11px]">Houses signified by each planet across the 4 KP levels: A) star-lord-occupies (strongest) &middot; B) planet-occupies &middot; C) star-lord-owns &middot; D) planet-owns.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Planet</TableHead>
                <TableHead className="text-slate-400">Star Lord</TableHead>
                <TableHead className="text-slate-400">A · SL Occ</TableHead>
                <TableHead className="text-slate-400">B · Planet Occ</TableHead>
                <TableHead className="text-slate-400">C · SL Owns</TableHead>
                <TableHead className="text-slate-400">D · Planet Owns</TableHead>
                <TableHead className="text-slate-400 font-semibold">All Houses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(result.kp_significators).map(([planet, s]) => (
                <TableRow key={planet} className="border-slate-800">
                  <TableCell className="font-medium text-slate-100">{planet}</TableCell>
                  <TableCell className="text-slate-300">{s.star_lord}</TableCell>
                  <TableCell className="font-mono text-slate-300">{s.level_A_star_lord_occupies.join(', ') || '—'}</TableCell>
                  <TableCell className="font-mono text-slate-300">{s.level_B_planet_occupies.join(', ') || '—'}</TableCell>
                  <TableCell className="font-mono text-slate-400">{s.level_C_star_lord_owns.join(', ') || '—'}</TableCell>
                  <TableCell className="font-mono text-slate-400">{s.level_D_planet_owns.join(', ') || '—'}</TableCell>
                  <TableCell className="font-mono text-saffron-300 font-semibold">{s.all_signified_houses.join(', ')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Transit Panel: time scrubber + dual chart (natal + transit) ----------
function TransitPanel({ result, form, setResult }) {
  const now = new Date();
  const [t, setT] = useState(() => ({
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
    hour: now.getUTCHours(),
    minute: now.getUTCMinutes(),
  }));
  const [loading, setLoading] = useState(false);
  const [natalVarga, setNatalVarga] = useState('D1');
  const [transitVarga, setTransitVarga] = useState('D1');

  const shift = (unit, amt) => {
    const d = new Date(Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute));
    if (unit === 'year')  d.setUTCFullYear(d.getUTCFullYear() + amt);
    if (unit === 'month') d.setUTCMonth(d.getUTCMonth() + amt);
    if (unit === 'day')   d.setUTCDate(d.getUTCDate() + amt);
    if (unit === 'hour')  d.setUTCHours(d.getUTCHours() + amt);
    setT({
      year:d.getUTCFullYear(), month:d.getUTCMonth()+1, day:d.getUTCDate(),
      hour:d.getUTCHours(), minute:d.getUTCMinutes()
    });
  };

  const compute = async () => {
    setLoading(true);
    try {
      const payload = { ...form, transit: { ...t, tz_name: form.tz_name, tz_offset: form.tz_offset } };
      if (payload.ayanamsa === 'kp') payload.house_system = 'P';
      const res = await fetch('/api/calculate', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'transit calc failed');
      setResult(data);
    } catch(e) { alert(e.message); }
    finally { setLoading(false); }
  };

  const transit = result.transit;
  // Placements for natal chart (using selected varga)
  const buildFromVarga = (vargaMap, planetsList, ascendantKey) => {
    const m = Array.from({ length: 12 }, () => []);
    for (const p of planetsList) m[vargaMap[p.name]].push({ name: p.name });
    m[ascendantKey].push({ name: 'Asc', isAsc: true });
    return m;
  };
  const natalMap = result.vargas ? buildFromVarga(result.vargas[natalVarga], result.planets, result.vargas[natalVarga]['Ascendant']) : null;
  const transitMap = transit && transit.vargas ? buildFromVarga(transit.vargas[transitVarga], transit.planets, transit.vargas[transitVarga]['Ascendant']) : null;

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-200 text-sm">Transit Date/Time (UTC)</CardTitle>
          <CardDescription className="text-[11px]">Scrub forward/backward. Uses the birth chart&apos;s location for house cusps &amp; ascendant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            <Input type="number" value={t.year}   onChange={e => setT({...t, year:+e.target.value})}   className="text-center font-mono"/>
            <Input type="number" value={t.month}  onChange={e => setT({...t, month:+e.target.value})}  className="text-center font-mono"/>
            <Input type="number" value={t.day}    onChange={e => setT({...t, day:+e.target.value})}    className="text-center font-mono"/>
            <Input type="number" value={t.hour}   onChange={e => setT({...t, hour:+e.target.value})}   className="text-center font-mono"/>
            <Input type="number" value={t.minute} onChange={e => setT({...t, minute:+e.target.value})} className="text-center font-mono"/>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[['year',-1],['year',+1],['month',-1],['month',+1],['day',-1],['day',+1],['hour',-1],['hour',+1]].map(([u,a]) => (
              <button key={`${u}${a}`} onClick={() => shift(u,a)}
                className="text-xs px-2 py-1 rounded-md bg-slate-800/70 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono">
                {a > 0 ? '+' : ''}{a} {u}
              </button>
            ))}
            <Button onClick={compute} disabled={loading} className="ml-auto bg-gradient-to-r from-saffron-500 to-saffron-600 text-slate-950 h-7 text-xs font-semibold">
              {loading ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin"/>Computing…</> : 'Compute Transit'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {transit && (
        <>
          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="py-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
              <MetaPill label="Transit UTC"  value={`${transit.input.date} ${transit.input.time}`} />
              <MetaPill label="TZ Offset"    value={`${transit.input.tz_offset >= 0 ? '+' : ''}${transit.input.tz_offset}h`} />
              <MetaPill label="Transit JD"   value={transit.input.jd_ut.toFixed(4)} />
              <MetaPill label="Transit ASC"  value={`${transit.ascendant.dms} ${transit.ascendant.sign}`} />
            </CardContent>
          </Card>

          {/* Varga selectors for dual view */}
          <div className="flex flex-col sm:flex-row gap-4 text-xs">
            <div className="flex-1">
              <div className="text-slate-500 mb-1">Natal chart varga</div>
              <div className="flex flex-wrap gap-1">
                {VARGA_KEYS.map(k => (
                  <button key={k} onClick={() => setNatalVarga(k)}
                    className={`px-1.5 py-0.5 rounded font-mono ${natalVarga === k ? 'bg-saffron-500/20 text-saffron-300' : 'bg-slate-800 text-slate-400'}`}>{k}</button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-slate-500 mb-1">Transit chart varga</div>
              <div className="flex flex-wrap gap-1">
                {VARGA_KEYS.map(k => (
                  <button key={k} onClick={() => setTransitVarga(k)}
                    className={`px-1.5 py-0.5 rounded font-mono ${transitVarga === k ? 'bg-saffron-500/20 text-saffron-300' : 'bg-slate-800 text-slate-400'}`}>{k}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {natalMap && (
              <VargaChart title={`NATAL · ${natalVarga}`} ascSign={result.vargas[natalVarga]['Ascendant']} placements={natalMap} />
            )}
            {transitMap && (
              <VargaChart title={`TRANSIT · ${transitVarga}`} ascSign={transit.vargas[transitVarga]['Ascendant']} placements={transitMap} />
            )}
          </div>

          {/* Transit planet table */}
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-2"><CardTitle className="text-slate-200 text-sm">Transit Planet Positions</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Body</TableHead>
                    <TableHead className="text-slate-400">Sign</TableHead>
                    <TableHead className="text-slate-400">DMS</TableHead>
                    <TableHead className="text-slate-400">Nakshatra</TableHead>
                    <TableHead className="text-slate-400">Pada</TableHead>
                    <TableHead className="text-slate-400">R</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-slate-800 bg-saffron-500/5">
                    <TableCell className="text-saffron-300 font-medium">Ascendant</TableCell>
                    <TableCell><SignBadge sign={transit.ascendant.sign} /></TableCell>
                    <TableCell className="font-mono text-slate-300">{transit.ascendant.dms}</TableCell>
                    <TableCell className="text-slate-300">{transit.ascendant.nakshatra}</TableCell>
                    <TableCell className="text-center text-slate-300">{transit.ascendant.pada}</TableCell>
                    <TableCell>—</TableCell>
                  </TableRow>
                  {transit.planets.map(p => (
                    <TableRow key={p.name} className="border-slate-800">
                      <TableCell className="text-slate-100">{p.name}</TableCell>
                      <TableCell><SignBadge sign={p.sign} /></TableCell>
                      <TableCell className="font-mono text-slate-300">{p.dms}</TableCell>
                      <TableCell className="text-slate-300">{p.nakshatra}</TableCell>
                      <TableCell className="text-center text-slate-300">{p.pada}</TableCell>
                      <TableCell>{p.retrograde ? <span className="text-rose-400 text-xs font-semibold">R</span> : <span className="text-slate-600">—</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}


// ============================================================
// Ashtakavarga Panel — South / North Indian bindu charts
// ============================================================
const AV_PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
const NIC_CENTROID = {
  1: [50, 27], 2: [25, 12], 3: [12, 25], 4: [27, 50], 5: [12, 75], 6: [25, 88],
  7: [50, 73], 8: [75, 88], 9: [88, 75], 10: [73, 50], 11: [88, 25], 12: [75, 12],
};

function avBinduClass(v, kind) {
  if (kind === 'sav') {
    if (v >= 28) return 'text-emerald-400';
    if (v < 25) return 'text-rose-400';
    return 'text-saffron-300';
  }
  if (v >= 5) return 'text-emerald-400';
  if (v <= 2) return 'text-rose-400';
  return 'text-saffron-300';
}

function AshtakaSouthChart({ title, bindus, ascSign, kind = 'sav', compact }) {
  const sz = compact ? 'text-[8px]' : 'text-[10px]';
  const binduSz = compact ? 'text-base' : 'text-2xl';
  return (
    <div>
      {title && <div className={`${sz} text-slate-400 mb-1.5 text-center`}>{title}</div>}
      <div className={`grid grid-cols-4 grid-rows-4 aspect-square border border-slate-700 bg-slate-950/50 rounded-md overflow-hidden ${compact ? '' : 'max-w-sm mx-auto'}`}>
        {SI_LAYOUT.flat().map((si, idx) => {
          const r = Math.floor(idx / 4), c = idx % 4;
          if (si === -1) {
            if (r === 1 && c === 1) {
              return (
                <div key="center" className="col-span-2 row-span-2 border border-slate-800 flex items-center justify-center bg-slate-900/40">
                  <div className="text-center px-1">
                    <div className={`${sz} uppercase tracking-widest text-slate-500`}>South Indian</div>
                    {!compact && <div className={`${sz} text-slate-500 mt-1`}>Asc: {SIGNS[ascSign]}</div>}
                  </div>
                </div>
              );
            }
            return null;
          }
          const house = ((si - ascSign + 12) % 12) + 1;
          const v = bindus[si] ?? 0;
          return (
            <div key={idx} className={`relative border border-slate-800 p-0.5 flex flex-col ${house === 1 ? 'bg-saffron-500/10' : 'bg-slate-950/30'}`}>
              <div className="flex items-center justify-between">
                <span className={`${sz} text-slate-500`}>{SIGN_ABBR[si]}</span>
                <span className={`${sz} text-slate-600`}>H{house}</span>
              </div>
              <div className={`flex-1 flex items-center justify-center font-mono font-semibold ${binduSz} ${avBinduClass(v, kind)}`}>{v}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AshtakaNorthChart({ title, bindus, ascSign, kind = 'sav', compact }) {
  const COL = '#7b5cff';
  const fs = compact ? 5.5 : 6.5;
  let svg = `<svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">`;
  if (title) svg += `<text x="50" y="6" text-anchor="middle" fill="#94a3b8" font-size="3.8">${title}</text>`;
  svg += `<rect x="1" y="8" width="98" height="90" fill="none" stroke="${COL}" stroke-width="0.6"/>`;
  svg += `<line x1="1" y1="8" x2="99" y2="98" stroke="${COL}" stroke-width="0.4"/>`;
  svg += `<line x1="99" y1="8" x2="1" y2="98" stroke="${COL}" stroke-width="0.4"/>`;
  svg += `<polygon points="50,8 99,53 50,98 1,53" fill="none" stroke="${COL}" stroke-width="0.4"/>`;
  for (let h = 1; h <= 12; h++) {
    const signIdx = (ascSign + h - 1) % 12;
    const v = bindus[signIdx] ?? 0;
    const c = NIC_CENTROID[h];
    const tone = v >= (kind === 'sav' ? 28 : 5) ? '#34d399' : v < (kind === 'sav' ? 25 : 3) ? '#f87171' : '#fbbf24';
    svg += `<text x="${c[0]}" y="${c[1] - 2}" text-anchor="middle" font-size="3" fill="#64748b">H${h}</text>`;
    svg += `<text x="${c[0]}" y="${c[1] + 3}" text-anchor="middle" font-size="2.6" fill="#7c83f7">${SIGN_ABBR[signIdx]}</text>`;
    svg += `<text x="${c[0]}" y="${c[1] + 10}" text-anchor="middle" font-size="${fs}" fill="${tone}" font-weight="600">${v}</text>`;
  }
  svg += '</svg>';
  return (
    <div className={compact ? '' : 'max-w-sm mx-auto'}>
      <div className="aspect-square" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}

function AshtakavargaPanel({ result }) {
  const [selected, setSelected] = useState('Sun');
  const [format, setFormat] = useState('south');
  if (!result.ashtakavarga) return null;
  const av = result.ashtakavarga;
  const ascSign = result.ascendant.sign_index;
  const savMin = Math.min(...av.sav);
  const savMax = Math.max(...av.sav);
  const Chart = format === 'north' ? AshtakaNorthChart : AshtakaSouthChart;

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-slate-200 text-sm">Sarvashtakavarga (SAV)</CardTitle>
              <CardDescription className="text-[11px]">Aggregate bindus across all 7 grahas. Sum = {av.sav_total} (classical 337).</CardDescription>
            </div>
            <div className="flex gap-1">
              {['south', 'north'].map((f) => (
                <button key={f} type="button" onClick={() => setFormat(f)}
                  className={`text-xs px-3 py-1 rounded-md border transition font-mono ${
                    format === f ? 'bg-saffron-500/20 border-saffron-500/40 text-saffron-300' :
                    'bg-slate-800/70 hover:bg-slate-700 border-slate-700 text-slate-300'}`}>
                  {f === 'south' ? 'South Indian' : 'North Indian'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Chart title="SAV — all planets" bindus={av.sav} ascSign={ascSign} kind="sav" />
          <div className="text-[10px] text-slate-500 font-mono mt-3 text-center">
            SAV range: min {savMin} · max {savMax} · avg {(av.sav_total / 12).toFixed(1)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-200 text-sm">Bhinnashtakavarga (BAV)</CardTitle>
          <CardDescription className="text-[11px]">Per-planet benefic bindus in {format === 'south' ? 'fixed signs (South)' : 'houses from Lagna (North)'}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {AV_PLANETS.map((p) => (
              <button key={p} type="button" onClick={() => setSelected(p)}
                className={`text-xs px-3 py-1 rounded-md border transition font-mono ${
                  selected === p ? 'bg-saffron-500/20 border-saffron-500/40 text-saffron-300' :
                  'bg-slate-800/70 hover:bg-slate-700 border-slate-700 text-slate-300'}`}>
                {p} <span className="text-slate-500 ml-1">({av.totals[p]})</span>
              </button>
            ))}
          </div>
          <Chart title={`${selected} BAV`} bindus={av.bav[selected]} ascSign={ascSign} kind="bav" />
          <div>
            <div className="text-xs text-slate-500 mb-2">All seven BAV charts</div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {AV_PLANETS.map((p) => (
                <Chart key={p} title={p} bindus={av.bav[p]} ascSign={ascSign} kind="bav" compact />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Sudarshana Chakra (3 concentric perspectives — from Lagna, Moon, Sun)
// ============================================================
function SudarshanaPanel({ result }) {
  const asc = result.ascendant.sign_index;
  const moon = result.planets.find(p => p.name === 'Moon').sign_index;
  const sun  = result.planets.find(p => p.name === 'Sun').sign_index;

  const buildMap = () => {
    const m = Array.from({ length: 12 }, () => []);
    for (const p of result.planets) m[p.sign_index].push({ name: p.name });
    return m;
  };
  const placements = buildMap();
  // Ascendant in Lagna view goes into Lagna's sign
  const placementsForAsc = (ascSign) => {
    const m = placements.map(arr => [...arr]);
    m[ascSign].push({ name: 'Asc', isAsc: true });
    return m;
  };

  return (
    <div className="space-y-3">
      <Card className="bg-slate-900/60 border-slate-800">
        <CardContent className="py-3 text-xs text-slate-400">
          Sudarshana Chakra shows the natal chart from three vantage points simultaneously.
          Planets stay in their absolute signs; house numbers count from three different lagnas.
          Convergent themes across all three wheels reveal life-force emphasis.
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <VargaChart title={`Lagna Chakra — from Ascendant (${SIGNS[asc]})`}   ascSign={asc}  placements={placementsForAsc(asc)} />
        <VargaChart title={`Chandra Chakra — from Moon (${SIGNS[moon]})`}     ascSign={moon} placements={placementsForAsc(moon)} />
        <VargaChart title={`Surya Chakra — from Sun (${SIGNS[sun]})`}         ascSign={sun}  placements={placementsForAsc(sun)} />
      </div>
    </div>
  );
}

// ============================================================
// Special Chakras Panel (Kala, Sarvatobhadra, Kota, Soola, Tripataki)
// ============================================================
const NAKSHATRA_NAMES = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha',
  'Magha','P.Phalguni','U.Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Mula','P.Ashadha','U.Ashadha','Shravana','Dhanishta','Shatabhisha','P.Bhadrapada','U.Bhadrapada','Revati',
];
const NAK_SHORT = ['Ash','Bha','Kri','Roh','Mri','Ard','Pun','Pus','Ashl','Mag','PPh','UPh','Has','Chi','Swa','Vis','Anu','Jye','Mul','PAs','UAs','Shr','Dha','Sha','PBh','UBh','Rev'];

function ChakrasPanel({ result }) {
  const [tab, setTab] = useState('kala');
  return (
    <div className="space-y-3">
      <Card className="bg-slate-900/60 border-slate-800">
        <CardContent className="py-3 flex flex-wrap gap-1.5">
          {[['kala','Kala Chakra'],['sarvatobhadra','Sarvatobhadra'],['kota','Kota Chakra'],['soola','Soola Chakra'],['tripataki','Tripataki']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`text-xs px-3 py-1 rounded-md border font-mono ${
                tab === k ? 'bg-saffron-500/20 border-saffron-500/40 text-saffron-300' :
                'bg-slate-800/70 hover:bg-slate-700 border-slate-700 text-slate-300'}`}>{l}</button>
          ))}
        </CardContent>
      </Card>
      {tab === 'kala'         && <KalaChakra result={result} />}
      {tab === 'sarvatobhadra' && <SarvatobhadraChakra result={result} />}
      {tab === 'kota'         && <KotaChakra result={result} />}
      {tab === 'soola'        && <SoolaChakra result={result} />}
      {tab === 'tripataki'    && <TripatakiChakra result={result} />}
    </div>
  );
}

// -- Kala Chakra: 27 nakshatra circular wheel with planet markers --
function KalaChakra({ result }) {
  // Build nakshatra -> planets map
  const nakMap = Array.from({ length: 27 }, () => []);
  for (const p of result.planets) nakMap[p.nakshatra_index].push(p.name);
  nakMap[result.ascendant.nakshatra_index].push('Asc');
  const cx = 260, cy = 260, rOuter = 240, rInner = 170, rMid = 205;

  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-200 text-sm">Kala Chakra (Wheel of Time)</CardTitle>
        <CardDescription className="text-[11px]">27 nakshatras around the periphery. Planets shown at their birth nakshatra. Used for muhurta selection and transit timing.</CardDescription>
      </CardHeader>
      <CardContent>
        <svg viewBox="0 0 520 520" className="w-full max-w-lg mx-auto">
          {/* Outer ring */}
          <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="#334155" strokeWidth="1"/>
          <circle cx={cx} cy={cy} r={rMid}   fill="none" stroke="#334155" strokeWidth="0.5"/>
          <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="#334155" strokeWidth="1"/>
          {/* 27 segments */}
          {Array.from({ length: 27 }, (_, i) => {
            const a0 = (i / 27) * 2 * Math.PI - Math.PI / 2;
            const a1 = ((i + 1) / 27) * 2 * Math.PI - Math.PI / 2;
            const am = (a0 + a1) / 2;
            const x0 = cx + rOuter * Math.cos(a0), y0 = cy + rOuter * Math.sin(a0);
            const x1 = cx + rInner * Math.cos(a0), y1 = cy + rInner * Math.sin(a0);
            const tx = cx + (rMid + 5) * Math.cos(am), ty = cy + (rMid + 5) * Math.sin(am);
            const px = cx + (rInner - 25) * Math.cos(am), py = cy + (rInner - 25) * Math.sin(am);
            const hasBodies = nakMap[i].length > 0;
            return (
              <g key={i}>
                <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#334155" strokeWidth="0.5"/>
                <text x={tx} y={ty} fontSize="8" fill="#94a3b8" textAnchor="middle" dominantBaseline="middle"
                      transform={`rotate(${(am*180/Math.PI)+90}, ${tx}, ${ty})`}>{NAK_SHORT[i]}</text>
                {hasBodies && (
                  <text x={px} y={py} fontSize="10" fill="#fbbf24" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">
                    {nakMap[i].map(n => n === 'Asc' ? 'As' : (SHORT[n] || n.slice(0,2))).join(' ')}
                  </text>
                )}
              </g>
            );
          })}
          <text x={cx} y={cy-8} fontSize="10" fill="#64748b" textAnchor="middle">Moon@birth</text>
          <text x={cx} y={cy+8} fontSize="12" fill="#fbbf24" textAnchor="middle" fontWeight="bold">{NAKSHATRA_NAMES[result.planets.find(p=>p.name==='Moon').nakshatra_index]}</text>
        </svg>
      </CardContent>
    </Card>
  );
}

// -- Sarvatobhadra: 9x9 mandala with 4 vowels (corners), 28 nakshatras (edges), 12 signs (center) --
// Nakshatra edge order (BV Raman canonical), Abhijit inserted between UAs (20) and Shravana (21).
// Perimeter: 7 nakshatras per side + 2 vowels per corner (shared with adjacent sides).
const SARVATOBHADRA_NAK_ORDER = [
  // Top: Krittika, Rohini, Mrigashira, Ardra, Punarvasu, Pushya, Ashlesha (indices 2..8) but arranged
  2, 3, 4, 5, 6, 7,          // top row (left to right)
  8, 9, 10, 11, 12, 13,      // right column (top to bottom)
  14, 15, 16, 17, 18, 19,    // bottom row (right to left, will reverse)
  20, 21, 22, 23, 24, 25,    // left column (bottom to top, will reverse)
  26, 0, 1,                  // remaining (Rev, Ashw, Bha) - flexible placement
];

function SarvatobhadraChakra({ result }) {
  // Simplified 9x9 grid representation
  // Row 0: vowel + 7 nakshatras + vowel
  // Rows 1-7: nakshatra + 7 cells (inner) + nakshatra
  // Row 8: vowel + 7 nakshatras + vowel
  const vowels = ['अ','इ','उ','ऋ']; // corners
  // Nakshatra edge positions (top L->R: 0..6, right T->B: 7..13, bottom R->L: 14..20, left B->T: 21..27)
  const topNaks =   [2, 3, 4, 5, 6, 7, 8];         // Krittika..Ashlesha
  const rightNaks = [9,10,11,12,13,14,15];         // Magha..Vishakha
  const bottomNaks = [16,17,18,19,20,21,22];       // Anuradha..Shravana (reversed rendering)
  const leftNaks =  [23,24,25,26,0,1,-1];          // Dhanishta..Bharani + Abhijit(-1) (rendered top->bottom on left)

  // Signs in center 3x3
  const centerSigns = [
    [ 5,  6,  7],   // Virgo, Libra, Scorpio (top of inner)
    [ 4, -1,  8],   // Leo, center, Sagittarius
    [ 3,  2,  1],   // Cancer, Gemini, Taurus (bottom of inner)
  ]; // approximate arrangement; center left empty

  // Build planet placements per nakshatra and per sign
  const planetByNak = Array.from({ length: 27 }, () => []);
  const planetBySign = Array.from({ length: 12 }, () => []);
  for (const p of result.planets) {
    planetByNak[p.nakshatra_index].push(p.name);
    planetBySign[p.sign_index].push(p.name);
  }

  const cellClass = (bodies) => bodies.length ? 'bg-saffron-500/10 border-saffron-500/30' : 'bg-slate-950/40 border-slate-800';

  const NakCell = ({ nakIdx, extra }) => {
    if (nakIdx == null || nakIdx < 0) return <div className="border border-slate-800 bg-slate-900/40 p-1 text-[8px] text-slate-600 text-center">Abhijit</div>;
    const bodies = planetByNak[nakIdx];
    return (
      <div className={`border p-1 text-[9px] text-center flex flex-col justify-center ${cellClass(bodies)}`}>
        <div className="text-slate-400">{NAK_SHORT[nakIdx]}</div>
        {bodies.length > 0 && <div className="text-saffron-300 font-semibold text-[9px]">{bodies.map(n => SHORT[n] || n.slice(0,2)).join(' ')}</div>}
      </div>
    );
  };
  const VowelCell = ({ v }) => <div className="border border-violet-500/30 bg-violet-500/10 p-1 text-center text-violet-300 font-semibold text-sm flex items-center justify-center">{v}</div>;
  const SignCell = ({ signIdx }) => {
    if (signIdx < 0) return <div className="border border-slate-700 bg-slate-800/40 p-1 text-center text-[9px] text-slate-500 flex items-center justify-center">Meru</div>;
    const bodies = planetBySign[signIdx];
    return (
      <div className={`border p-1 text-center text-[9px] flex flex-col justify-center ${cellClass(bodies)}`}>
        <div className="text-slate-400">{SIGN_ABBR[signIdx]}</div>
        {bodies.length > 0 && <div className="text-saffron-300 font-semibold text-[9px]">{bodies.map(n => SHORT[n] || n.slice(0,2)).join(' ')}</div>}
      </div>
    );
  };

  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-200 text-sm">Sarvatobhadra Chakra</CardTitle>
        <CardDescription className="text-[11px]">9×9 mandala: 4 vowels at corners, 27 nakshatras around edges (Abhijit interpolated), 12 signs in center. Used for muhurta and vedhi (transit blocking) analysis.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="grid grid-cols-9 gap-0.5 aspect-square max-w-2xl mx-auto text-slate-100 min-w-[320px]">
          {/* Row 0: vowel + 7 top naks + vowel */}
          <VowelCell v={vowels[0]}/>
          {topNaks.map((n,i) => <NakCell key={`t${i}`} nakIdx={n}/>)}
          <VowelCell v={vowels[1]}/>

          {/* Rows 1-7: left nak + 7 center cells + right nak */}
          {Array.from({ length: 7 }, (_, row) => {
            const cells = [];
            cells.push(<NakCell key={`l${row}`} nakIdx={leftNaks[row]}/>);
            for (let col = 0; col < 7; col++) {
              // Only middle 3x3 has signs (rows 2-4, cols 2-4)
              if (row >= 2 && row <= 4 && col >= 2 && col <= 4) {
                const si = centerSigns[row-2][col-2];
                cells.push(<SignCell key={`c${row}-${col}`} signIdx={si}/>);
              } else {
                cells.push(<div key={`e${row}-${col}`} className="border border-slate-800/40 bg-slate-900/20"/>);
              }
            }
            cells.push(<NakCell key={`r${row}`} nakIdx={rightNaks[row]}/>);
            return cells;
          })}

          {/* Row 8: vowel + 7 bottom naks + vowel */}
          <VowelCell v={vowels[3]}/>
          {[...bottomNaks].reverse().map((n,i) => <NakCell key={`b${i}`} nakIdx={n}/>)}
          <VowelCell v={vowels[2]}/>
        </div>
      </CardContent>
    </Card>
  );
}

// -- Kota Chakra: 4-fort nested layout, positions relative to janma nakshatra --
function KotaChakra({ result }) {
  const moonNak = result.planets.find(p => p.name === 'Moon').nakshatra_index;
  // Reorder nakshatras: [1..28] starting from janma (with Abhijit as 28th; here we omit Abhijit → 27)
  const kotaOrder = Array.from({ length: 27 }, (_, i) => (moonNak + i) % 27);
  // Standard Kota grouping:
  //  Stambha (center) = positions 1-4 (nakshatras 1-4 from janma)
  //  Madhya  = 5-11
  //  Prakara = 12-18
  //  Bahya   = 19-27
  const groups = {
    Stambha: kotaOrder.slice(0, 4),
    Madhya:  kotaOrder.slice(4, 11),
    Prakara: kotaOrder.slice(11, 18),
    Bahya:   kotaOrder.slice(18, 27),
  };
  const planetsAtNak = Array.from({ length: 27 }, () => []);
  for (const p of result.planets) planetsAtNak[p.nakshatra_index].push(p.name);

  const NakBox = ({ nakIdx }) => {
    const bodies = planetsAtNak[nakIdx];
    return (
      <div className={`border rounded px-2 py-1.5 text-center text-[10px] ${bodies.length ? 'bg-saffron-500/10 border-saffron-500/40' : 'bg-slate-950/50 border-slate-800'}`}>
        <div className="text-slate-400">{NAK_SHORT[nakIdx]}</div>
        {bodies.length > 0 && <div className="text-saffron-300 font-semibold">{bodies.map(n => SHORT[n] || n.slice(0,2)).join(' ')}</div>}
      </div>
    );
  };

  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-200 text-sm">Kota Chakra</CardTitle>
        <CardDescription className="text-[11px]">Fort diagram centered on Janma Nakshatra ({NAKSHATRA_NAMES[moonNak]}). Concentric zones: Stambha (pillar, innermost) → Madhya (middle) → Prakara (walls) → Bahya (outer field). Used to time attacks and defenses in warfare astrology, also for health crises.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 overflow-x-auto">
        {Object.entries(groups).map(([name, naks]) => (
          <div key={name}>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">{name} <span className="text-slate-600">· {naks.length} nakshatras</span></div>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${naks.length}, minmax(60px, 1fr))` }}>
              {naks.map(n => <NakBox key={n} nakIdx={n}/>)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// -- Soola Chakra: 27 nakshatras in 3×9 grid, starting from Jyeshtha (traditional) --
function SoolaChakra({ result }) {
  // Traditional Soola order: start from Jyeshtha (nak index 17)
  const startIdx = 17;
  const order = Array.from({ length: 27 }, (_, i) => (startIdx + i) % 27);
  const rows = [order.slice(0,9), order.slice(9,18), order.slice(18,27)];
  const planetsAtNak = Array.from({ length: 27 }, () => []);
  for (const p of result.planets) planetsAtNak[p.nakshatra_index].push(p.name);
  // "Fatal" columns per tradition: Soola positions are columns 1, 4, 7 (0-indexed 0,3,6)
  const soolaCols = [0, 3, 6];

  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-200 text-sm">Soola Chakra</CardTitle>
        <CardDescription className="text-[11px]">27 nakshatras in 3×9 grid starting from Jyeshtha. Rose-highlighted columns indicate Soola (trident) positions — critical for muhurta avoidance and vedha analysis.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-rows-3 gap-1.5 overflow-x-auto">
          {rows.map((row, r) => (
            <div key={r} className="grid grid-cols-9 gap-1.5 min-w-[500px]">
              {row.map((nakIdx, c) => {
                const bodies = planetsAtNak[nakIdx];
                const isSoola = soolaCols.includes(c);
                const bg = bodies.length ? 'bg-saffron-500/10 border-saffron-500/40' :
                           isSoola ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-950/50 border-slate-800';
                return (
                  <div key={c} className={`border rounded px-1.5 py-1 text-center text-[10px] ${bg}`}>
                    <div className="text-slate-400">{NAK_SHORT[nakIdx]}</div>
                    {bodies.length > 0 && <div className="text-saffron-300 font-semibold">{bodies.map(n => SHORT[n] || n.slice(0,2)).join(' ')}</div>}
                    {isSoola && bodies.length === 0 && <div className="text-rose-400 text-[8px]">soola</div>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// -- Tripataki: 3-flag arrangement of 27 nakshatras --
function TripatakiChakra({ result }) {
  // Three "flags" of 9 nakshatras each. Flag 1: nakshatras 1-9 from janma (per BV Raman).
  const moonNak = result.planets.find(p => p.name === 'Moon').nakshatra_index;
  const flags = [
    Array.from({ length: 9 }, (_, i) => (moonNak + i) % 27),                     // Flag 1
    Array.from({ length: 9 }, (_, i) => (moonNak + 9 + i) % 27),                 // Flag 2
    Array.from({ length: 9 }, (_, i) => (moonNak + 18 + i) % 27),                // Flag 3
  ];
  const flagLabels = ['1st Flag (Dhwaja) — Auspicious', '2nd Flag (Dhoomra) — Mixed', '3rd Flag (Shoola) — Inauspicious'];
  const planetsAtNak = Array.from({ length: 27 }, () => []);
  for (const p of result.planets) planetsAtNak[p.nakshatra_index].push(p.name);

  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-200 text-sm">Tripataki Chakra</CardTitle>
        <CardDescription className="text-[11px]">27 nakshatras arranged as 3 flags of 9 each, starting from Janma Nakshatra ({NAKSHATRA_NAMES[moonNak]}). Used for transit-based event timing.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 overflow-x-auto">
        {flags.map((flag, i) => (
          <div key={i}>
            <div className={`text-[10px] uppercase tracking-wider mb-1.5 ${i === 0 ? 'text-emerald-400' : i === 1 ? 'text-amber-400' : 'text-rose-400'}`}>
              {flagLabels[i]}
            </div>
            <div className="grid grid-cols-9 gap-1 min-w-[500px]">
              {flag.map(nakIdx => {
                const bodies = planetsAtNak[nakIdx];
                return (
                  <div key={nakIdx} className={`border rounded px-1.5 py-1 text-center text-[10px] ${bodies.length ? 'bg-saffron-500/10 border-saffron-500/40' : 'bg-slate-950/50 border-slate-800'}`}>
                    <div className="text-slate-400">{NAK_SHORT[nakIdx]}</div>
                    {bodies.length > 0 && <div className="text-saffron-300 font-semibold">{bodies.map(n => SHORT[n] || n.slice(0,2)).join(' ')}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

