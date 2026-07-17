#!/usr/bin/env node
/**
 * Seed anonymized fixtures into data/ so a fresh checkout can exercise the
 * auth + birth flows without any real PII.
 *
 * - Copies data/seed/users.sample.json into data/users/<emailHash>.json
 *   (hash matches lib/auth.js emailHash: sha256(email).slice(0, 16)).
 * - Writes data/users-master.json (array of {name, mobile, email, registered_at})
 *   if it is missing or empty.
 * - Copies data/seed/births.sample.json into data/births/<id>.json.
 *
 * Idempotent: existing user/birth files and a non-empty master file are left
 * untouched. Safe to run repeatedly. Run with:  node scripts/seed-data.mjs
 */
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEED_DIR = path.join(ROOT, 'data', 'seed');
const USERS_DIR = path.join(ROOT, 'data', 'users');
const BIRTHS_DIR = path.join(ROOT, 'data', 'births');
const MASTER_FILE = path.join(ROOT, 'data', 'users-master.json');

// Mirror lib/auth.js emailHash so seeded user files land at the paths the app reads.
function emailHash(email) {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 16);
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function fileExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await fs.mkdir(USERS_DIR, { recursive: true });
  await fs.mkdir(BIRTHS_DIR, { recursive: true });

  const seedUsers = await readJson(path.join(SEED_DIR, 'users.sample.json'), []);
  const seedBirths = await readJson(path.join(SEED_DIR, 'births.sample.json'), []);

  // Seed user files (one JSON per user, keyed by emailHash).
  let usersWritten = 0;
  for (const user of seedUsers) {
    if (!user.email) continue;
    const filePath = path.join(USERS_DIR, `${emailHash(user.email)}.json`);
    if (await fileExists(filePath)) continue;
    const now = new Date().toISOString();
    const record = {
      name: user.name,
      mobile: user.mobile || '',
      email: user.email.toLowerCase().trim(),
      otp: user.otp ?? '123456',
      otp_created_at: user.otp_created_at || now,
      registered_at: user.registered_at || now,
      updated_at: user.updated_at || now,
    };
    await fs.writeFile(filePath, JSON.stringify(record, null, 2), 'utf8');
    usersWritten += 1;
  }

  // Seed master file only if missing or empty.
  const existingMaster = await readJson(MASTER_FILE, []);
  if (!Array.isArray(existingMaster) || existingMaster.length === 0) {
    const master = seedUsers
      .filter((u) => u.email)
      .map((u) => ({
        name: u.name,
        mobile: u.mobile || '',
        email: u.email.toLowerCase().trim(),
        registered_at: u.registered_at || new Date().toISOString(),
      }));
    await fs.writeFile(MASTER_FILE, JSON.stringify(master, null, 2), 'utf8');
    console.log(`Wrote master file with ${master.length} user(s).`);
  } else {
    console.log('Master file already populated — leaving untouched.');
  }

  // Seed birth records (one JSON per birth, keyed by id).
  let birthsWritten = 0;
  for (const birth of seedBirths) {
    if (!birth.id) continue;
    const filePath = path.join(BIRTHS_DIR, `${birth.id}.json`);
    if (await fileExists(filePath)) continue;
    await fs.writeFile(filePath, JSON.stringify(birth, null, 2), 'utf8');
    birthsWritten += 1;
  }

  console.log(`Seed complete: ${usersWritten} user file(s), ${birthsWritten} birth file(s) written.`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
