# AGENTS.md

## Cursor Cloud specific instructions

Astro World is a single deployable product: a **Next.js 15** app whose API routes
spawn a **Python** (Swiss Ephemeris) engine as child processes per request. There
is no database or long-running Python daemon — user/birth data persists as JSON
files under `data/`. Standard commands live in `README.md` and `package.json`
(`dev`, `build`, `start`, `test`); prefer those.

Non-obvious caveats for running/testing in this environment:

- **Python engine wiring is required for calculations.** The Next.js API resolves
  the interpreter via `ASTRO_WORLD_PYTHON`. Always export it to the project venv
  before `npm run dev`, otherwise chart/muhurta/etc. API calls fail:
  `export ASTRO_WORLD_PYTHON="/workspace/python_engine/.venv/bin/python"`.
  The update script creates this venv with `pyswisseph`/`pytz` installed.
- **Auth gate blocks the whole UI.** To exercise any module you must register +
  verify OTP. For dev, run the server with `AUTH_BYPASS_OTP=true` so any OTP is
  accepted (the register step then logs you straight in). Real OTP delivery is a
  stub that only logs the code to the server console.
- **Optional seed data:** `node scripts/seed-data.mjs` populates `data/users/` and
  `data/births/` with anonymized fixtures (seeded users use OTP `123456`). It is
  idempotent. Not required if you register a fresh account with `AUTH_BYPASS_OTP`.
- **Lint:** none configured (no ESLint/Prettier scripts or config in the repo).
- **Tests:** `npm test` runs `tests/auth.test.mjs` (Node-based auth unit tests,
  no Python needed). A stray Python pytest file exists under
  `python_engine/astro_adviser/tests/` but is not wired into `npm test` and needs
  `pytest` installed separately.
- **First dev-server load in a fresh browser may briefly show a transient
  "Loading..." / console SyntaxError while Next.js compiles; a refresh clears it.**
  This is a dev-mode HMR artifact, not an app bug — API routes return 200.
- `python_engine/btr/web/` is an optional standalone Flask UI (port 8000); Flask
  is not in `requirements.txt`. The main product does not need it.
- `mongodb` is listed in `package.json` but is unused (leftover from the template).
