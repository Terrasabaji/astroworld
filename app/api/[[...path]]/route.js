import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { searchCities, nearestCity } from '@/lib/cities-search';
import { listBirths, getBirth, saveBirth, deleteBirth } from '@/lib/births';
import { registerUser, verifyOTP, getUser, authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PY_CALC = path.join(process.cwd(), 'python_engine', 'calculate.py');
const PY_BTR = path.join(process.cwd(), 'python_engine', 'run_btr.py');
const PY_ADVISER = path.join(process.cwd(), 'python_engine', 'run_adviser.py');
const PY_COMPREHENSIVE = path.join(process.cwd(), 'python_engine', 'run_comprehensive.py');
const PY_MUHURTA = path.join(process.cwd(), 'python_engine', 'run_muhurta.py');
const PY_YOGA_DOSHA = path.join(process.cwd(), 'python_engine', 'run_yoga_dosha.py');
const PY_PANCHANGA = path.join(process.cwd(), 'python_engine', 'run_panchanga.py');
const PY_PRASHNA = path.join(process.cwd(), 'python_engine', 'run_prashna.py');

function resolvePythonExecutable() {
  if (process.env.ASTRO_WORLD_PYTHON) {
    return process.env.ASTRO_WORLD_PYTHON;
  }
  if (process.env.SIDDHANTA_PYTHON) {
    return process.env.SIDDHANTA_PYTHON;
  }
  const bundled = path.join(process.cwd(), 'runtime', 'python', 'python.exe');
  if (process.platform === 'win32' && fs.existsSync(bundled)) {
    return bundled;
  }
  return process.platform === 'win32' ? 'python' : 'python3';
}

function runPython(script, payload) {
  return new Promise((resolve, reject) => {
    const timeoutMs = parseInt(process.env.ASTRO_WORLD_PYTHON_TIMEOUT_MS, 10) || 90000;
    const py = spawn(resolvePythonExecutable(), [script], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      py.kill('SIGKILL');
      const e = new Error('Calculation timed out');
      e.code = 'PYTHON_TIMEOUT';
      reject(e);
    }, timeoutMs);
    py.stdout.on('data', (d) => { out += d.toString(); });
    py.stderr.on('data', (d) => { err += d.toString(); });
    py.on('error', (e) => { clearTimeout(timer); reject(e); });
    py.on('close', (code) => {
      clearTimeout(timer);
      if (out) {
        try { return resolve(JSON.parse(out)); } catch { /* fallthrough */ }
      }
      reject(new Error(err || `Python exited with code ${code}`));
    });
    py.stdin.write(JSON.stringify(payload));
    py.stdin.end();
  });
}

function pythonErrorResponse(e) {
  if (e.code === 'PYTHON_TIMEOUT') {
    return NextResponse.json({ error: 'Calculation timed out' }, { status: 504 });
  }
  return NextResponse.json({ error: e.message }, { status: 500 });
}

// Wraps a successful python result: engine-reported errors -> 400, else 200.
function pythonJson(result) {
  if (result.error) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}

// Authenticates the request. With the sign-in page removed, missing tokens fall
// back to a local guest identity so chart/birth features keep working.
const GUEST_USER = { name: 'Guest', email: 'guest@local' };

function requireAuth(request) {
  let user;
  try {
    user = authenticateRequest(request);
  } catch {
    return { error: NextResponse.json({ error: 'Authentication is not configured' }, { status: 500 }) };
  }
  if (!user) {
    return { user: GUEST_USER };
  }
  return { user };
}

// A birth belongs to the caller only when its owner_email matches. Records with
// no owner_email (legacy/unscoped) are default-denied in authenticated routes.
function ownsBirth(birth, user) {
  return birth.owner_email === user.email.toLowerCase().trim();
}

