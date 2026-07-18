# AGENTS.md

## Cursor Cloud specific instructions

Astro World is a single web product: a **Next.js 15** app (JS, App Router) whose API
route (`app/api/[[...path]]/route.js`) spawns the **Python** Swiss Ephemeris engine in
`python_engine/` as a subprocess per request. There is no database and no long-running
Python service — persistence is JSON files under `data/`.

### Services & how to run them

- Only one long-running process: the Next.js dev server. Start it with `npm run dev`
  (http://localhost:3000, binds 0.0.0.0). See `package.json` scripts / `README.md`.
- The Python engine is not a server; it is invoked on demand. The dev server MUST know
  which interpreter has `pyswisseph`/`pytz` installed. Set
  `export ASTRO_WORLD_PYTHON="$(pwd)/python_engine/.venv/bin/python"` before `npm run dev`,
  otherwise it falls back to the system `python3` (which lacks the deps) and every chart
  request fails with HTTP 500/504.
- For dev without auth friction, export `AUTH_BYPASS_OTP=true` and
  `NEXT_PUBLIC_GUEST_ACCESS=true` (see `.env.example`). Guest access opens the chart form
  directly with no login.

### Non-obvious gotchas

- The Python engine is built from source: `pyswisseph` compiles C, so the VM needs
  `python3-venv`, `python3-dev`, and `build-essential`. These are already installed in the
  environment snapshot; if a fresh box errors on `python3 -m venv` or with
  `fatal error: Python.h`, reinstall them via apt.
- `calculate.py` and other engines read JSON from stdin expecting split fields
  (`year`, `month`, `day`, `hour`, `minute`, plus `tz_name` or numeric `tz_offset`), NOT a
  combined `date`/`time` string. The Next.js API forwards the request body as-is.
- `package.json` name is `nextjs-mongo-template` and lists `mongodb`, but MongoDB is unused
  leftover template code — no DB server is needed.
- Real user/birth data under `data/` is git-ignored (PII). Run `node scripts/seed-data.mjs`
  to populate anonymized fixtures (seeded users use OTP `123456`).

### Lint / test / build

- Tests: `npm test` (runs `node tests/auth.test.mjs`). There is no configured lint script
  and no ESLint config in the repo.
- Build: `npm run build` (Next.js standalone output); `npm run start` to serve the build.
