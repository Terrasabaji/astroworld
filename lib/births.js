import { normalizeGender } from '@/lib/birth-session';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const BIRTHS_DIR = path.join(process.cwd(), 'data', 'births');

async function ensureDir() {
  await fs.mkdir(BIRTHS_DIR, { recursive: true });
}

function birthPath(id) {
  const safe = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safe) throw new Error('Invalid birth id');
  const resolved = path.resolve(BIRTHS_DIR, `${safe}.json`);
  if (!resolved.startsWith(path.resolve(BIRTHS_DIR))) {
    throw new Error('Invalid birth id');
  }
  return resolved;
}

function normalizeBirth(payload) {
  const now = new Date().toISOString();
  return {
    id: payload.id || randomUUID(),
    name: String(payload.name || 'Unnamed').slice(0, 120),
    gender: normalizeGender(payload.gender),
    place: payload.place ? String(payload.place).slice(0, 200) : '',
    year: parseInt(payload.year, 10),
    month: parseInt(payload.month, 10),
    day: parseInt(payload.day, 10),
    hour: parseInt(payload.hour, 10),
    minute: parseInt(payload.minute, 10),
    second: parseInt(payload.second || 0, 10),
    latitude: parseFloat(payload.latitude),
    longitude: parseFloat(payload.longitude),
    tz_offset: payload.tz_offset !== undefined && payload.tz_offset !== '' ? parseFloat(payload.tz_offset) : undefined,
    tz_name: payload.tz_name || undefined,
    ayanamsa: payload.ayanamsa || 'lahiri',
    house_system: payload.house_system || 'P',
    notes: payload.notes ? String(payload.notes).slice(0, 2000) : '',
    tags: Array.isArray(payload.tags) ? payload.tags.map((t) => String(t).slice(0, 40)).slice(0, 10) : [],
    created_at: payload.created_at || now,
    updated_at: now,
  };
}

function validateBirth(b) {
  if (!b.name || Number.isNaN(b.year) || Number.isNaN(b.month) || Number.isNaN(b.day)) {
    throw new Error('name, year, month, day are required');
  }
  if (Number.isNaN(b.latitude) || Number.isNaN(b.longitude)) {
    throw new Error('latitude and longitude are required');
  }
  if (b.tz_offset === undefined && !b.tz_name) {
    throw new Error('tz_offset or tz_name is required');
  }
}

export async function listBirths(userEmail) {
  await ensureDir();
  const files = await fs.readdir(BIRTHS_DIR);
  const births = [];
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    try {
      const raw = await fs.readFile(path.join(BIRTHS_DIR, f), 'utf8');
      const data = JSON.parse(raw);
      // Filter by owner_email if userEmail is provided
      if (userEmail && data.owner_email && data.owner_email !== userEmail.toLowerCase().trim()) {
        continue;
      }
      births.push({
        id: data.id,
        name: data.name,
        place: data.place,
        date: `${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`,
        time: `${String(data.hour).padStart(2, '0')}:${String(data.minute).padStart(2, '0')}`,
        updated_at: data.updated_at,
        tags: data.tags || [],
      });
    } catch { /* skip corrupt files */ }
  }
  births.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
  return births;
}

export async function getBirth(id) {
  const raw = await fs.readFile(birthPath(id), 'utf8');
  return JSON.parse(raw);
}

export async function saveBirth(payload, userEmail) {
  await ensureDir();
  const birth = normalizeBirth(payload);
  validateBirth(birth);
  // Attach owner email if provided
  if (userEmail) {
    birth.owner_email = userEmail.toLowerCase().trim();
  }
  await fs.writeFile(birthPath(birth.id), JSON.stringify(birth, null, 2), 'utf8');
  return birth;
}

export async function deleteBirth(id) {
  await fs.unlink(birthPath(id));
  return { deleted: id };
}

/** Convert saved birth record to /api/calculate payload */
export function birthToCalculatePayload(birth) {
  return {
    year: birth.year,
    month: birth.month,
    day: birth.day,
    hour: birth.hour,
    minute: birth.minute,
    second: birth.second || 0,
    latitude: birth.latitude,
    longitude: birth.longitude,
    tz_offset: birth.tz_offset,
    tz_name: birth.tz_name,
    place: birth.place,
    ayanamsa: birth.ayanamsa || 'lahiri',
    house_system: birth.house_system || 'P',
  };
}
