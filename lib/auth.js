import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const DEV_SECRET = 'astroworld-testing-secret';
const USERS_DIR = process.env.AUTH_USERS_DIR || path.join(process.cwd(), 'data', 'users');
const MASTER_FILE = process.env.AUTH_MASTER_FILE || path.join(process.cwd(), 'data', 'users-master.json');
const TOKEN_EXPIRY_DAYS = 30;

// OTP bypass is controlled by an env flag and defaults to FALSE (secure).
// Read at call time (not module load) so tests can toggle via env.
export function bypassEnabled() {
  return process.env.AUTH_BYPASS_OTP === 'true';
}

let devSecretWarned = false;

// Returns the signing secret. In dev, falls back to a well-known default.
function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== 'production' && !devSecretWarned) {
      console.warn('[auth] AUTH_SECRET is not set — using insecure development default. Set AUTH_SECRET in production.');
      devSecretWarned = true;
    }
    return DEV_SECRET;
  }
  if (secret === DEV_SECRET && process.env.NODE_ENV !== 'production' && !devSecretWarned) {
    console.warn('[auth] AUTH_SECRET is set to the insecure development default. Set a unique AUTH_SECRET in production.');
    devSecretWarned = true;
  }
  return secret;
}

// Fail closed: in production the dev default (or an unset secret) must never be
// usable to sign or verify tokens.
function assertSecret() {
  if (process.env.NODE_ENV === 'production') {
    const secret = process.env.AUTH_SECRET;
    if (!secret || secret === DEV_SECRET) {
      throw new Error('AUTH_SECRET must be set to a secure value in production.');
    }
  }
}

// Provider seam for OTP delivery. No real provider is integrated in this PR.
// In dev, log the OTP server-side so it can be used to complete verification;
// in production this is a no-op that returns a pending status.
export function deliverOtp(email, otp) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[auth] OTP for ${email}: ${otp}`);
    return { delivered: true, channel: 'log' };
  }
  // TODO: integrate a real OTP delivery provider (email/SMS) here.
  return { delivered: false, status: 'pending' };
}

async function ensureUsersDir() {
  await fs.mkdir(USERS_DIR, { recursive: true });
}

function emailHash(email) {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 16);
}

function userFilePath(email) {
  return path.join(USERS_DIR, `${emailHash(email)}.json`);
}

export function generateToken(user) {
  const payload = {
    email: user.email,
    name: user.name,
    exp: Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  };
  assertSecret();
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', getAuthSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  assertSecret();
  const expectedSig = crypto.createHmac('sha256', getAuthSecret()).update(data).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function registerUser(name, mobile, email) {
  await ensureUsersDir();
  const normalizedEmail = email.toLowerCase().trim();
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const now = new Date().toISOString();

  const userData = {
    name: name.trim(),
    mobile: mobile.trim(),
    email: normalizedEmail,
    otp,
    otp_created_at: now,
    registered_at: now,
    updated_at: now,
  };

  // Check if user exists — if so, update OTP only
  const filePath = userFilePath(normalizedEmail);
  let existingUser = null;
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    existingUser = JSON.parse(raw);
  } catch { /* new user */ }

  if (existingUser) {
    existingUser.otp = otp;
    existingUser.otp_created_at = now;
    existingUser.updated_at = now;
    // Update name/mobile if provided
    if (name.trim()) existingUser.name = name.trim();
    if (mobile.trim()) existingUser.mobile = mobile.trim();
    await fs.writeFile(filePath, JSON.stringify(existingUser, null, 2), 'utf8');
  } else {
    await fs.writeFile(filePath, JSON.stringify(userData, null, 2), 'utf8');
    // Append to master file
    await appendToMaster(userData);
  }

  // Hand the OTP to the delivery seam (logs in dev, no-op/pending in prod).
  deliverOtp(normalizedEmail, otp);

  return { success: true, message: 'OTP sent to email', otp_bypass: bypassEnabled() };
}

async function appendToMaster(userData) {
  let master = [];
  try {
    const raw = await fs.readFile(MASTER_FILE, 'utf8');
    master = JSON.parse(raw);
  } catch { /* file doesn't exist yet */ }

  master.push({
    name: userData.name,
    mobile: userData.mobile,
    email: userData.email,
    registered_at: userData.registered_at,
  });

  await fs.writeFile(MASTER_FILE, JSON.stringify(master, null, 2), 'utf8');
}

export async function verifyOTP(email, otp) {
  const normalizedEmail = email.toLowerCase().trim();
  const filePath = userFilePath(normalizedEmail);

  let user;
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    user = JSON.parse(raw);
  } catch {
    return { success: false, error: 'User not found. Please register first.' };
  }

  // When bypass is OFF, enforce the stored OTP. When ON, accept any OTP.
  if (!bypassEnabled()) {
    if (!user.otp || user.otp !== otp) {
      return { success: false, error: 'Invalid OTP' };
    }
  }

  // Clear OTP after verification
  user.otp = null;
  user.otp_created_at = null;
  user.last_login = new Date().toISOString();
  await fs.writeFile(filePath, JSON.stringify(user, null, 2), 'utf8');

  const token = generateToken(user);
  return {
    success: true,
    token,
    user: { name: user.name, email: user.email, mobile: user.mobile },
  };
}

export async function getUser(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const filePath = userFilePath(normalizedEmail);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const user = JSON.parse(raw);
    return { name: user.name, email: user.email, mobile: user.mobile, registered_at: user.registered_at };
  } catch {
    return null;
  }
}

export function extractTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export function authenticateRequest(request) {
  const token = extractTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}
