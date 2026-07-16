'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function SignBadge({ sign }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
      {sign}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const yy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function KarakaTable({ detail, title }) {
  if (!detail?.length) return null;
  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-200 text-sm">{title}</CardTitle>
        <CardDescription className="text-[11px]">
          Planets ranked by degree within sign (Rahu uses 30° − degree when included).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Karaka</TableHead>
              <TableHead className="text-slate-400">Full Name</TableHead>
              <TableHead className="text-slate-400">Planet</TableHead>
              <TableHead className="text-slate-400">D1 Sign</TableHead>
              <TableHead className="text-slate-400">Deg in Sign</TableHead>
              <TableHead className="text-slate-400">D9 Sign</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detail.map((k) => (
              <TableRow key={k.abbr} className={`border-slate-800 ${k.abbr === 'AK' ? 'bg-emerald-500/5' : ''}`}>
                <TableCell>
                  <Badge variant="outline" className="text-emerald-300 border-emerald-500/30 bg-emerald-500/10 font-semibold">
                    {k.abbr}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-300 text-sm">{k.full_name}</TableCell>
                <TableCell className="font-medium text-slate-100">{k.planet}</TableCell>
                <TableCell><SignBadge sign={k.sign} /></TableCell>
                <TableCell className="font-mono text-slate-400 text-xs">{k.deg_in_sign.toFixed(4)}°</TableCell>
                <TableCell><SignBadge sign={k.d9_sign} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CharaDashaPanel({ dasha }) {
  if (!dasha) return null;
  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/60 border-slate-800">
        <CardContent className="py-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">Start Sign</span>
            <span className="font-mono text-slate-200">{dasha.start_sign}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">Direction</span>
            <span className="font-mono text-slate-200 capitalize">{dasha.direction}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">Lagna Kendra</span>
            <span className="font-mono text-slate-200">{dasha.lagna_strength} planets</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">7th Kendra</span>
            <span className="font-mono text-slate-200">{dasha.seventh_strength} planets</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">Reason</span>
            <span className="text-slate-300 text-xs">{dasha.start_reason}</span>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashaTable title="Chara Mahadasha (MD)" rows={dasha.mds} />
        <DashaTable title="Chara Antardasha (AD) — Current MD" rows={dasha.ads} showMdSign />
      </div>
    </div>
  );
}

function DashaTable({ title, rows, showMdSign }) {
  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-200 text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {!rows?.length ? (
          <p className="px-4 pb-4 text-xs text-slate-500">No period active.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 text-xs">Sign</TableHead>
                <TableHead className="text-slate-400 text-xs">Type</TableHead>
                <TableHead className="text-slate-400 text-xs">Start</TableHead>
                <TableHead className="text-slate-400 text-xs">End</TableHead>
                <TableHead className="text-slate-400 text-xs text-right">Yrs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i} className={`border-slate-800 ${r.current ? 'bg-amber-500/10' : ''}`}>
                  <TableCell className="py-2">
                    <span className={`text-sm ${r.current ? 'text-amber-300 font-semibold' : 'text-slate-200'}`}>
                      {showMdSign ? `${r.md_sign} → ${r.sign}` : r.sign}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-400 text-xs">{r.modality || '—'}</TableCell>
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

export default function JaiminiPanel({ result }) {
  const j = result?.jaimini;
  if (!j) return <p className="text-slate-500 text-sm">Jaimini data not available.</p>;

  const { arudha_padas: ap, karakamsa, rashi_drishti, sthira_karakas } = j;

  return (
    <div className="space-y-4">
      {/* Karakamsa highlight */}
      {karakamsa && (
        <Card className="bg-emerald-950/30 border-emerald-800/40">
          <CardContent className="py-4 flex flex-wrap gap-x-8 gap-y-2">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-emerald-500/70 mb-1">Karakamsa (Swamsa)</p>
              <p className="text-lg font-semibold text-emerald-200">{karakamsa.sign}</p>
              <p className="text-xs text-emerald-400/70 mt-0.5">
                Atmakaraka: {karakamsa.atmakaraka} · D9 sign of AK
              </p>
            </div>
            {ap?.arudha_lagna && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-violet-400/70 mb-1">Arudha Lagna (AL)</p>
                <p className="text-lg font-semibold text-violet-200">{ap.arudha_lagna.sign}</p>
                <p className="text-xs text-violet-400/70 mt-0.5">
                  Lagna lord {ap.arudha_lagna.lagna_lord} in {ap.arudha_lagna.lord_in_sign}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="karakas">
        <TabsList className="bg-slate-900/60 border border-slate-800 flex-wrap">
          <TabsTrigger value="karakas">Chara Karakas</TabsTrigger>
          <TabsTrigger value="arudha">Arudha Padas</TabsTrigger>
          <TabsTrigger value="drishti">Rashi Drishti</TabsTrigger>
          <TabsTrigger value="dasha">Chara Dasha</TabsTrigger>
          <TabsTrigger value="sthira">Sthira Karakas</TabsTrigger>
        </TabsList>

        <TabsContent value="karakas" className="mt-3 space-y-4">
          <KarakaTable detail={j.karakas_7_detail} title="7-Planet Chara Karakas (Parashari)" />
          <KarakaTable detail={j.karakas_8_detail} title="8-Planet Chara Karakas (incl. Rahu as PiK)" />
        </TabsContent>

        <TabsContent value="arudha" className="mt-3">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm">Bhava Padas (Arudha System)</CardTitle>
              <CardDescription className="text-[11px]">
                Count from house sign to its lord&apos;s sign, then same count from lord&apos;s sign.
                Exception: if pada falls in same sign or 7th, advance 10 signs.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Pada</TableHead>
                    <TableHead className="text-slate-400">House</TableHead>
                    <TableHead className="text-slate-400">Base Sign</TableHead>
                    <TableHead className="text-slate-400">Sign Lord</TableHead>
                    <TableHead className="text-slate-400">Lord In</TableHead>
                    <TableHead className="text-slate-400">Pada Sign</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ap?.bhava_padas?.map((p) => (
                    <TableRow key={p.house} className={`border-slate-800 ${p.house === 12 ? 'bg-violet-500/5' : p.house === 1 ? 'bg-emerald-500/5' : ''}`}>
                      <TableCell className="font-medium text-slate-200 text-sm">{p.name}</TableCell>
                      <TableCell className="font-mono text-slate-400">{p.house}</TableCell>
                      <TableCell><SignBadge sign={p.base_sign} /></TableCell>
                      <TableCell className="text-slate-300">{p.sign_lord}</TableCell>
                      <TableCell><SignBadge sign={p.lord_in_sign} /></TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                          {p.pada_sign}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drishti" className="mt-3">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm">Jaimini Rashi Drishti</CardTitle>
              <CardDescription className="text-[11px]">
                Chara (movable) → 5th, 8th, 11th signs · Sthira (fixed) → 4th, 7th, 10th · Dvisvabhava (dual) → other dual signs.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Sign</TableHead>
                    <TableHead className="text-slate-400">Modality</TableHead>
                    <TableHead className="text-slate-400">Aspects</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rashi_drishti?.map((r) => (
                    <TableRow key={r.sign_index} className="border-slate-800">
                      <TableCell><SignBadge sign={r.sign} /></TableCell>
                      <TableCell className="text-slate-400 text-xs">{r.modality}</TableCell>
                      <TableCell className="space-x-1">
                        {r.aspects.map((a) => (
                          <SignBadge key={a} sign={a} />
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dasha" className="mt-3">
          <CharaDashaPanel dasha={j.chara_dasha} />
        </TabsContent>

        <TabsContent value="sthira" className="mt-3">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm">Sthira (Fixed) Karakas</CardTitle>
              <CardDescription className="text-[11px]">
                Fixed significators independent of degree — complementary to Chara Karakas.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Planet</TableHead>
                    <TableHead className="text-slate-400">Role</TableHead>
                    <TableHead className="text-slate-400">Signification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(sthira_karakas || {}).map(([planet, info]) => (
                    <TableRow key={planet} className="border-slate-800">
                      <TableCell className="font-medium text-slate-100">{planet}</TableCell>
                      <TableCell className="text-amber-300 font-medium">{info.role}</TableCell>
                      <TableCell className="text-slate-400 text-sm">{info.meaning}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
