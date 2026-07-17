import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { searchCities } from '@/lib/cities-search';
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
    const py = spawn(resolvePythonExecutable(), [script], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    py.stdout.on('data', (d) => { out += d.toString(); });
    py.stderr.on('data', (d) => { err += d.toString(); });
    py.on('error', reject);
    py.on('close', (code) => {
      if (out) {
        try { return resolve(JSON.parse(out)); } catch { /* fallthrough */ }
      }
      reject(new Error(err || `Python exited with code ${code}`));
    });
    py.stdin.write(JSON.stringify(payload));
    py.stdin.end();
  });
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
    try {
      return NextResponse.json({ births: await listBirths() });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }
  if (parts[0] === 'births' && parts[1]) {
    try {
      return NextResponse.json(await getBirth(parts[1]));
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
  }
  if (seg === 'auth/me') {
    const user = authenticateRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
      const profile = await getUser(user.email);
      if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      return NextResponse.json({ success: true, user: profile });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (seg === 'auth/user-births') {
    const user = authenticateRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      if (result.error) return NextResponse.json(result, { status: 400 });
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (seg === 'panchanga') {
    try {
      const lat = request.nextUrl.searchParams.get('lat') || '12.9716';
      const lon = request.nextUrl.searchParams.get('lon') || '77.5946';
      const tz_offset = request.nextUrl.searchParams.get('tz_offset') || '5.5';
      const result = await runPython(PY_PANCHANGA, { latitude: +lat, longitude: +lon, tz_offset: +tz_offset });
      if (result.error) return NextResponse.json(result, { status: 400 });
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
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
      if (result.error) return NextResponse.json(result, { status: 400 });
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (seg === 'births') {
    try {
      const body = await request.json();
      // Extract user email from auth token if present
      const user = authenticateRequest(request);
      const userEmail = user ? user.email : undefined;
      const saved = await saveBirth(body, userEmail);
      return NextResponse.json(saved);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
  }

  if (seg === 'btr/rectify') {
    try {
      const body = await request.json();
      const result = await runPython(PY_BTR, { ...body, op: 'rectify' });
      if (result.error) return NextResponse.json(result, { status: 400 });
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (seg === 'btr/chart') {
    try {
      const body = await request.json();
      const result = await runPython(PY_BTR, { ...body, op: 'chart' });
      if (result.error) return NextResponse.json(result, { status: 400 });
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (seg === 'adviser/report') {
    try {
      const body = await request.json();
      const result = await runPython(PY_ADVISER, body);
      if (result.error) return NextResponse.json(result, { status: 400 });
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
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
      if (result.error) return NextResponse.json(result, { status: 400 });
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (seg === 'muhurta/search') {
    try {
      const body = await request.json();
      const result = await runPython(PY_MUHURTA, { op: 'search', ...body });
      if (result.error) return NextResponse.json(result, { status: 400 });
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (seg === 'yoga-dosha/analyze') {
    try {
      const body = await request.json();
      const result = await runPython(PY_YOGA_DOSHA, normalizeCalculateBody(body));
      if (result.error) return NextResponse.json(result, { status: 400 });
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Unknown endpoint' }, { status: 404 });
}

export async function DELETE(request, { params }) {
  const resolved = (await params) || {};
  const parts = resolved.path || [];
  if (parts[0] === 'births' && parts[1]) {
    try {
      return NextResponse.json(await deleteBirth(parts[1]));
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
  }
  return NextResponse.json({ error: 'Unknown endpoint' }, { status: 404 });
}