function normalizeCalculateBody(body) {
  return {
    year: parseInt(body.year),
    month: parseInt(body.month),
    day: parseInt(body.day),
    hour: parseInt(body.hour),
    minute: parseInt(body.minute),
    second: parseInt(body.second || 0),
    tz_offset: body.tz_offset !== undefined && body.tz_offset !== '' ? parseFloat(body.tz_offset) : undefined,
    tz_name: body.tz_name || undefined,
    latitude: parseFloat(body.latitude),
    longitude: parseFloat(body.longitude),
    place: body.place || undefined,
    ayanamsa: body.ayanamsa || 'lahiri',
    house_system: body.house_system || 'P',
    transit: body.transit || undefined,
  };
}

export async function GET(request, { params }) {
  const resolved = (await params) || {};
  const parts = resolved.path || [];
  const seg = parts.join('/');

  if (seg === 'health') {
    return NextResponse.json({ status: 'ok', engine: 'swisseph-python' });
  }
  if (seg === 'cities/nearest') {
    const lat = parseFloat(request.nextUrl.searchParams.get('lat'));
    const lon = parseFloat(request.nextUrl.searchParams.get('lon'));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
    }
    try {
      const city = nearestCity(lat, lon);
      if (!city) return NextResponse.json({ error: 'No city found' }, { status: 404 });
      return NextResponse.json({ city, latitude: lat, longitude: lon });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }
  if (seg === 'cities') {
    const q = request.nextUrl.searchParams.get('q') || '';
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '12'), 30);
    try {
      return NextResponse.json({ results: searchCities(q, limit) });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }
  if (seg === 'births') {
    const { user, error } = requireAuth(request);
    if (error) return error;
    try {
      return NextResponse.json({ births: await listBirths(user.email) });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }
  if (parts[0] === 'births' && parts[1]) {
    const { user, error } = requireAuth(request);
    if (error) return error;
    try {
      const birth = await getBirth(parts[1]);
      if (!ownsBirth(birth, user)) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(birth);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
  }
  if (seg === 'auth/me') {
    const { user, error } = requireAuth(request);
    if (error) return error;
    try {
      const profile = await getUser(user.email);
      if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      return NextResponse.json({ success: true, user: profile });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (seg === 'auth/user-births') {
    const { user, error } = requireAuth(request);
    if (error) return error;
    try {
      const births = await listBirths(user.email);
      return NextResponse.json({ births });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (seg === 'muhurta/events') {
    try {
      const result = await runPython(PY_MUHURTA, { op: 'events' });
      return pythonJson(result);
    } catch (e) {
      return pythonErrorResponse(e);
    }
  }

  if (seg === 'panchanga') {
    try {
      const lat = request.nextUrl.searchParams.get('lat') || '12.9716';
      const lon = request.nextUrl.searchParams.get('lon') || '77.5946';
      const tz_offset = request.nextUrl.searchParams.get('tz_offset') || '5.5';
      const result = await runPython(PY_PANCHANGA, { latitude: +lat, longitude: +lon, tz_offset: +tz_offset });
      return pythonJson(result);
    } catch (e) {
      return pythonErrorResponse(e);
    }
  }

  return NextResponse.json({
    message: 'Astro World API',
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/verify-otp',
      'GET /api/auth/me',
      'GET /api/auth/user-births',
      'POST /api/auth/logout',
      'POST /api/calculate',
      'GET /api/births',
      'POST /api/births',
      'GET /api/births/:id',
      'DELETE /api/births/:id',
      'POST /api/btr/rectify',
      'POST /api/btr/chart',
      'POST /api/adviser/report',
      'POST /api/comprehensive',
      'POST /api/muhurta/search',
      'GET /api/muhurta/events',
      'GET /api/panchanga',
      'POST /api/yoga-dosha/analyze',
      'POST /api/prashna/analyze',
      'GET /api/cities?q=',
    ],
  });
}

export async function POST(request, { params }) {
  const resolved = (await params) || {};
  const seg = (resolved.path || []).join('/');

  if (seg === 'auth/register') {
    try {
      const body = await request.json();
      const { name, mobile, email } = body;
      if (!name || !email) {
        return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
      }
      const result = await registerUser(name, mobile || '', email);
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (seg === 'auth/verify-otp') {
    try {
      const body = await request.json();
      const { email, otp } = body;
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }
      const result = await verifyOTP(email, otp || '');
      if (!result.success) {
        return NextResponse.json(result, { status: 401 });
      }
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (seg === 'auth/logout') {
    return NextResponse.json({ success: true, message: 'Logged out' });
  }

  if (seg === 'calculate') {
    try {
      const body = await request.json();
      const result = await runPython(PY_CALC, normalizeCalculateBody(body));
      return pythonJson(result);
    } catch (e) {
      return pythonErrorResponse(e);
    }
  }

  if (seg === 'births') {
    const { user, error } = requireAuth(request);
    if (error) return error;
    try {
      const body = await request.json();
      // When updating an existing record, only its owner may overwrite it.
      if (body.id) {
        let existing = null;
        try { existing = await getBirth(body.id); } catch { /* new id */ }
        if (existing && !ownsBirth(existing, user)) {
          return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
      }
      const saved = await saveBirth(body, user.email);
      return NextResponse.json(saved);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
  }

  if (seg === 'btr/rectify') {
    try {
      const body = await request.json();
      const result = await runPython(PY_BTR, { ...body, op: 'rectify' });
      return pythonJson(result);
    } catch (e) {
      return pythonErrorResponse(e);
    }
  }

  if (seg === 'btr/chart') {
    try {
      const body = await request.json();
      const result = await runPython(PY_BTR, { ...body, op: 'chart' });
      return pythonJson(result);
    } catch (e) {
      return pythonErrorResponse(e);
    }
  }

  if (seg === 'adviser/report') {
    try {
      const body = await request.json();
      const result = await runPython(PY_ADVISER, body);
      return pythonJson(result);
    } catch (e) {
      return pythonErrorResponse(e);
    }
  }

  if (seg === 'comprehensive') {
    try {
      const body = await request.json();
      const payload = {
        ...normalizeCalculateBody(body),
        name: body.name || 'Native',
        cast_moment: body.cast_moment || undefined,
      };
      const result = await runPython(PY_COMPREHENSIVE, payload);
      return pythonJson(result);
    } catch (e) {
      return pythonErrorResponse(e);
    }
  }

  if (seg === 'muhurta/search') {
    try {
      const body = await request.json();
      const result = await runPython(PY_MUHURTA, { op: 'search', ...body });
      return pythonJson(result);
    } catch (e) {
      return pythonErrorResponse(e);
    }
  }

  if (seg === 'yoga-dosha/analyze') {
    try {
      const body = await request.json();
      const result = await runPython(PY_YOGA_DOSHA, {
        ...normalizeCalculateBody(body),
        name: body.name || undefined,
        marital_status: body.marital_status || undefined,
      });
      return pythonJson(result);
    } catch (e) {
      return pythonErrorResponse(e);
    }
  }

  if (seg === 'prashna/analyze') {
    try {
      const body = await request.json();
      const mode = String(body.mode || 'manual').toLowerCase();
      if (mode !== 'mooka' && mode !== 'manual') {
        return NextResponse.json(
          { error: "Prashna supports only two types: mode='mooka' or mode='manual'." },
          { status: 400 },
        );
      }
      const payload = {
        ...normalizeCalculateBody(body),
        mode,
        question_text: body.question_text || body.question || '',
        category: body.category || undefined,
        horary_number: body.horary_number ?? body.horaryNumber ?? undefined,
        primary_house: body.primary_house || undefined,
        name: body.name || 'Querent',
        altitude: body.altitude || 0,
      };
      const result = await runPython(PY_PRASHNA, payload);
      return pythonJson(result);
    } catch (e) {
      return pythonErrorResponse(e);
    }
  }

  return NextResponse.json({ error: 'Unknown endpoint' }, { status: 404 });
}

export async function DELETE(request, { params }) {
  const resolved = (await params) || {};
  const parts = resolved.path || [];
  if (parts[0] === 'births' && parts[1]) {
    const { user, error } = requireAuth(request);
    if (error) return error;
    try {
      const birth = await getBirth(parts[1]);
      if (!ownsBirth(birth, user)) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(await deleteBirth(parts[1]));
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
  }
  return NextResponse.json({ error: 'Unknown endpoint' }, { status: 404 });
}
