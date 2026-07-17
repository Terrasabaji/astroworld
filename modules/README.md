# Siddhanta Modules

Imported from [github.com/anilsabaji](https://github.com/anilsabaji) and integrated with the core Jyotisa-Suite engine.

| Module | Source Repo | Route | Engine |
|--------|-------------|-------|--------|
| Chart Engine | Jyotisa-Suite | `/` | `python_engine/calculate.py` (Swiss Ephemeris) |
| Jaimini | Jyotisa-Suite | `/` (Jaimini tab) | `python_engine/jaimini.py` |
| Prashna | PRASHNA | `/prashna` | KP horary (embedded) |
| Marriage Matching | Marriage-Matching | `/marriage` | JS modules + core chart API |
| Birth Time Rectification | Birth-Time-Rectification | `/btr` | `python_engine/btr/` |
| Health Screener | Astrological-Health-Screener | `/health` | JS modules + core chart API |
| Education & Career Adviser | Astrological-Education-Career-Advisor | `/adviser` | `python_engine/astro_adviser/` |

## Birth Records

Saved birth details are stored as JSON files in `data/births/` (gitignored).
API: `GET/POST /api/births`, `GET/DELETE /api/births/:id`

## API Endpoints

- `POST /api/calculate` — core chart + transit
- `POST /api/btr/rectify` — birth time rectification
- `POST /api/adviser/report` — education/career report
