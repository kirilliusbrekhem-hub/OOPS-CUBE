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

## One-click deploy (Render)

`render.yaml` at the repo root is a Render Blueprint: it provisions one free
Postgres database, one free Redis instance, the backend as a web service, and
the frontend as a static site, wired together automatically.

1. Click **[Deploy to Render](https://render.com/deploy?repo=https://github.com/kirilliusbrekhem-hub/OOPS-CUBE)**
   (needs a free Render account — no card required for the free tier).
2. Render provisions all four resources and builds them. First build takes a
   few minutes.
3. **If the frontend can't reach the API** (the one cross-service link Render's
   blueprint format doesn't always resolve automatically): open the
   `oops-cube-backend` service, copy its URL from the top of its dashboard page
   (looks like `https://oops-cube-backend-xxxx.onrender.com`), then open
   `oops-cube-frontend` → Environment, set `VITE_API_URL` to that exact URL,
   and trigger **Manual Deploy → Deploy latest commit** on the frontend so it
   rebuilds with it.
4. Create an admin account by opening a Shell on the `oops-cube-backend`
   service (Render dashboard → Shell tab) and running
   `npm run create-admin -- <username> <password>`.

Free-tier notes: the free web service spins down after inactivity, so the
first request after a quiet period takes a few extra seconds to wake it back
up — that's expected, not a bug. Render's free-tier limits (database expiry,
etc.) are Render's to set and may have changed since this was written; check
their current pricing page if anything here looks off.

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

## Cube skins

Cosmetic recolors of the isometric cube mark — no new art assets, just
different `top_color`/`left_color`/`right_color` values (`cube_skins` table,
seeded with Classic/free, Plasma/Glacier/Ember/Void priced in CUBES). The
equipped skin is what jumps in Run and appears on the Result screen —
`GET/POST /api/skins`, picker at `/skins`.

## Anti-abuse: guest signup rate limiting

`POST /api/auth/guest` is capped per IP (`GUEST_SIGNUPS_PER_IP_PER_DAY`,
default 3/day) via the same Redis rate limiter used elsewhere. This deters
casual multi-accounting from one device/network — it is **not** a hard
one-account-per-human guarantee (shared IPs legitimately host multiple real
players; a determined abuser can rotate networks). A real guarantee needs
phone/ID verification, which is a separate, bigger feature. Requires
`app.set('trust proxy', true)` (already set) so `req.ip` reflects the real
client behind Render's load balancer, not the proxy's own address.

## Known scope cuts (intentional, for a follow-up)

- No real payment provider: `POST /api/topup/webhook/stripe` is a stubbed 501
  with a TODO; top-up orders stay `pending` until an admin manually completes
  them via `POST /api/admin/topup-orders/:id/complete`. Wiring up a real one
  (e.g. ЮKassa/CloudPayments for RUB, Stripe for international cards) needs
  that provider's own account and API keys — ask the owner of this repo.
- No real blockchain integration: `future_token_ledger` is pure bookkeeping.
  There is no wallet connection, no contract, no token — the UI says so.
  **Never add a real wallet private key or seed phrase to this codebase or
  its environment variables** — a compromised MVP-quality deploy with a
  funded hot wallet is a direct path to real fund theft. If real TON
  functionality is wanted later: TonConnect (the player's own wallet signs
  its own transactions — safe, no key custody) for wallet display, and
  read-only on-chain balance watching for donations, are the safe pieces to
  build first; automated payouts need a hardened, separately-funded hot
  wallet with a real security review, not a quick addition.
- The streak's reward bonus multiplier is computed and shown, but not yet
  applied to actual reward crediting.
- Leaderboard's "Friends" / "Today" tabs are visual only (Global is the only
  implemented scope).
