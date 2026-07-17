/**
 * Tests for the shipped lib/auth.js (imports the real module — no copied logic).
 *
 * Run with: node tests/auth.test.mjs  (or: npm test)
 *
 * Requires Node >= 20.17 (ESM auto-detection for the typeless package). The
 * suite uses a throwaway temp directory via the AUTH_USERS_DIR / AUTH_MASTER_FILE
 * env overrides so it never touches real repo data.
 */

import assert from 'assert';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

// --- Test environment: isolate all on-disk state to a temp dir BEFORE import ---
const TMP = await fs.mkdtemp(path.join(os.tmpdir(), 'astro-auth-test-'));
process.env.AUTH_USERS_DIR = path.join(TMP, 'users');
process.env.AUTH_MASTER_FILE = path.join(TMP, 'users-master.json');
process.env.AUTH_SECRET = 'test-secret-key';
delete process.env.NODE_ENV; // ensure non-production (dev) behavior
delete process.env.AUTH_BYPASS_OTP;

// Import the real shipped module.
const auth = await import('../lib/auth.js');
const {
  registerUser,
  verifyOTP,
  getUser,
  generateToken,
  verifyToken,
  bypassEnabled,
  deliverOtp,
} = auth;

// --- Tiny test harness ---
let passed = 0;
let failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  \u2713 ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log(`  \u2717 ${name}`);
    console.log(`      ${err.message}`);
  }
}

// Read the stored OTP for an email directly from disk (mirrors auth.emailHash).
import crypto from 'crypto';
function emailHash(email) {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 16);
}
async function readStoredUser(email) {
  const p = path.join(process.env.AUTH_USERS_DIR, `${emailHash(email)}.json`);
  return JSON.parse(await fs.readFile(p, 'utf8'));
}

console.log('\nlib/auth.js\n');

await test('bypassEnabled() reflects AUTH_BYPASS_OTP at call time', () => {
  delete process.env.AUTH_BYPASS_OTP;
  assert.strictEqual(bypassEnabled(), false, 'defaults to false when unset');
  process.env.AUTH_BYPASS_OTP = 'true';
  assert.strictEqual(bypassEnabled(), true);
  process.env.AUTH_BYPASS_OTP = 'false';
  assert.strictEqual(bypassEnabled(), false);
  delete process.env.AUTH_BYPASS_OTP;
});

await test('generateToken/verifyToken round-trips a valid payload', () => {
  const token = generateToken({ email: 'round@trip.com', name: 'Round Trip' });
  const payload = verifyToken(token);
  assert.ok(payload, 'token should verify');
  assert.strictEqual(payload.email, 'round@trip.com');
  assert.strictEqual(payload.name, 'Round Trip');
});

await test('verifyToken rejects a tampered signature', () => {
  const token = generateToken({ email: 'a@b.com', name: 'A' });
  const [data] = token.split('.');
  const forged = `${data}.deadbeef`;
  assert.strictEqual(verifyToken(forged), null);
});

await test('verifyToken rejects malformed / empty tokens', () => {
  assert.strictEqual(verifyToken(''), null);
  assert.strictEqual(verifyToken(null), null);
  assert.strictEqual(verifyToken('only-one-part'), null);
});

await test('verifyToken rejects an expired token', () => {
  // Build a token with an exp in the past, signed with the same secret.
  const payload = { email: 'x@y.com', name: 'X', exp: Date.now() - 1000 };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', process.env.AUTH_SECRET).update(data).digest('base64url');
  assert.strictEqual(verifyToken(`${data}.${sig}`), null);
});

await test('registerUser stores a user and reports bypass state', async () => {
  delete process.env.AUTH_BYPASS_OTP;
  const res = await registerUser('Jane Doe', '9990001111', 'Jane@Example.com');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.otp_bypass, false, 'reports current bypass state (off)');
  const stored = await readStoredUser('jane@example.com');
  assert.strictEqual(stored.email, 'jane@example.com', 'email normalized to lowercase');
  assert.match(stored.otp, /^\d{6}$/, 'stores a 6-digit OTP');
  assert.strictEqual(stored.name, 'Jane Doe');
});

await test('getUser returns sanitized profile without OTP', async () => {
  const u = await getUser('jane@example.com');
  assert.ok(u);
  assert.strictEqual(u.email, 'jane@example.com');
  assert.strictEqual(u.name, 'Jane Doe');
  assert.strictEqual('otp' in u, false, 'OTP must not leak in profile');
});

await test('verifyOTP (bypass ON) accepts any OTP', async () => {
  process.env.AUTH_BYPASS_OTP = 'true';
  await registerUser('Bypass User', '111', 'bypass@example.com');
  const res = await verifyOTP('bypass@example.com', '000000');
  assert.strictEqual(res.success, true);
  assert.ok(res.token, 'returns a token');
  assert.ok(verifyToken(res.token), 'token is valid');
  delete process.env.AUTH_BYPASS_OTP;
});

await test('verifyOTP (bypass OFF) rejects a wrong OTP', async () => {
  delete process.env.AUTH_BYPASS_OTP;
  await registerUser('Strict User', '222', 'strict@example.com');
  const res = await verifyOTP('strict@example.com', '999999');
  assert.strictEqual(res.success, false);
  assert.match(res.error, /Invalid OTP/);
});

await test('verifyOTP (bypass OFF) rejects null / empty OTP', async () => {
  delete process.env.AUTH_BYPASS_OTP;
  await registerUser('Strict User', '222', 'strict@example.com');
  assert.strictEqual((await verifyOTP('strict@example.com', '')).success, false);
  assert.strictEqual((await verifyOTP('strict@example.com', null)).success, false);
});

await test('verifyOTP (bypass OFF) accepts the stored OTP, then consumes it', async () => {
  delete process.env.AUTH_BYPASS_OTP;
  await registerUser('Consume User', '333', 'consume@example.com');
  const { otp } = await readStoredUser('consume@example.com');
  const ok = await verifyOTP('consume@example.com', otp);
  assert.strictEqual(ok.success, true, 'stored OTP verifies');
  assert.ok(ok.token);
  // OTP is cleared after use — reuse must fail.
  const reuse = await verifyOTP('consume@example.com', otp);
  assert.strictEqual(reuse.success, false, 'consumed OTP cannot be reused');
  const stored = await readStoredUser('consume@example.com');
  assert.strictEqual(stored.otp, null, 'OTP nulled on disk after verification');
});

await test('verifyOTP returns an error for an unknown user', async () => {
  const res = await verifyOTP('nobody@example.com', '123456');
  assert.strictEqual(res.success, false);
  assert.match(res.error, /not found/i);
});

await test('deliverOtp (dev) reports delivery via log channel', () => {
  const r = deliverOtp('someone@example.com', '123456');
  assert.strictEqual(r.delivered, true);
  assert.strictEqual(r.channel, 'log');
});

// --- Summary / cleanup ---
await fs.rm(TMP, { recursive: true, force: true });

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  for (const f of failures) console.error(`FAILED: ${f.name}\n${f.err.stack}\n`);
  process.exit(1);
}
