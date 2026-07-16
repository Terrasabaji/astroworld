import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const SECRET = process.env.AUTH_SECRET || 'astroworld-testing-secret';
const USERS_DIR = path.join(process.cwd(), 'data', 'users');
const MASTER_FILE = path.join(process.cwd(), 'data', 'users-master.json');
const BYPASS_OTP = true; // Testing mode — set to false for production
const TOKEN_EXPIRY_DAYS = 30;

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
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
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

  return { success: true, message: 'OTP sent to email', otp_bypass: BYPASS_OTP };
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

  // BYPASS MODE: always accept any OTP during testing
  if (!BYPASS_OTP) {
    if (user.otp !== otp) {
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
