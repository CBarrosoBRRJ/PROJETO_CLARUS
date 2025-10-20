## Quick orientation for AI coding agents

This repo is a small monorepo for the Clarus SaaS (backend: FastAPI + SQLModel; frontend: React + Vite). The goal of this document is to give targeted, actionable instructions so an AI agent can be immediately productive.

Keep guidance short and concrete. When making code changes prefer minimal, reversible edits and run quick validation (import checks / build) after edits.

Key locations
- `apps/api/` — Python FastAPI app. Entry: `apps/api/app/main.py`. DB helpers: `apps/api/app/core/db.py`. Settings: `apps/api/app/core/settings.py`. Routes: `apps/api/app/routes/*.py` (auth, access, contact, users).
- `apps/web/` — Frontend (Vite + React). Entry: `apps/web/src/main.tsx`. Routes: `apps/web/src/routes.tsx`. API client helpers: `apps/web/src/lib/api.ts` and `apps/web/src/lib/auth.ts`.
- `infra/` — docker-compose, nginx and infra scripts used for local dev: `infra/docker-compose.yml`, `infra/nginx.conf`.
- CI: `.github/workflows/ci.yml` — shows how the project is built in CI (Python install + node build + docker build).

Big-picture architecture (concise)
- Single-repo monorepo with two services packaged via Docker: `api` (Python) and `web` (static SPA served by nginx). The SPA proxies `/api/` to the API (see `infra/nginx.conf`).
- Local dev is primarily Docker-driven. The README recommends copying `.env.example` -> `.env` and running `docker compose -f infra\docker-compose.yml up --build` from the repo root.

Important developer workflows (explicit commands)
- Dev (Docker):
  - Copy `.env.example` to `.env` and fill values.
  - Start local stack: `docker compose -f infra\docker-compose.yml up --build` (runs Postgres, API, Web and a chroma service).
- Run API checks locally (without Docker):
  - From `apps/api`: `python -m pip install -r requirements.txt` then `python -c "import fastapi, sqlmodel; print('ok')"` (CI does a similar sanity check).
- Run Web build locally:
  - From `apps/web`: `npm install` (or `npm ci` if you have lockfile) and `npm run build` (Vite). CI sets env `VITE_API_BASE` when building.
- Running CI steps are encoded in `.github/workflows/ci.yml` and include building Docker images for both services as a smoke test.

Project-specific patterns and conventions
- Mixing DB access styles: the codebase contains two patterns for DB access:
  - Raw psycopg2 helpers in `apps/api/app/core/db.py` (fetchone/fetchall/execute). These normalise DATABASE_URL and print diagnostics.
  - SQLModel declarative models and `Session(engine)` usage in `apps/api/app/routes/users.py` (ORM style). When adding new database code, prefer SQLModel/Session for model-backed endpoints; use `core/db.py` helpers for simple read-only or legacy queries.
- Authentication & sessions:
  - The frontend relies on an HTTP-only cookie named `session` set by the API. Login is implemented at `/api/auth/login` which sets the cookie and returns a JSON redirect.
  - Frontend helpers check `document.cookie` for `session=` (see `apps/web/src/lib/auth.ts`) and use `credentials: "include"` for fetches in the login page.
- Password and token utilities:
  - Password hashing/verification uses `passlib` (see `apps/api/app/auth/utils.py` and `service.py`). There are legacy-tolerant verifiers (multiple schemes). Tests/code changes touching auth should use the existing helpers.
- Error handling conventions in frontend:
  - The UI attempts to parse error JSON and surface `detail` from FastAPI responses (see `apps/web/src/pages/login/index.tsx` jfetch helper).

Integration points and external dependencies
- Postgres: Provided by `infra/docker-compose.yml`. Env vars seen in compose: `DATABASE_URL`, `DB_URL`, `SQLALCHEMY_DATABASE_URI`, `POSTGRES_*`.
- Chroma: a container `clarus/chroma:0.5.4` is included in compose (likely for embeddings/search). Treat this as optional unless editing infra.
- Nginx: SPA served by nginx; nginx proxies `/api/` to `api:8000`. When implementing API endpoints, keep the `/api/` prefix in mind if testing via the SPA container.

Small examples to copy/paste when editing
- Add router in API: register a new route module by editing `apps/api/app/main.py` and `app.include_router(...)` (see current includes for `auth`, `access`, `contact`).
- Calling DB helper: `from ..core.db import fetchone; u = fetchone("SELECT * FROM users WHERE email=%s", (email,))`
- Frontend fetch to API (handles JSON detail): use the `jfetch` pattern from `apps/web/src/pages/login/index.tsx` — include `credentials: "include"` when calls require cookies.

Quality gates for automated edits
- After making changes to Python files run: `python -m pip install -r apps/api/requirements.txt` then run `python -c "import fastapi, sqlmodel"` or run a small import to ensure no missing deps.
- After frontend edits run `npm ci` (or `npm install`) in `apps/web` and `npm run build` to catch TypeScript/Vite issues.
- CI also performs Docker builds as a smoke test; local edits that break Docker builds will fail CI.

Conservative edit policy for AI agents
- Prefer small, focused edits. Avoid wide refactors. If a larger refactor is required, first propose a plan with affected files and migration steps (DB migrations, API contract changes, frontend updates).
- Respect existing environment variable patterns (see `apps/api/app/core/settings.py` and `infra/docker-compose.yml`) when adding config.

What to ask the human
- If a change touches auth, DB schema, or the Docker/infra stack, ask for confirmation before applying.
- If secrets or production JWT secrets are needed, refuse to add them and instead request secure secret injection guidance.

Files to reference when uncertain
- `apps/api/app/main.py`, `apps/api/app/core/db.py`, `apps/api/app/core/settings.py`
- `apps/api/app/routes/*.py` (auth, users, access, contact)
- `apps/web/src/main.tsx`, `apps/web/src/pages/login/index.tsx`, `apps/web/src/lib/api.ts`
- `infra/docker-compose.yml`, `infra/nginx.conf`, `apps/*/Dockerfile`

If you update this document: preserve the short examples and the command snippets under "Important developer workflows".

---
Please review this draft and tell me if you'd like a different focus (more infra details, testing instructions, or API contract examples). I'll iterate.
