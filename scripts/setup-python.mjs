#!/usr/bin/env node
/**
 * Ensure python_engine/.venv exists and has requirements installed.
 * Safe to re-run; skips venv creation when the interpreter already exists.
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const venvDir = path.join(root, 'python_engine', '.venv');
const reqFile = path.join(root, 'python_engine', 'requirements.txt');
const isWin = process.platform === 'win32';
const venvPython = path.join(venvDir, isWin ? 'Scripts' : 'bin', isWin ? 'python.exe' : 'python');
const bootstrapPython = isWin ? 'python' : 'python3';

function run(cmd, args, label) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', cwd: root });
  if (result.error) {
    console.error(`[setup-python] Failed to ${label}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[setup-python] ${label} exited with code ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

if (!fs.existsSync(reqFile)) {
  console.error(`[setup-python] Missing ${reqFile}`);
  process.exit(1);
}

if (!fs.existsSync(venvPython)) {
  console.log(`[setup-python] Creating venv at ${venvDir}`);
  run(bootstrapPython, ['-m', 'venv', venvDir], 'create venv');
}

console.log(`[setup-python] Installing requirements into ${venvPython}`);
run(venvPython, ['-m', 'pip', 'install', '-r', reqFile], 'pip install');
console.log('[setup-python] Done.');
