# !OOPS! CUBE

A browser endless-runner with a guest-first onboarding flow, server-authoritative
scoring, quests/daily tasks with a login streak, an in-game currency (CUBES) with
a top-up stub, and bookkeeping for a possible future token (OP$) — no real
payments and no real blockchain integration are wired up yet, by design.

Visual design source: `project/OOPS CUBE.dc.html` (a Claude Design handoff bundle;
`chats/` has the original design conversation for context).

## Stack

- **Backend**: Node.js, TypeScript, Express, PostgreSQL (`pg`), Redis (`ioredis`)
- **Frontend**: React, TypeScript, Vite, React Router

## Repo layout

```
backend/   REST API — see backend/src/modules/*/router.ts for the full endpoint list
frontend/  React app — see frontend/src/screens for the 9 screens
project/   Original design mockup (reference only)
chats/     Original design conversation (reference only)
```

## Local development

Prerequisites: Node 20+, PostgreSQL 16, Redis 7 running locally.

```bash
# Backend
cd backend
cp .env.example .env        # edit DATABASE_URL/REDIS_URL/JWT secrets if needed
npm install
npm run migrate              # applies all migrations, safe to re-run
npm run dev                  # http://localhost:8080

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                  # http://localhost:5173, talks to VITE_API_URL (.env.development)
```

Create an admin account (needed for `/api/admin/*`, including manually completing
a top-up order in place of the not-yet-built payment webhook):

```bash
cd backend
npm run create-admin -- <username> <password>
```

## Tests

Backend tests are integration tests against a real Postgres + Redis (no mocks for
the DB layer). Point them at throwaway databases before running:

```bash
cd backend
createdb oops_cube_test   # once
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/oops_cube_test \
TEST_REDIS_URL=redis://localhost:6379/1 \
npm test
```

```bash
cd frontend
npm test
```

## Deployment notes

These constraints were deliberate, not accidental — keep them if you change the
build:

- One Postgres database, one Redis instance. No additional background services.
- `backend/tsconfig.json` sets `module: "CommonJS"` and nothing else module-related
  (no `moduleResolution`) — that combination is what stays stable across
  TypeScript versions. `tsconfig.build.json` extends it and excludes `tests/`, so
  test files never ship in the production build.
- If your host sets `NODE_ENV=production` during the build step, install dev
  dependencies explicitly first (`npm install --include=dev`) or the TypeScript
  compiler won't be present to run `npm run build`.
- Config files (`package.json`, `tsconfig*.json`) are kept as compact single-line
  JSON so they survive being hand-copied without depending on exact indentation.
- Run `npm run migrate` once against the production database after deploying a
  new backend version (or wire it into your deploy pipeline's release step).

## Known scope cuts (intentional, for a follow-up)

- No real payment provider: `POST /api/topup/webhook/stripe` is a stubbed 501
  with a TODO; top-up orders stay `pending` until an admin manually completes
  them via `POST /api/admin/topup-orders/:id/complete`.
- No real blockchain integration: `future_token_ledger` is pure bookkeeping.
  There is no wallet connection, no contract, no token — the UI says so.
- The streak's reward bonus multiplier is computed and shown, but not yet
  applied to actual reward crediting.
- Leaderboard's "Friends" / "Today" tabs are visual only (Global is the only
  implemented scope).
