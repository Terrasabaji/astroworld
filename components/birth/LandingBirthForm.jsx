'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, X } from 'lucide-react';
import {
  DEFAULT_BIRTH,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  normalizeGender,
  normalizeMaritalStatus,
} from '@/lib/birth-session';

function countryName(code) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

function pad2(n) {
  return String(n ?? 0).padStart(2, '0');
}

export function formatBirthDate(form) {
  if (!form?.year && form?.year !== 0) return '';
  return `${pad2(form.day)}/${pad2(form.month)}/${form.year}`;
}

export function formatBirthTime(form) {
  return `${pad2(form?.hour)}:${pad2(form?.minute)}:${pad2(form?.second)}`;
}

export function parseBirthDate(value) {
  const m = String(value || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { day, month, year };
}

export function parseBirthTime(value) {
  const m = String(value || '').trim().match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  const second = Number(m[3] ?? 0);
  if (hour > 23 || minute > 59 || second > 59) return null;
  return { hour, minute, second };
}

function tzOffsetFor(tzName, y, mo, d, hh, mm) {
  try {
    const utcMs = Date.UTC(y, mo - 1, d, hh, mm, 0);
    const dt = new Date(utcMs);
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tzName,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const parts = fmt.formatToParts(dt).reduce((a, p) => ((a[p.type] = p.value), a), {});
    const asLocalMs = Date.UTC(
      +parts.year,
      +parts.month - 1,
      +parts.day,
      +parts.hour % 24,
      +parts.minute,
      +parts.second,
    );
    return (asLocalMs - utcMs) / 3600000;
  } catch {
    return null;
  }
}

const fieldClass =
  'bg-slate-950/70 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-saffron/40';

export default function LandingBirthForm({
  form,
  onChange,
  onSave,
  onCancel,
  onRun,
  loading = false,
  saving = false,
  message = null,
  error = null,
}) {
  const [dateText, setDateText] = useState(() => formatBirthDate(form));
  const [timeText, setTimeText] = useState(() => formatBirthTime(form));
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [cityQuery, setCityQuery] = useState(form?.place || '');
  const [cityResults, setCityResults] = useState([]);
  const [cityOpen, setCityOpen] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const debounceRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    setDateText(formatBirthDate(form));
    setTimeText(formatBirthTime(form));
    setCityQuery(form?.place || '');
  }, [form?.year, form?.month, form?.day, form?.hour, form?.minute, form?.second, form?.place]);

  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setCityOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const update = (patch) => onChange?.({ ...form, ...patch });

  const applyDate = (value) => {
    setDateText(value);
    const parsed = parseBirthDate(value);
    if (!parsed) {
      setDateError(value.trim() ? 'Use DD/MM/YYYY' : '');
      return;
    }
    setDateError('');
    update(parsed);
  };

  const applyTime = (value) => {
    setTimeText(value);
    const parsed = parseBirthTime(value);
    if (!parsed) {
      setTimeError(value.trim() ? 'Use HH:MM:SS' : '');
      return;
    }
    setTimeError('');
    update(parsed);
  };

  const fetchCities = (q) => {
    if (!q || q.trim().length < 2) {
      setCityResults([]);
      return;
    }
    setCityLoading(true);
    fetch(`/api/cities?q=${encodeURIComponent(q)}&limit=12`)
      .then((r) => r.json())
      .then((d) => {
        setCityResults(d.results || []);
        setHighlight(0);
      })
      .catch(() => setCityResults([]))
      .finally(() => setCityLoading(false));
  };

  const onCityChange = (e) => {
    const v = e.target.value;
    setCityQuery(v);
    update({ place: v });
    setCityOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCities(v), 180);
  };

  const pickCity = (c) => {
    const label = `${c.n}, ${c.c}`;
    const off = tzOffsetFor(
      c.tz,
      +form.year,
      +form.month,
      +form.day,
      +form.hour,
      +form.minute,
    );
    setCityQuery(label);
    setCityOpen(false);
    update({
      place: label,
      latitude: c.la,
      longitude: c.lo,
      tz_name: c.tz,
      tz_offset: off !== null ? +off.toFixed(2) : form.tz_offset,
    });
  };

  const clearCity = () => {
    setCityQuery('');
    setCityResults([]);
    setCityOpen(false);
    update({ place: '', latitude: '', longitude: '', tz_name: '' });
  };

  const handleCityKey = (e) => {
    if (!cityOpen || cityResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, cityResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pickCity(cityResults[highlight]);
    } else if (e.key === 'Escape') {
      setCityOpen(false);
    }
  };

  const handleCancel = () => {
    setDateError('');
    setTimeError('');
    onCancel?.(DEFAULT_BIRTH);
  };

  const handleRun = () => {
    if (!parseBirthDate(dateText)) {
      setDateError('Use DD/MM/YYYY');
      return;
    }
    if (!parseBirthTime(timeText)) {
      setTimeError('Use HH:MM:SS');
      return;
    }
    onRun?.();
  };

  return (
    <section className="w-full max-w-5xl mx-auto">
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-slate-300">Name</Label>
            <Input
              value={form.name || ''}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Enter name"
              className={`mt-1.5 ${fieldClass}`}
            />
          </div>
          <div>
            <Label className="text-slate-300">Gender</Label>
            <Select
              value={normalizeGender(form.gender)}
              onValueChange={(gender) => update({ gender })}
            >
              <SelectTrigger className={`mt-1.5 ${fieldClass}`}>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-300">Marital status</Label>
            <Select
              value={normalizeMaritalStatus(form.marital_status)}
              onValueChange={(marital_status) => update({ marital_status })}
            >
              <SelectTrigger className={`mt-1.5 ${fieldClass}`}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {MARITAL_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-slate-300">Birth date (DD/MM/YYYY)</Label>
            <Input
              value={dateText}
              onChange={(e) => applyDate(e.target.value)}
              placeholder="DD/MM/YYYY"
              inputMode="numeric"
              className={`mt-1.5 font-mono ${fieldClass}`}
            />
            {dateError && <p className="text-xs text-red-400 mt-1">{dateError}</p>}
          </div>
          <div>
            <Label className="text-slate-300">Birth time (HH:MM:SS)</Label>
            <Input
              value={timeText}
              onChange={(e) => applyTime(e.target.value)}
              placeholder="HH:MM:SS"
              inputMode="numeric"
              className={`mt-1.5 font-mono ${fieldClass}`}
            />
            {timeError && <p className="text-xs text-red-400 mt-1">{timeError}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-1 relative" ref={boxRef}>
            <Label className="text-slate-300">Birth place</Label>
            <div className="relative mt-1.5">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              <Input
                value={cityQuery}
                onChange={onCityChange}
                onFocus={() => cityQuery && setCityOpen(true)}
                onKeyDown={handleCityKey}
                placeholder="Search city"
                className={`pl-8 pr-8 ${fieldClass}`}
                autoComplete="off"
              />
              {cityQuery && (
                <button
                  type="button"
                  onClick={clearCity}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded text-slate-500 hover:text-slate-300"
                  aria-label="Clear birth place"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {cityOpen && (cityResults.length > 0 || cityLoading) && (
              <div className="absolute z-30 mt-1 w-full min-w-[16rem] rounded-md border border-slate-700 bg-slate-900 shadow-xl max-h-72 overflow-y-auto">
                {cityLoading && <div className="px-3 py-2 text-xs text-slate-500">Searching…</div>}
                {cityResults.map((c, i) => (
                  <button
                    key={`${c.n}-${c.la}-${c.lo}`}
                    type="button"
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => pickCity(c)}
                    className={`w-full text-left px-3 py-2 border-b border-slate-800/60 last:border-0 ${
                      i === highlight ? 'bg-slate-800/80' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="text-sm text-slate-100 truncate">
                      {c.n}
                      <span className="text-slate-500 ml-1.5 text-xs">{countryName(c.c)}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      {c.la.toFixed(3)}, {c.lo.toFixed(3)} · {c.tz}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label className="text-slate-300">Latitude</Label>
            <Input
              type="number"
              step="0.000001"
              value={form.latitude ?? ''}
              onChange={(e) => update({ latitude: e.target.value === '' ? '' : Number(e.target.value) })}
              placeholder="Latitude"
              className={`mt-1.5 font-mono ${fieldClass}`}
            />
          </div>
          <div>
            <Label className="text-slate-300">Longitude</Label>
            <Input
              type="number"
              step="0.000001"
              value={form.longitude ?? ''}
              onChange={(e) => update({ longitude: e.target.value === '' ? '' : Number(e.target.value) })}
              placeholder="Longitude"
              className={`mt-1.5 font-mono ${fieldClass}`}
            />
          </div>
          <div>
            <Label className="text-slate-300">Time zone offset</Label>
            <Input
              type="number"
              step="0.25"
              value={form.tz_offset ?? ''}
              onChange={(e) => update({ tz_offset: e.target.value === '' ? '' : Number(e.target.value) })}
              placeholder="e.g. 5.5"
              className={`mt-1.5 font-mono ${fieldClass}`}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            onClick={onSave}
            disabled={loading || saving}
            variant="outline"
            className="min-w-[8rem] border-slate-600 text-slate-100 hover:bg-slate-800"
          >
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : 'Save'}
          </Button>
          <Button
            type="button"
            onClick={handleCancel}
            disabled={loading || saving}
            variant="outline"
            className="min-w-[8rem] border-slate-600 text-slate-100 hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleRun}
            disabled={loading || saving}
            className="min-w-[8rem] bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-slate-950 font-semibold"
          >
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Running…</> : 'Run'}
          </Button>
        </div>

        {(message || error) && (
          <p className={`text-sm text-center ${error ? 'text-red-400' : 'text-emerald-400'}`}>
            {error || message}
          </p>
        )}
      </div>
    </section>
  );
}
