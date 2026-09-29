# Master Plan: Self-Hosted Docker Deployment (SQLite) + Clerk → Convex Auth

## Overview

Make Tourist Tournament Tracker fully runnable in Docker containers while minimizing dependencies on cloud services. The database requirement is solved by **self-hosting Convex in Docker with its default SQLite storage** — NOT by switching to raw Postgres. The remaining cloud dependency (Clerk auth) is replaced with **Convex Auth** (`@convex-dev/auth`, password provider), which runs inside the Convex backend and needs no external service.

This document is the umbrella plan. Each phase is decomposed into small, independently-shippable tickets in this directory.

## Research Findings (2026)

### 1. Convex has both a local and a self-hosted option
- `npx convex dev` runs a complete backend locally with no account (anonymous mode, data in `~/.convex`). Already used by this repo for local dev.
- Convex is officially **self-hostable via Docker** since Feb 2025:
  - Images: `ghcr.io/get-convex/convex-backend` and `ghcr.io/get-convex/convex-dashboard`
  - Data persists in a Docker volume (**SQLite by default**), or can be pointed at Postgres/MySQL via `DATABASE_URL`/`POSTGRES_URL`.
  - Reference: `get-convex/convex-backend` → `self-hosted/README.md` and `self-hosted/docker/docker-compose.yml`.

### 2. Switch to raw Postgres is NOT beneficial
- Rewriting to Postgres would require replacing every `convex/*.ts` function, the schema, all `convex/react` hooks (`useQuery`/`useMutation`), and the `@convex-dev/react-query` integration, and would lose Convex's realtime sync. The Clerk→Convex JWT bridge would need reimplementation server-side. High effort, no benefit for a single-admin app.
- Convex self-hosted already supports Postgres as its storage engine if ever needed later.

### 3. Convex Auth replaces Clerk with zero external services
- `@convex-dev/auth` (Apache-2.0, beta) runs inside Convex functions and issues its own JWTs.
- **Password provider** (`@convex-dev/auth/providers/Password`) supports email + password sign-in/sign-up — the most stable path for self-hosted (no OAuth callbacks or HTTP-route requirements to wire externally; the JWKS endpoint is served from the Convex "site" origin, port `3211`).
- Setup wizard `npx @convex-dev/auth` generates `convex/auth.ts`, `convex/http.ts`, updates `convex/auth.config.ts`, adds auth tables to the schema, and sets JWT signing env vars.
- References: `labs.convex.dev/auth/setup`, `labs.convex.dev/auth/config/passwords`, `docs.convex.dev/auth/convex-auth`.

## Decisions (Confirmed)

| Decision | Value |
|---|---|
| Database storage | Convex **SQLite** in a Docker volume (no Postgres service) |
| Auth provider | **Convex Auth Password** provider (no Clerk) |
| Admin testing | **Seed-based admin** account + RBAC users in `convex/seed.ts` |
| Sign-in UX | Modal dialog, email + password, "create account" toggle (first account → admin) |
| Local dev | Keep `npx convex dev` workflow running **in parallel** (do not delete) |

## Workflow Coexistence (Critical)

Both workflows converge on the same URL: `VITE_CONVEX_URL=http://localhost:3210`. They share `.env.local` but have **separate data stores and separate env-var state**.

- **Local dev (unchanged):** `npx convex dev` runs the backend on `:3210`, writes `VITE_CONVEX_URL` into `.env.local`, data in `~/.convex`. `npx convex env set` targets the local deployment.
- **Docker:** `scripts/docker-up.sh` sets up the containerized backend (same URL, data in the `data` volume) and writes `CONVEX_SELF_HOSTED_URL` + `CONVEX_SELF_HOSTED_ADMIN_KEY` into `.env.local`.
- **Rule:** Run one backend at a time — both bind `:3210` and hold separate data. Document this in the README (ticket `04`).
- Note: `VITE_CONVEX_URL` is **baked at build time** for the Docker image. The browser reaches Convex via the host-reachable URL, NOT the compose-internal service name.

## Implementation Order & Dependencies

