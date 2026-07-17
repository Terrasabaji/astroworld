export const BIRTH_SESSION_KEY = 'siddhanta_active_birth';

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'neutral', label: 'Neutral' },
];

export const MARITAL_STATUS_OPTIONS = [
  { value: 'unmarried', label: 'Unmarried' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'separated', label: 'Separated' },
];

export function normalizeMaritalStatus(value, fallback = 'unmarried') {
  const v = String(value || fallback).toLowerCase();
  if (MARITAL_STATUS_OPTIONS.some((o) => o.value === v)) return v;
  return fallback;
}

export const DEFAULT_BIRTH = {
  name: 'Native',
  gender: 'male',
  marital_status: 'unmarried',
  year: 1971,
  month: 3,
  day: 3,
  hour: 14,
  minute: 53,
  second: 0,
  tz_offset: 5.5,
  tz_name: 'Asia/Kolkata',
  place: 'Tirthahalli, IN',
  latitude: 13.68833,
  longitude: 75.24556,
  ayanamsa: 'lahiri',
  house_system: 'P',
};

export const DEFAULT_PARTNER_BIRTH = {
  name: 'Partner',
  gender: 'female',
  marital_status: 'unmarried',
  year: 1993,
  month: 11,
  day: 22,
  hour: 14,
  minute: 15,
  second: 0,
  tz_offset: 5.5,
  tz_name: 'Asia/Kolkata',
  place: 'New Delhi, IN',
  latitude: 28.61,
  longitude: 77.21,
  ayanamsa: 'lahiri',
  house_system: 'P',
};

export function normalizeGender(value, fallback = 'male') {
  const g = String(value || fallback).toLowerCase();
  if (g === 'female') return 'female';
  if (g === 'neutral') return 'neutral';
  return 'male';
}

export function genderLabel(gender) {
  const labels = { male: 'Male', female: 'Female', neutral: 'Neutral' };
  return labels[normalizeGender(gender)] || 'Male';
}

export function oppositeGender(gender) {
  const g = normalizeGender(gender);
  if (g === 'female') return 'male';
  if (g === 'male') return 'female';
  return 'female';
}

function numField(value, fallback) {
  if (value === '' || value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function birthFields(data = {}) {
  return {
    name: data.name ?? DEFAULT_BIRTH.name,
    gender: normalizeGender(data.gender, DEFAULT_BIRTH.gender),
    marital_status: normalizeMaritalStatus(data.marital_status, DEFAULT_BIRTH.marital_status),
    year: numField(data.year, DEFAULT_BIRTH.year),
    month: numField(data.month, DEFAULT_BIRTH.month),
    day: numField(data.day, DEFAULT_BIRTH.day),
    hour: numField(data.hour, DEFAULT_BIRTH.hour),
    minute: numField(data.minute, DEFAULT_BIRTH.minute),
    second: numField(data.second, DEFAULT_BIRTH.second),
    tz_offset: data.tz_offset !== undefined && data.tz_offset !== ''
      ? numField(data.tz_offset, DEFAULT_BIRTH.tz_offset)
      : DEFAULT_BIRTH.tz_offset,
    tz_name: data.tz_name || DEFAULT_BIRTH.tz_name,
    place: data.place ?? DEFAULT_BIRTH.place,
    latitude: numField(data.latitude, DEFAULT_BIRTH.latitude),
    longitude: numField(data.longitude, DEFAULT_BIRTH.longitude),
    ayanamsa: data.ayanamsa || DEFAULT_BIRTH.ayanamsa,
    house_system: data.house_system || DEFAULT_BIRTH.house_system,
  };
}

export function normalizeBirth(data = {}) {
  const native = birthFields(data);
  const partnerSeed = {
    ...DEFAULT_PARTNER_BIRTH,
    gender: oppositeGender(native.gender),
    name: native.gender === 'male' ? 'Bride' : native.gender === 'female' ? 'Groom' : 'Partner',
  };
  return {
    ...native,
    partner: birthFields({ ...partnerSeed, ...(data.partner || {}) }),
  };
}

export function splitMarriageBirths(session) {
  const s = normalizeBirth(session);
  const groom = s.gender === 'female'
    ? { ...s.partner, gender: 'male' }
    : { ...s, gender: s.gender === 'neutral' ? 'neutral' : 'male' };
  const bride = s.gender === 'female' ? { ...s, gender: 'female' } : { ...s.partner, gender: 'female' };
  return { groom, bride, native: s };
}

export function birthRecordToForm(record = {}) {
  return {
    name: record.name || 'Native',
    gender: normalizeGender(record.gender),
    marital_status: normalizeMaritalStatus(record.marital_status),
    year: Number(record.year),
    month: Number(record.month),
    day: Number(record.day),
    hour: Number(record.hour),
    minute: Number(record.minute),
    second: Number(record.second || 0),
    tz_offset: record.tz_offset !== undefined && record.tz_offset !== ''
      ? Number(record.tz_offset)
      : DEFAULT_BIRTH.tz_offset,
    tz_name: record.tz_name || DEFAULT_BIRTH.tz_name,
    place: record.place ?? '',
    latitude: Number(record.latitude),
    longitude: Number(record.longitude),
    ayanamsa: record.ayanamsa || DEFAULT_BIRTH.ayanamsa,
    house_system: record.house_system || DEFAULT_BIRTH.house_system,
    record_id: record.id,
  };
}

export function nativeBirth(data = {}) {
  const { partner, ...native } = normalizeBirth(data);
  if (data.record_id) native.record_id = data.record_id;
  return native;
}

export function applyMarriageSide(session, side, patch) {
  const s = normalizeBirth(session);
  const currentSide = side === 'groom'
    ? (s.gender === 'female' ? s.partner : s)
    : (s.gender === 'female' ? s : s.partner);
  const merged = typeof patch === 'function'
    ? { ...currentSide, ...patch(currentSide) }
    : { ...currentSide, ...patch };

  if (side === 'groom') {
    if (s.gender !== 'female') {
      return { ...s, ...merged, gender: s.gender === 'neutral' ? 'neutral' : 'male' };
    }
    return { ...s, partner: { ...s.partner, ...merged, gender: 'male' } };
  }

  if (s.gender === 'female') {
    return { ...s, ...merged, gender: 'female' };
  }
  return { ...s, partner: { ...s.partner, ...merged, gender: 'female' } };
}

export function loadBirthSession() {
  if (typeof window === 'undefined') return normalizeBirth();
  try {
    const raw = localStorage.getItem(BIRTH_SESSION_KEY);
    if (!raw) return normalizeBirth();
    return normalizeBirth(JSON.parse(raw));
  } catch {
    return normalizeBirth();
  }
}

export function saveBirthSession(data) {
  if (typeof window === 'undefined') return normalizeBirth(data);
  const normalized = normalizeBirth(data);
  localStorage.setItem(BIRTH_SESSION_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('siddhanta-birth-update', { detail: normalized }));
  return normalized;
}
