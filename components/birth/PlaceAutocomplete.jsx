'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import { countryName, tzOffsetFor } from '@/lib/tz-offset';

/**
 * Place of query / birth: geolocation fills place + coordinates;
 * typing searches cities and fills lat/lon/tz on pick.
 */
export default function PlaceAutocomplete({
  place = '',
  latitude = '',
  longitude = '',
  tz_offset,
  tz_name = '',
  year,
  month,
  day,
  hour = 12,
  minute = 0,
  onChange,
  autoDetect = false,
  label = 'Place',
  className = '',
}) {
  const [query, setQuery] = useState(place || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState('');
  const [geoBusy, setGeoBusy] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const debounceRef = useRef(null);
  const boxRef = useRef(null);
  const detectedRef = useRef(false);
  const userEditedRef = useRef(false);

  useEffect(() => {
    if (!userEditedRef.current) setQuery(place || '');
  }, [place]);

  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const emit = (patch) => {
    onChange?.({
      place,
      latitude,
      longitude,
      tz_offset,
      tz_name,
      ...patch,
    });
  };

  const applyCity = (c, opts = {}) => {
    const labelText = [c.n, c.a, countryName(c.c)].filter(Boolean).join(', ');
    const la = opts.latitude != null ? opts.latitude : c.la;
    const lo = opts.longitude != null ? opts.longitude : c.lo;
    const off = tzOffsetFor(c.tz, year, month, day, hour, minute);
    setQuery(labelText);
    setOpen(false);
    setResults([]);
    emit({
      place: labelText,
      latitude: +Number(la).toFixed(6),
      longitude: +Number(lo).toFixed(6),
      tz_name: c.tz || tz_name,
      tz_offset: off != null ? +off.toFixed(2) : tz_offset,
    });
  };

  const fetchResults = (q) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetch(`/api/cities?q=${encodeURIComponent(q)}&limit=12`)
      .then((r) => r.json())
      .then((d) => {
        setResults(d.results || []);
        setHighlight(0);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  };

  const onType = (e) => {
    const v = e.target.value;
    userEditedRef.current = true;
    setQuery(v);
    emit({ place: v });
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(v), 180);
  };

  const detectLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus('Geolocation is not available in this browser.');
      return;
    }
    setGeoBusy(true);
    setGeoStatus('Detecting current location…');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const deviceTz = -(new Date().getTimezoneOffset()) / 60;
        try {
          const res = await fetch(
            `/api/cities/nearest?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
          );
          const data = await res.json();
          if (data.city) {
            userEditedRef.current = false;
            applyCity(data.city, { latitude: lat, longitude: lon });
            setGeoStatus(`Location detected near ${data.city.n}. Coordinates filled from GPS.`);
          } else {
            emit({
              latitude: +lat.toFixed(6),
              longitude: +lon.toFixed(6),
              tz_offset: +deviceTz.toFixed(2),
            });
            setGeoStatus('Location detected. Enter or search a city name if needed.');
          }
        } catch {
          emit({
            latitude: +lat.toFixed(6),
            longitude: +lon.toFixed(6),
            tz_offset: +deviceTz.toFixed(2),
          });
          setGeoStatus('Coordinates detected. City name lookup failed — type a city to autocomplete.');
        } finally {
          setGeoBusy(false);
        }
      },
      () => {
        setGeoBusy(false);
        setGeoStatus('Location access denied or unavailable. Search a city or enter coordinates.');
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 },
    );
  };

  useEffect(() => {
    if (!autoDetect || detectedRef.current) return;
    detectedRef.current = true;
    detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount when autoDetect
  }, [autoDetect]);

  const onKey = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      userEditedRef.current = false;
      applyCity(results[highlight]);
    } else if (e.key === 'Escape') setOpen(false);
  };

  const clear = () => {
    userEditedRef.current = true;
    setQuery('');
    setResults([]);
    setOpen(false);
    emit({ place: '' });
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <Label className="text-slate-400 text-xs">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs border-slate-600"
          onClick={detectLocation}
          disabled={geoBusy}
        >
          {geoBusy ? (
            <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Detecting…</>
          ) : (
            <><MapPin className="h-3 w-3 mr-1" />Detect location</>
          )}
        </Button>
      </div>
      <div className="relative" ref={boxRef}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          <Input
            value={query}
            onChange={onType}
            onFocus={() => query && results.length && setOpen(true)}
            onKeyDown={onKey}
            placeholder="Search city (e.g. Mumbai, Delhi, London)"
            className="pl-8 pr-8 bg-slate-950 border-slate-700"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={clear}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {open && (results.length > 0 || loading) && (
          <div className="absolute z-30 mt-1 w-full rounded-md border border-slate-700 bg-slate-900 shadow-xl shadow-black/40 max-h-72 overflow-y-auto">
            {loading && <div className="px-3 py-2 text-xs text-slate-500">Searching…</div>}
            {results.map((c, i) => (
              <button
                key={`${c.n}-${c.la}-${c.lo}`}
                type="button"
                onMouseEnter={() => setHighlight(i)}
                onClick={() => {
                  userEditedRef.current = false;
                  applyCity(c);
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 border-b border-slate-800/60 last:border-0 ${
                  i === highlight ? 'bg-slate-800/80' : 'hover:bg-slate-800/50'
                }`}
              >
                <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-slate-100 truncate">
                    {c.n}
                    <span className="text-slate-500 font-normal ml-1.5 text-xs">{countryName(c.c)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    {c.la.toFixed(3)}, {c.lo.toFixed(3)} · {c.tz}
                  </div>
                </div>
              </button>
            ))}
            {!loading && results.length === 0 && query.length >= 2 && (
              <div className="px-3 py-2 text-xs text-slate-500">No cities matched.</div>
            )}
          </div>
        )}
      </div>
      {geoStatus && <p className="text-[11px] text-slate-500 mt-1.5">{geoStatus}</p>}
    </div>
  );
}
