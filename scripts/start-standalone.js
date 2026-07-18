#!/usr/bin/env node
/**
 * Start the Next.js standalone server with the Python engine available.
 * Used by `npm run start:standalone` after `npm run build`.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const serverJs = path.join(root, '.next', 'standalone', 'server.js');
const standaloneDir = path.dirname(serverJs);
const venvPython = path.join(
  root,
  'python_engine',
  '.venv',
  process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python',
);

if (!fs.existsSync(serverJs)) {
  console.error('Missing .next/standalone/server.js — run `npm run build` first.');
  process.exit(1);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function syncTree(from, to, { filter } = {}) {
  if (!fs.existsSync(from)) return;
  ensureDir(path.dirname(to));
  fs.cpSync(from, to, {
    recursive: true,
    force: true,
    filter: filter
      ? (src) => filter(src)
      : undefined,
  });
}

// Standalone may only partially trace python_engine; always sync the full trees.
// Never copy local .venv (symlinks break fs.cpSync); use ASTRO_WORLD_PYTHON instead.
const skipVenv = (src) => !src.includes(`${path.sep}.venv`) && !src.endsWith('.venv');

syncTree(path.join(root, '.next', 'static'), path.join(standaloneDir, '.next', 'static'));
syncTree(path.join(root, 'public'), path.join(standaloneDir, 'public'));
syncTree(path.join(root, 'python_engine'), path.join(standaloneDir, 'python_engine'), {
  filter: skipVenv,
});
syncTree(path.join(root, 'ephe'), path.join(standaloneDir, 'ephe'));
syncTree(path.join(root, 'data'), path.join(standaloneDir, 'data'), {
  filter: skipVenv,
});

const nestedVenv = path.join(standaloneDir, 'python_engine', '.venv');
if (fs.existsSync(nestedVenv)) {
  fs.rmSync(nestedVenv, { recursive: true, force: true });
}

const env = {
  ...process.env,
  PORT: process.env.PORT || '3000',
  HOSTNAME: process.env.HOSTNAME || '0.0.0.0',
  NODE_ENV: 'production',
};

if (!env.ASTRO_WORLD_PYTHON && fs.existsSync(venvPython)) {
  env.ASTRO_WORLD_PYTHON = venvPython;
}

const child = spawn(process.execPath, [serverJs], {
  cwd: standaloneDir,
  env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
