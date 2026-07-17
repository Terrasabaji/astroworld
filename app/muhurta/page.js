'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, ChevronDown, ChevronUp, Calendar, MapPin, Sparkles, Printer } from 'lucide-react';
import AstroWorldLogo from '@/components/layout/AstroWorldLogo';
import { APP_NAME } from '@/lib/branding';
import { useBirthSession } from '@/components/birth/BirthSessionProvider';
import { printMuhurtaReport } from '@/lib/muhurta-print';

function fmtLocal(dt) {
  if (!dt) return '';
  return dt.replace('T', ' ').slice(0, 16);
}

function gradeColor(grade) {
  if (grade === 'Excellent') return 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10';
  if (grade === 'Good') return 'border-sky-500/40 text-sky-300 bg-sky-500/10';
  if (grade === 'Suitable') return 'border-amber-500/40 text-amber-300 bg-amber-500/10';
  return 'border-slate-500/40 text-slate-400 bg-slate-500/10';
}

function MuhurtaCard({ m, index }) {
  const [open, setOpen] = useState(index < 3);
  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-slate-100 text-base font-medium">
              {fmtLocal(m.local_time)}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {m.panchanga.weekday} · {m.panchanga.tithi.tithi_name} ({m.panchanga.tithi.paksha}) · {m.panchanga.nakshatra} · Lagna {m.panchanga.lagna}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={gradeColor(m.grade)}>{m.score}% · {m.grade}</Badge>
            {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </div>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <Meta label="Yoga" value={m.panchanga.yoga} />
            <Meta label="Karana" value={m.panchanga.karana} />
            <Meta label="Choghadiya" value={m.panchanga.choghadiya} />
            <Meta label="Hora" value={m.panchanga.hora} />
            <Meta label="Lagna Lord" value={m.panchanga.lagna_lord} />
            <Meta label="Nakshatra Lord" value={m.panchanga.nakshatra_lord} />
            <Meta label="Abhijit" value={m.panchanga.in_abhijit ? 'Yes' : 'No'} />
            <Meta label="Sunrise" value={fmtLocal(m.panchanga.sunrise)} />
          </div>

          {m.strengths?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-emerald-500/80 mb-1.5">Favorable factors</p>
              <ul className="space-y-1">
                {m.strengths.map((s, i) => (
                  <li key={i} className="text-slate-300 text-xs flex gap-2">
                    <span className="text-emerald-400">+</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {m.dosha_details?.length > 0 ? (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-rose-400/80 mb-1.5">Doshas &amp; remedies</p>
              <div className="space-y-2">
                {m.dosha_details.map((d, i) => (
                  <div key={i} className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                    <p className="text-rose-300 font-medium text-xs">{d.dosha}</p>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{d.remedy}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-emerald-400/90">No significant doshas — highly favorable slot.</p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function Meta({ label, value }) {
  return (
    <div className="rounded-md bg-slate-950/50 border border-slate-800 px-2 py-1.5">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="text-slate-300 truncate">{value}</div>
    </div>
  );
}

export default function MuhurtaPage() {
  const { birth, hydrated } = useBirthSession();
  const [catalog, setCatalog] = useState([]);
  const [eventId, setEventId] = useState('vivaha');
  const [eventFilter, setEventFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCat, setLoadingCat] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('06:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('20:00');
  const [place, setPlace] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [tzOffset, setTzOffset] = useState('5.5');
  const [useTarabalam, setUseTarabalam] = useState(false);
  const [stepMinutes, setStepMinutes] = useState('15');
  const [minScore, setMinScore] = useState('55');

  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [cityOpen, setCityOpen] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetch('/api/muhurta/events')
      .then((r) => r.json())
      .then((d) => {
        setCatalog(d.categories || []);
        setLoadingCat(false);
      })
      .catch(() => setLoadingCat(false));
  }, []);

  useEffect(() => {
    if (!hydrated || !birth) return;
    if (birth.place) setPlace(birth.place);
    if (birth.latitude) setLatitude(String(birth.latitude));
    if (birth.longitude) setLongitude(String(birth.longitude));
    if (birth.tz_offset != null) setTzOffset(String(birth.tz_offset));
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 30);
    const fmt = (d) => d.toISOString().slice(0, 10);
    setStartDate(fmt(today));
    setEndDate(fmt(end));
  }, [hydrated, birth]);

  const flatEvents = useMemo(() => {
    const all = [];
    for (const cat of catalog) {
      for (const e of cat.events || []) all.push({ ...e, category: cat.name });
    }
    return all;
  }, [catalog]);

  const filteredEvents = useMemo(() => {
    const q = eventFilter.trim().toLowerCase();
    if (!q) return flatEvents;
    return flatEvents.filter((e) =>
      e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.id.includes(q)
    );
  }, [flatEvents, eventFilter]);

  const searchCities = (q) => {
    setCityQuery(q);
    setPlace(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 2) { setCityResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cities?q=${encodeURIComponent(q)}&limit=8`);
        const data = await res.json();
        setCityResults(data.results || []);
        setCityOpen(true);
      } catch { setCityResults([]); }
    }, 250);
  };

  const pickCity = (c) => {
    const label = [c.n, c.a, c.c].filter(Boolean).join(', ');
    setCityQuery(label);
    setPlace(label);
    setLatitude(String(c.la));
    setLongitude(String(c.lo));
    if (c.tz) setTzOffset(String(c.tz));
    setCityOpen(false);
  };

  const runSearch = async () => {
    setError('');
    setResult(null);
    if (!eventId || !startDate || !endDate || !latitude || !longitude) {
      setError('Select an event, date range, and place with coordinates.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        event_id: eventId,
        start: `${startDate}T${startTime}:00`,
        end: `${endDate}T${endTime}:00`,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        tz_offset: parseFloat(tzOffset),
        place,
        step_minutes: parseInt(stepMinutes, 10),
        min_score: parseInt(minScore, 10),
        max_results: 50,
      };
      if (useTarabalam && birth) {
        try {
          const calcRes = await fetch('/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              year: birth.year, month: birth.month, day: birth.day,
              hour: birth.hour, minute: birth.minute, second: birth.second || 0,
              latitude: birth.latitude, longitude: birth.longitude,
              tz_offset: birth.tz_offset, tz_name: birth.tz_name,
              ayanamsa: birth.ayanamsa || 'lahiri',
            }),
          });
          const chart = await calcRes.json();
          const moon = chart.planets?.find((p) => p.name === 'Moon');
          if (moon?.nakshatra_index != null) {
            payload.native_nakshatra_index = moon.nakshatra_index;
          }
        } catch { /* tarabalam optional */ }
      }
      const res = await fetch('/api/muhurta/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const totalEvents = flatEvents.length;

  return (
    <div className="container py-6 space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <AstroWorldLogo size={36} showName={false} className="mt-1" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-amber-500/80 font-medium">{APP_NAME}</p>
            <h1 className="text-2xl font-bold text-slate-100">Muhurta Finder</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Kala-style electional astrology — scan a date/time range at any place for auspicious muhurtas.
              Panchanga (tithi, nakshatra, yoga, karana), Choghadiya, Hora, Rahu/Yama/Gulika Kaal, Abhijit,
              Tarabalam, Chandrabala, Panchaka — with dosha analysis and classical remedies.
            </p>
            {!loadingCat && (
              <p className="text-xs text-slate-500 mt-1">{totalEvents} predefined events across {catalog.length} categories</p>
            )}
          </div>
        </div>
        {result && (
          <Button
            type="button"
            variant="outline"
            className="border-slate-600 text-slate-200 hover:bg-slate-800 print:hidden"
            onClick={() => printMuhurtaReport(result)}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        )}
      </div>

      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-200 text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-400" /> Search parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Event ({totalEvents || '…'} choices)</Label>
              <Input
                placeholder="Filter events…"
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="bg-slate-950 border-slate-700 mb-1"
              />
              <Select value={eventId} onValueChange={setEventId}>
                <SelectTrigger className="bg-slate-950 border-slate-700">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {catalog.map((cat) => (
                    <SelectGroup key={cat.name}>
                      <SelectLabel className="text-amber-500/80">{cat.name} ({cat.count})</SelectLabel>
                      {(eventFilter ? filteredEvents.filter((e) => e.category === cat.name) : cat.events).map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 relative">
              <Label className="text-slate-400 text-xs flex items-center gap-1"><MapPin className="h-3 w-3" /> Place</Label>
              <Input
                value={cityQuery || place}
                onChange={(e) => searchCities(e.target.value)}
                onFocus={() => cityResults.length && setCityOpen(true)}
                placeholder="Search city…"
                className="bg-slate-950 border-slate-700"
              />
              {cityOpen && cityResults.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full rounded-md border border-slate-700 bg-slate-900 shadow-xl max-h-48 overflow-auto">
                  {cityResults.map((c, i) => (
                    <button key={i} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-slate-800 text-slate-300"
                      onClick={() => pickCity(c)}>
                      {c.n}{c.a ? `, ${c.a}` : ''} ({c.c})
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" step="0.000001" placeholder="Lat" value={latitude} onChange={(e) => setLatitude(e.target.value)} className="bg-slate-950 border-slate-700 text-xs" />
                <Input type="number" step="0.000001" placeholder="Lon" value={longitude} onChange={(e) => setLongitude(e.target.value)} className="bg-slate-950 border-slate-700 text-xs" />
                <Input type="number" step="0.25" placeholder="TZ" value={tzOffset} onChange={(e) => setTzOffset(e.target.value)} className="bg-slate-950 border-slate-700 text-xs" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-slate-400 text-xs">From date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-950 border-slate-700 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">From time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-slate-950 border-slate-700 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">To date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-slate-950 border-slate-700 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs">To time</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="bg-slate-950 border-slate-700 mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <div>
              <Label className="text-slate-400 text-xs">Scan interval (min)</Label>
              <Select value={stepMinutes} onValueChange={setStepMinutes}>
                <SelectTrigger className="bg-slate-950 border-slate-700 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['5', '10', '15', '30', '60'].map((v) => <SelectItem key={v} value={v}>{v} min</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-400 text-xs">Minimum score</Label>
              <Select value={minScore} onValueChange={setMinScore}>
                <SelectTrigger className="bg-slate-950 border-slate-700 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['40', '55', '70', '85'].map((v) => <SelectItem key={v} value={v}>{v}%</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex items-center gap-2 pt-4">
              <input type="checkbox" id="tarabalam" checked={useTarabalam} onChange={(e) => setUseTarabalam(e.target.checked)} className="rounded" />
              <Label htmlFor="tarabalam" className="text-slate-400 text-xs cursor-pointer">
                Apply Tarabalam from active birth Moon nakshatra
              </Label>
            </div>
          </div>

          {error && <p className="text-rose-400 text-sm">{error}</p>}

          <Button onClick={runSearch} disabled={loading || loadingCat} className="bg-amber-600 hover:bg-amber-500 w-full md:w-auto">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            Find Suitable Muhurtas
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card className="bg-slate-900/40 border-slate-800">
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Event: </span>
                  <span className="text-slate-200 font-medium">{result.event?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500">Scanned: </span>
                  <span className="text-slate-300">{result.search?.slots_scanned} slots</span>
                </div>
                <div>
                  <span className="text-slate-500">Found: </span>
                  <span className="text-emerald-400 font-medium">{result.summary?.total_found}</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">Excellent: {result.summary?.excellent}</Badge>
                  <Badge variant="outline" className="border-sky-500/30 text-sky-300">Good: {result.summary?.good}</Badge>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-300">Suitable: {result.summary?.suitable}</Badge>
                </div>
              </div>
              {result.event?.notes && (
                <p className="text-xs text-slate-500 mt-2 flex gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500/70" />
                  {result.event.notes}
                </p>
              )}
            </CardContent>
          </Card>

          {result.muhurtas?.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No muhurtas met the minimum score in this range. Try widening dates or lowering the minimum score.</p>
          ) : (
            <div className="space-y-3">
              {result.muhurtas.map((m, i) => (
                <MuhurtaCard key={m.local_time + i} m={m} index={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
