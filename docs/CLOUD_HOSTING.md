# Cloud hosting — team access & testing

Astro World needs **Node.js** and a **Python** Swiss Ephemeris engine in the
same runtime. Use the Docker image (or Render blueprint) so teammates get a
single public URL without installing local toolchains.

## Option A — Render (recommended public URL)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Terrasabaji/astroworld)

Or manually:

1. Open [Render Blueprints](https://dashboard.render.com/blueprints).
2. Connect the `Terrasabaji/astroworld` GitHub repo.
3. Select `render.yaml` and create the blueprint.
4. Wait for the first deploy. The service URL looks like:
   `https://astroworld-<suffix>.onrender.com`
5. Share that URL with the team. Health check: `GET /api/health`.

Demo defaults from the blueprint:

| Variable | Value | Purpose |
| --- | --- | --- |
| `AUTH_BYPASS_OTP` | `true` | Any OTP accepted (OTP email/SMS is not wired) |
| `AUTH_SECRET` | auto-generated | Token signing |
| `ASTRO_WORLD_PYTHON` | venv python in image | Calculation engine |

Free Render web services spin down after idle time; the first request after a
pause can take ~30–60s to wake.

## Option B — Docker Compose (any VM / laptop)

```bash
docker compose up --build
# → http://localhost:3000
```

Override secrets with a `.env` next to `docker-compose.yml`:

```env
AUTH_SECRET=replace-with-a-long-random-string
AUTH_BYPASS_OTP=true
PORT=3000
```

## Option C — Prebuilt GHCR image

After `main` builds the publish workflow:

```bash
docker pull ghcr.io/terrasabaji/astroworld:latest
docker run --rm -p 3000:3000 \
  -e AUTH_SECRET=replace-me \
  -e AUTH_BYPASS_OTP=true \
  ghcr.io/terrasabaji/astroworld:latest
```

## Option D — Cursor Cloud agents (dev / QA)

This repo includes `.cursor/environment.json`. Cursor Cloud agents install
deps, seed sample data, and start `npm run dev` on port 3000. Teammates can
open the agent desktop / port-forwarded `localhost:3000` to click through flows.

## What the image includes

- Next.js production standalone server
- Python 3 venv with `pyswisseph` + `pytz`
- Swiss Ephemeris files from `ephe/`
- Anonymized seed users/births (`node scripts/seed-data.mjs`)

Seeded demo OTP (when bypass is off): `123456`.

## Production checklist

- Set a strong `AUTH_SECRET`
- Set `AUTH_BYPASS_OTP=false` only after real OTP delivery is integrated
- Restrict `CORS_ORIGINS` to your real domain(s)
- Do not commit real `data/users` or `data/births` (PII)
