# AGENTS.md

## Cursor Cloud specific instructions

Astro World is a **Next.js 15 (App Router, JavaScript)** web app whose API
(`app/api/[[...path]]/route.js`) spawns a **Python** Swiss Ephemeris engine
(`python_engine/`) as a subprocess per request. There is no database (the
`mongodb` dependency and `nextjs-mongo-template` name are vestigial); user/birth
data is stored as JSON files under `data/`.

### Services

- **Next.js dev server** (`npm run dev`, port 3000, binds `0.0.0.0`) — the only
  long-running service. Serves both the UI and the API.
- **Python engine** — not a service; invoked on demand by the API. The venv
  lives at `python_engine/.venv` (created by the update script).

### Running the app (critical caveat)

The API resolves its Python interpreter from `ASTRO_WORLD_PYTHON` (then
`SIDDHANTA_PYTHON`, then system `python3`). System `python3` does **not** have
`pyswisseph`/`pytz` — only the venv does. So you **must** point the dev server at
the venv, or every calculation (chart, yoga/dosha, muhurta, prashna, etc.) fails:

```bash
export ASTRO_WORLD_PYTHON="$(pwd)/python_engine/.venv/bin/python"
npm run dev
```

Set `AUTH_BYPASS_OTP=true` (dev) so any OTP is accepted; OTP delivery is only a
console-log stub. Optionally `node scripts/seed-data.mjs` seeds sample
users/births (seeded OTP `123456`). See `README.md` and `.env.example` for the
full list of optional env vars.

### Non-obvious gotchas

- In Next.js **dev mode**, the first request that hits a route often triggers
  on-demand compilation; the very first chart submit can occasionally throw a
  transient `Loading chunk ... failed` (ChunkLoadError). A page refresh + retry
  clears it. Not a setup problem.
- City autocomplete (`/api/cities`) may return no matches for some queries; the
  chart form still works using the latitude/longitude already in the form.

### Lint / test / build

- Tests: `npm test` (runs `node tests/auth.test.mjs`). There is no separate lint
  script configured.
- Build: `npm run build` then `npm run start` (production). Use `npm run dev` for
  development.