```
Phase 1 (Docker infra) — tickets 01–04
   ├── 01 docker-compose backend        (provides the backend for pushing code)
   ├── 02 frontend Dockerfile           (independent)
   ├── 03 docker-up script              (depends on 01)
   └── 04 security + ops docs           (independent; README notes)

Phase 2 (Clerk → Convex Auth) — tickets 05–11
   05 convex-auth scaffold              (depends on 01 OR local `npx convex dev` for `env set`)
   06 server-side auth ids              (depends on 05)
   07 seed auth users                   (depends on 05, 06)
   08 provider swap frontend            (depends on 05)
   09 useAuth hook refactor             (depends on 08)
   10 auth UI components                (depends on 09)
   11 dependency cleanup                (depends on 08–10)

Phase 3 (Tests & CI) — tickets 12–15
   12 unit test updates                 (depends on 09, 10)
   13 e2e auth rewrite                  (depends on 07)
   14 e2e admin scenarios               (depends on 13)
   15 ci workflow update                (depends on 13)

Phase 4 (Verify) — ticket 16
   16 verification runbook              (depends on everything)
```

## File Inventory (Target State)

### Docker / Infra (new)
- `docker-compose.yml` — `convex-backend` (+ optional `convex-dashboard`), `frontend`
- `Dockerfile` — multi-stage Node 24 build → `node dist/server/server.js`
- `.dockerignore`
- `.env.example` — documented self-hosted env template
- `scripts/docker-up.sh` — one-shot bootstrap of the containerized stack

### Convex Auth (new/changed)
- `convex/auth.ts` (new) — `convexAuth({ providers: [Password] })`
- `convex/http.ts` (new) — `auth.addHttpRoutes(http)`
- `convex/auth.config.ts` (rewrite) — trust issuer = `CONVEX_SITE_URL`, `applicationID: "convex"`
- `convex/schema.ts` — add `authTables`
- `convex/seed.ts` — auth accounts for admin/spectator/organizer + updated fixture IDs
- `convex/userProfiles.ts`, `teams.ts`, `players.ts`, `games.ts`, `seasonGames.ts`, `seasons.ts`, `tournaments.ts` — `identity.subject` → `getAuthUserId(ctx)`

### Frontend (changed)
- `src/routes/__root.tsx` — `ConvexAuthProvider`
- `src/router.tsx` — shared Convex client (already exported)
- `src/hooks/useAuth.ts` — rewire to `useConvexAuth` + `useUser`
- `src/components/auth/SignInDialog.tsx`, `SignOutButton.tsx` (new)
- `src/components/AuthWidget.tsx`, `src/routes/index.tsx`, Header — replace Clerk components
- Delete: `src/integrations/convex-clerk-provider.tsx`, `src/integrations/clerk/provider.tsx`, `src/integrations/convex/provider.tsx`

### Tests / CI
- `package.json` — remove `@clerk/clerk-react`, `@clerk/testing`; add `@convex-dev/auth`, `@auth/core`
- `playwright.config.ts`, `tests/e2e/global-setup.ts`, `tests/e2e/pages/*`, unit test mocks, `.github/workflows/ci.yml`

### Env
- Remove: `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_JWT_ISSUER_DOMAIN`, `ADMIN_CLERK_*`, `CLERK_EMAIL/PASSWORD`, `CLERK_TEST_*`
- Add: `VITE_CONVEX_URL` (already), `VITE_CONVEX_SITE_URL`, `CONVEX_SELF_HOSTED_URL`, `CONVEX_SELF_HOSTED_ADMIN_KEY`, `SITE_ADMIN_EMAIL`, `SITE_ADMIN_PASSWORD`, `E2E_ADMIN_*`

## End State

- `docker compose up` + `scripts/docker-up.sh` → frontend on `:3000`, Convex backend on `:3210`/`:3211` (SQLite persisted), sign-in as seeded `admin@example.com` works.
- `npx convex dev` local workflow still works unchanged.
- No dependency on `convex.cloud` or Clerk for the containerized deployment.