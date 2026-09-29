# Ticket 16: Full Verification Runbook

## Overview

A single end-to-end runbook (script + checklist) that verifies the whole self-hosting + Convex Auth migration works on a fresh machine from scratch: Docker stack boots, events sync, auth issues and accepts JWTs, seed populates admin/spectator, E2E and unit suites pass without a single Clerk secret.

## Prerequisites

- [x] All of tickets `01`–`15` implemented
- [x] Empty `~/.convex` store (fresh local state) and/or empty Docker volume (fresh start)

## Implementation Steps

### Step 0: Clean slate

```bash
docker compose down -v   # wipe volumes if present
rm -rf playwright/.auth node_modules/.cache
```

### Step 1: Boot the stack (ticket `01`/`03`)

```bash
bash scripts/docker-up.sh
```

Expected:
- Backend healthy: `docker compose ps` shows `convex-backend` healthy.
- CLI wired: `npx convex dev --once` (or `npx convex push`) succeeds against `VITE_CONVEX_URL=http://localhost:3210`.
- Env set: `JWT_PRIVATE_KEY` + `JWKS` verifiable (`npx convex env list`), plus `SITE_ADMIN_PASSWORD`-style seed vars if used.

### Step 2: OIDC/JWKS checks (ticket `05`)

```bash
curl -fsS http://localhost:3211/.well-known/openid-configuration   # jwks_uri == /facts.jwks or /jwks.json
curl -fsS http://localhost:3211/.well-known/jwks.json
```

Both must return JSON.

### Step 3: Seed (ticket `07`)

```bash
npx convex run seed
npx convex run seed   # rerun → idempotent, no dup accounts
```

Then sanity-check by signing in via the UI on `http://localhost:3000`:
- `admin@example.com` → admin role visible; can create data.
- `spectator@example.com` → read-only view.

### Step 4: Unit + build (tickets `09`, `12`, `11`)

```bash
npm run check
npm run test
npm run build
```

All green; no Clerk imports (`rg -n -i clerk src convex tests/unit package.json` → 0).

### Step 5: E2E (tickets `13`, `14`, `15`)

With dev server running (`npm run dev` on :3000):

```bash
npm run test:e2e
```

Expected: global-setup form-signs-in as seeded admin (fresh storage state), all specs incl. `admin.spec.ts` + `spectator.spec.ts` and the sign-out spec pass.

### Step 6: Dockerized frontend (ticket `02`)

```bash
# separate terminal: never run the Docker backend simultaneously with `npx convex dev`
docker compose down
docker build -f Dockerfile . -t tt-frontend
docker run -p 8080:3000 tt-frontend
# browse http://localhost:8080 → sign in as admin @ localhost:8080 too
```

### Step 7: CI (ticket `15`)

Push the branch with zero repo secrets set; confirm the workflow:
- Build + lint + unit pass
- Local Convex + seed starts
- E2E signs in via the form (no Clerk secret required)

### Final checklist

- [ ] Docker stack boots from `.env.example` on a fresh machine
- [ ] `connect-src` CSP permits `localhost:3210/3211` (ticket `04`); no Clerk origins
- [ ] JWKS served by the backend at `:3211`
- [ ] Seed idempotent; admin + spectator accounts sign in
- [ ] `npm run check` / `test` / `build` green
- [ ] `npm run test:e2e` green (admin CRUD + spectator read-only)
- [ ] Built frontend image serves the app (SSR + auth working from server-rendered origin)
- [ ] CI green with no secrets
- [ ] `AGENTS.md` + README updated (ticket `11`); `.env.example` documents remaining vars

## Acceptance Criteria

- [ ] The runbook is executable as a single copy-paste sequence on a fresh checkout
- [ ] Every step has explicit pass/fail criteria
- [ ] No step requires a Clerk account, key, or hosted page

## Testing Considerations

- Run the entire sequence against **both** backends (Docker volume and local `~/.convex`) — they should behave identically.
- Note any step that requires a human decision (e.g. `INSTANCE_SECRET` vs stable admin key in `docker-up.sh`) and make it prompt-driven.
- If a step fails, the runbook should point at the originating ticket (not require detective work).

## Related Files

- `scripts/docker-up.sh`
- `docker-compose.yml`, `Dockerfile`, `.env.example`
- `convex/seed.ts`
- `tests/e2e/global-setup.ts`
- `.github/workflows/ci.yml`

## Helpful Resources

- n/a (orchestration of prior tickets)

## Notes

- This ticket is the arbiter of "done" for the whole self-hosting migration: if every earlier ticket is truthful, this runbook passes on a clean machine with zero secrets.
- Keep it updated whenever a later step (ticket 04 env keys, seed vars, spectator creds) changes.