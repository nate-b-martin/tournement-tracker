# Ticket 01: Docker Compose — Self-Hosted Convex Backend (SQLite)

## Overview

Add a `docker-compose.yml` at the repo root that runs the self-hosted Convex backend (`ghcr.io/get-convex/convex-backend`) with **SQLite** storage in a Docker volume, plus an optional Convex dashboard container bound to localhost. No Postgres service. This is the foundation the frontend container and the CLI push tooling connect to.

## Current State

- No Docker files exist in the repo.
- Convex runs either via `npx convex dev` (local, port 3210) or against the cloud (`convex.cloud`).
- The project deploys to Netlify today (`netlify.toml`), which is cloud-based.

## Prerequisites

- [x] Docker + Docker Compose installed on the dev machine
- [x] Master plan (`feature-tickets/self-hosting/00-master-plan.md`) read

## Implementation Steps

### Step 1: Add `docker-compose.yml`

Base it on the official self-hosted compose file (https://github.com/get-convex/convex-backend/blob/main/self-hosted/docker/docker-compose.yml), tailored for this repo:

```yaml
services:
  convex-backend:
    # Pin to a specific release revision for reproducible upgrades, e.g.
    # image: ghcr.io/get-convex/convex-backend:v1.xx.x
    image: ghcr.io/get-convex/convex-backend:latest
    stop_grace_period: 10s
    stop_signal: SIGINT
    ports:
      - "3210:3210"    # client sync
      - "3211:3211"    # site proxy (HTTP actions, JWKS)
    volumes:
      - data:/convex/data
    environment:
      - CONVEX_CLOUD_ORIGIN=${CONVEX_CLOUD_ORIGIN:-http://127.0.0.1:3210}
      - CONVEX_SITE_ORIGIN=${CONVEX_SITE_ORIGIN:-http://127.0.0.1:3211}
      - INSTANCE_NAME=tournament-tracker
      - INSTANCE_SECRET=${INSTANCE_SECRET:-changeme-dev-secret}
      - RUST_LOG=${RUST_LOG:-info}
      - DISABLE_METRICS_ENDPOINT=true
    healthcheck:
      test: curl -f http://localhost:3210/version
      interval: 5s
      start_period: 10s

  convex-dashboard:
    image: ghcr.io/get-convex/convex-dashboard:latest
    stop_grace_period: 10s
    stop_signal: SIGINT
    ports:
      - "127.0.0.1:6791:6791"
    environment:
      - NEXT_PUBLIC_DEPLOYMENT_URL=${NEXT_PUBLIC_DEPLOYMENT_URL:-http://127.0.0.1:3210}
    depends_on:
      convex-backend:
        condition: service_healthy

volumes:
  data:
```

Notes:

- **Do NOT set `DATABASE_URL` / `POSTGRES_URL` / `MYSQL_URL`** — SQLite in the `data` volume is the confirmed storage choice. The backend creates a `convex_self_hosted` SQLite DB automatically.
- `INSTANCE_SECRET` must be stable across restarts; it is used to derive admin keys. Provide via a `.env` file beside compose or compose interpolation variables (see Step 2) so it is not committed.
- `INSTANCE_NAME` should be stable too.
- Keep `convex-dashboard` bound to `127.0.0.1` only (never exposed publicly without auth).
- The official compose file exposes more env knobs (timeouts, S3, concurrency). Only include what this project needs; extra knobs can be added later.

### Step 2: Support env file

Create `docker-compose.env.example` (or reuse `.env.example` from ticket `04`) documenting:

```
INSTANCE_SECRET=<random-hash>
CONVEX_CLOUD_ORIGIN=http://127.0.0.1:3210
CONVEX_SITE_ORIGIN=http://127.0.0.1:3211
```

Instruct: copy to `.env` beside compose (in `.gitignore`) before `docker compose up`. The compose file can read these automatically.

### Step 3: Verify backend boots

```bash
docker compose up -d convex-backend
docker compose ps           # expect healthy
curl http://localhost:3210/version
docker compose exec convex-backend ls /convex/data   # SQLite DB created
```

### Step 4: Verify admin key generation

```bash
docker compose exec convex-backend ./generate_admin_key.sh
```

This prints an admin key derived from `INSTANCE_NAME` + `INSTANCE_SECRET`. Confirm it is stable across container restarts (same values → same key). Used by ticket `03`.

### Step 5: Verify the dashboard

```bash
docker compose up -d convex-dashboard
# open http://127.0.0.1:6791 → log in with the admin key from Step 4
```

## Acceptance Criteria

- [ ] `docker-compose.yml` at repo root with `convex-backend` + optional `convex-dashboard`
- [ ] SQLite storage confirmed (no `DATABASE_URL`/`POSTGRES_URL` set), persisted via the `data` volume
- [ ] `INSTANCE_NAME` + `INSTANCE_SECRET` configurable via env file, not committed to git
- [ ] `docker compose ps` reports `convex-backend` as `healthy`
- [ ] `curl http://localhost:3210/version` returns 200
- [ ] `./generate_admin_key.sh` produces a stable, usable admin key
- [ ] Dashboard reachable at `http://127.0.0.1:6791` and logs in with the admin key
- [ ] README documents the one-backend-at-a-time rule (see ticket `04`) if possible here, otherwise ticket `04` handles it

## Testing Considerations

- Restart the stack (`docker compose restart convex-backend`) and confirm the admin key does not change.
- Stop the stack, `docker compose up -d` again, confirm seed data (when seeded later) survives the volume.
- Confirm no ports conflict with a running local `npx convex dev` (both use 3210 — the README must warn against running both).

## Related Files

- `docker-compose.yml` — NEW
- `docker-compose.env.example` — NEW (or fold into `.env.example`, ticket 04)
- `.gitignore` — add local compose `.env`
- `README.md` — cross-referenced from ticket `04`

## Helpful Resources

- https://github.com/get-convex/convex-backend/tree/main/self-hosted (README + official `docker-compose.yml`)
- https://stack.convex.dev/self-hosted-develop-and-deploy

## Notes

- Pin the image tag before deploying anywhere persistent; `:latest` is fine for local experimentation but upgrades require running backend migrations (see ticket `04`).
- SQLite-in-volume is the single-node default; scale-out and Postgres are deliberately out of scope.