/** Shared helper to call the Astro World core calculation engine */
import { authHeaders } from '@/lib/api-client';

export async function calculateChart(birthPayload, options = {}) {
  const payload = {
    year: birthPayload.year,
    month: birthPayload.month,
    day: birthPayload.day,
    hour: birthPayload.hour,
    minute: birthPayload.minute,
    second: birthPayload.second || 0,
    latitude: birthPayload.latitude,
    longitude: birthPayload.longitude,
    tz_offset: birthPayload.tz_offset,
    tz_name: birthPayload.tz_name,
    place: birthPayload.place,
    ayanamsa: options.ayanamsa || birthPayload.ayanamsa || 'lahiri',
    house_system: options.house_system || birthPayload.house_system || 'P',
    transit: options.transit,
  };
  const res = await fetch('/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function loadSavedBirth(id) {
  const res = await fetch(`/api/births/${id}`, { headers: authHeaders() });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function listSavedBirths() {
  const res = await fetch('/api/births', { headers: authHeaders() });
  const data = await res.json();
  return data.births || [];
}
