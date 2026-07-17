'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GENDER_OPTIONS, birthFields, normalizeGender } from '@/lib/birth-session';

function countryName(code) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code;
  } catch { return code; }
}

const DEFAULT = {
  name: '', gender: 'male', place: '',
  year: 1990, month: 1, day: 1,
  hour: 12, minute: 0, second: 0,
  latitude: '', longitude: '',
  tz_offset: 5.5, tz_name: '',
  ayanamsa: 'lahiri', house_system: 'P',
};

export default function BirthForm({ value, onChange, prefix = '', showName = true, showGender = false, compact = false }) {
  const [form, setForm] = useState({ ...DEFAULT, ...value });
  const [cityQuery, setCityQuery] = useState(value?.place || '');
  const [cityResults, setCityResults] = useState([]);
  const [cityOpen, setCityOpen] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (value) setForm((f) => ({ ...f, ...value }));
  }, [value]);

  const update = (patch) => {
    const next = { ...form, ...patch };
    setForm(next);
    onChange?.(next);
  };

  const searchCities = (q) => {
    setCityQuery(q);
    update({ place: q });
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
    const label = [c.n, c.a, countryName(c.c)].filter(Boolean).join(', ');
    setCityQuery(label);
    setCityOpen(false);
    update({
      place: label,
      latitude: c.la,
      longitude: c.lo,
      tz_name: c.tz || form.tz_name,
    });
  };

  const id = (f) => `${prefix}${f}`;

  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
      {showName && (
        <div className={showGender ? '' : 'col-span-2'}>
          <Label htmlFor={id('name')} className="text-slate-400 text-xs">Name</Label>
          <Input id={id('name')} value={form.name} onChange={(e) => update({ name: e.target.value })}
            className="bg-slate-900 border-slate-700" />
        </div>
      )}
      {showGender && (
        <div>
          <Label className="text-slate-400 text-xs">Gender</Label>
          <Select value={normalizeGender(form.gender)} onValueChange={(gender) => update({ gender })}>
            <SelectTrigger className="bg-slate-900 border-slate-700 mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((g) => (
                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="col-span-2 relative">
        <Label className="text-slate-400 text-xs">Place</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
          <Input value={cityQuery} onChange={(e) => searchCities(e.target.value)}
            onFocus={() => cityResults.length && setCityOpen(true)}
            className="bg-slate-900 border-slate-700 pl-8" placeholder="Search city..." />
          {cityOpen && cityResults.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-slate-900 border border-slate-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {cityResults.map((c, i) => (
                <button key={i} type="button" onClick={() => pickCity(c)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-800 text-slate-200">
                  {[c.n, c.a, countryName(c.c)].filter(Boolean).join(', ')}
                  <span className="text-slate-500 ml-1 text-xs">({c.la.toFixed(2)}, {c.lo.toFixed(2)})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor={id('year')} className="text-slate-400 text-xs">Year</Label>
        <Input id={id('year')} type="number" value={form.year} onChange={(e) => update({ year: +e.target.value })}
          className="bg-slate-900 border-slate-700" />
      </div>
      <div>
        <Label htmlFor={id('month')} className="text-slate-400 text-xs">Month</Label>
        <Input id={id('month')} type="number" min={1} max={12} value={form.month}
          onChange={(e) => update({ month: +e.target.value })} className="bg-slate-900 border-slate-700" />
      </div>
      <div>
        <Label htmlFor={id('day')} className="text-slate-400 text-xs">Day</Label>
        <Input id={id('day')} type="number" min={1} max={31} value={form.day}
          onChange={(e) => update({ day: +e.target.value })} className="bg-slate-900 border-slate-700" />
      </div>
      <div>
        <Label htmlFor={id('hour')} className="text-slate-400 text-xs">Hour</Label>
        <Input id={id('hour')} type="number" min={0} max={23} value={form.hour}
          onChange={(e) => update({ hour: +e.target.value })} className="bg-slate-900 border-slate-700" />
      </div>
      <div>
        <Label htmlFor={id('minute')} className="text-slate-400 text-xs">Minute</Label>
        <Input id={id('minute')} type="number" min={0} max={59} value={form.minute}
          onChange={(e) => update({ minute: +e.target.value })} className="bg-slate-900 border-slate-700" />
      </div>
      <div>
        <Label htmlFor={id('lat')} className="text-slate-400 text-xs">Latitude</Label>
        <Input id={id('lat')} type="number" step="any" value={form.latitude}
          onChange={(e) => update({ latitude: parseFloat(e.target.value) })} className="bg-slate-900 border-slate-700" />
      </div>
      <div>
        <Label htmlFor={id('lon')} className="text-slate-400 text-xs">Longitude</Label>
        <Input id={id('lon')} type="number" step="any" value={form.longitude}
          onChange={(e) => update({ longitude: parseFloat(e.target.value) })} className="bg-slate-900 border-slate-700" />
      </div>
      <div>
        <Label htmlFor={id('tz')} className="text-slate-400 text-xs">TZ Offset (hrs)</Label>
        <Input id={id('tz')} type="number" step="any" value={form.tz_offset}
          onChange={(e) => update({ tz_offset: parseFloat(e.target.value) })} className="bg-slate-900 border-slate-700" />
      </div>
    </div>
  );
}

export function birthFormToPayload(form) {
  const b = birthFields(form);
  return {
    name: b.name,
    gender: b.gender,
    place: b.place,
    year: b.year, month: b.month, day: b.day,
    hour: b.hour, minute: b.minute, second: b.second,
    latitude: b.latitude,
    longitude: b.longitude,
    tz_offset: b.tz_offset,
    tz_name: b.tz_name || undefined,
    ayanamsa: b.ayanamsa,
    house_system: b.house_system,
  };
}
