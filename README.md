# Astro World

A Vedic astrology suite built with **Next.js 15** and a **Python** calculation engine
(Swiss Ephemeris). It casts birth charts and runs modules for Muhurta (electional
astrology), Yogas & Doshas analysis with strength scoring and remedies, dashas, and more.

## Requirements

- **Node.js** 18+ (LTS recommended)
- **Python** 3.10+
- Package manager: `npm` or `yarn` (this repo pins `yarn@1.22.22` via `packageManager`)

## Setup

### 1. Install JavaScript dependencies

```bash
npm install
# or
yarn install
```

### 2. Set up the Python engine

```bash
cd python_engine
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

Python dependencies:

- `pyswisseph` — Swiss Ephemeris bindings (planetary calculations)
- `pytz` — timezone handling

Ephemeris data files ship in the [`ephe/`](ephe/) folder, so no extra download is needed.

### 3. Seed sample data (optional)

Real user and birth records under `data/` are **not** tracked (they contain
PII). To populate a fresh checkout with anonymized sample fixtures so you can
exercise the auth and birth flows, run:

```bash
node scripts/seed-data.mjs
```

This copies the fixtures from [`data/seed/`](data/seed/) into `data/users/`,
`data/births/`, and writes `data/users-master.json` (only if missing/empty).
It is idempotent — existing files are left untouched. The seeded users have a
fixed OTP of `123456` (with `AUTH_BYPASS_OTP=true` any OTP is accepted in dev).

## Running the app (development)

The Next.js API spawns Python for calculations. Point it at the interpreter that has
the dependencies installed using the `ASTRO_WORLD_PYTHON` environment variable
(falls back to `SIDDHANTA_PYTHON`, then the system `python3` / `python`):

```bash
# use the venv you created above
export ASTRO_WORLD_PYTHON="$(pwd)/python_engine/.venv/bin/python"   # Windows: set ASTRO_WORLD_PYTHON=...\python_engine\.venv\Scripts\python.exe

npm run dev
```

Open http://localhost:3000.

If `ASTRO_WORLD_PYTHON` is unset, the app uses `python3` (macOS/Linux) or `python`
(Windows) from your `PATH` — make sure `pyswisseph` and `pytz` are installed there.

## Production build

```bash
npm run build
npm run start
# or, after build, the standalone server (bundles static + Python paths):
npm run start:standalone
```

## Cloud hosting (team access & testing)

The app needs Node + Python together, so cloud demos use Docker.

- **One-click public host:** connect this repo to [Render Blueprints](https://dashboard.render.com/blueprints) using [`render.yaml`](render.yaml).
- **Any machine / VM:** `docker compose up --build` → http://localhost:3000
- **Prebuilt image (after CI on `main`):** `docker pull ghcr.io/terrasabaji/astroworld:latest`

Full steps, env vars, and Cursor Cloud notes: [`docs/CLOUD_HOSTING.md`](docs/CLOUD_HOSTING.md).

## Windows packaging

A self-contained Windows package (bundled Node.js, Python, and ephemeris) can be built with:

```bash
npm run build:windows
```

See [`packaging/windows/README-WINDOWS.txt`](packaging/windows/README-WINDOWS.txt) for
install options (one-click installer `.exe`, `Setup.bat`, and portable mode).

## Project structure

```
app/                 Next.js app router pages & API routes
  api/[[...path]]/   API layer that proxies requests to the Python engine
  yoga-dosha/        Yogas & Doshas module UI
components/          Shared React components (AppShell, module shortcuts, UI kit)
lib/                 Client-side utilities (chart helpers, print/report builders)
python_engine/       Swiss Ephemeris calculation engine + analysis modules
  calculate.py               Core chart calculation
  yoga_dosha_analysis.py     Yoga/dosha detection, strength scoring, dasha activation
  remedy_catalog.py          Cited remedies catalog
  muhurta_engine.py          Electional astrology
  run_*.py                   Entry points invoked by the API
ephe/                Swiss Ephemeris data files
public/modules/      Embedded module assets
packaging/windows/   Windows build scripts and installer config
```

## Notes

- No secrets are committed. Configure any environment-specific values via environment
  variables (e.g. `ASTRO_WORLD_PYTHON`), not source files.
- Generated/downloaded folders (`node_modules/`, `.next/`, `dist/`) are not tracked;
  they are recreated by `npm install` and the build steps above.
