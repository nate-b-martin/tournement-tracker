# Docker Guide - TanStack Tournament Tracker

## Overview

This guide covers running the TanStack Tournament Tracker with Docker. The setup consists of three services:

- **convex-backend** - Self-hosted Convex backend (SQLite persisted in volume)
- **frontend** - Production frontend serving SSR + static assets on port 3000
- **convex-dashboard** - Convex dashboard UI (optional, port 6791)

## Prerequisites

- Docker and Docker Compose v2+
- `.env.local` file with Clerk and Convex credentials (see `.env.local` example)

## Quick Start

### One-shot bootstrap

```bash
./scripts/docker-up.sh
```

This runs the whole flow below — `docker compose up -d`, waits for the backend to become healthy,
writes `CONVEX_SELF_HOSTED_URL` / `CONVEX_SELF_HOSTED_ADMIN_KEY` into `.env.local`, pushes the
Convex functions, and seeds the database. It is idempotent and safe to re-run; only its own two
lines in `.env.local` are rewritten. The manual steps follow for when you want to run them
individually.

### 1. Copy environment file

```bash
cp docker-compose.env.example .env
# Edit .env - INSTANCE_SECRET must be a stable random value
# Generate: openssl rand -hex 32
```

### 2. Start the Convex backend

```bash
docker compose up -d convex-backend
# Wait for it to be healthy: docker compose ps
# Log admin key: docker compose exec convex-backend ./generate_admin_key.sh
```

### 3. Start the frontend

```bash
docker compose up -d --build frontend
```

### 4. Optional: Start the Convex dashboard

```bash
docker compose up -d convex-dashboard
# Dashboard available at: http://127.0.0.1:6791
```

### 5. Access the application

Open <http://localhost:3000>

## Service Details

### convex-backend

- **Port**: 3210 (client sync), 3211 (site proxy)
- **Storage**: SQLite persisted in `data` volume at `/convex/data`
- **Admin key**: Generated via `./generate_admin_key.sh`
- **Environment variables** (from `.env`):
  - `INSTANCE_SECRET` - Must remain stable across restarts
  - `INSTANCE_NAME` - Default: `tournament-tracker`
  - `CONVEX_CLOUD_ORIGIN` - `http://127.0.0.1:3210`
  - `CONVEX_SITE_ORIGIN` - `http://127.0.0.1:3211`

### frontend

- **Port**: 3000
- **Build args** (from `.env` or docker-compose.yml):
  - `VITE_CONVEX_URL` - Must be host-reachable (`http://localhost:3210`), NOT the compose service name
  - `VITE_CLERK_PUBLISHABLE_KEY`
- **Runtime env** (not baked into image):
  - `CONVEX_SSR_URL` - Default: `http://convex-backend:3210` (safe inside container)

### convex-dashboard

- **Port**: 6791 (host: 127.0.0.1)
- **Purpose**: Convex dashboard for querying/mutations
- **Login**: Use admin key generated from convex-backend container

## Environment Configuration

### `.env` file (next to `docker-compose.yml`)

Copy from `docker-compose.env.example` and customize:

```bash
cp docker-compose.env.example .env
```

**Required**: Set `INSTANCE_SECRET` to a stable random value (32 hex characters minimum). This must not change across restarts or admin keys become invalid.

**Frontend build args** (in `docker-compose.yml`):

```yaml
# These are build args baked into the frontend image at build time
VITE_CONVEX_URL: http://localhost:3210  # MUST be host-reachable
VITE_CLERK_PUBLISHABLE_KEY: pk_test_...
```

**Frontend runtime env** (set in `docker-compose.yml`, not baked into image):

```yaml
CONVEX_SSR_URL: http://convex-backend:3210  # Service name works inside container
```

### Important: VITE_* vs CONVEX_SSR_URL

| Variable | When resolved | Value format | Who resolves it |
|----------|--------------|--------------|-----------------|
| `VITE_CONVEX_URL` | At **build time** | `http://localhost:3210` | Browser (host, not compose network) |
| `CONVEX_SSR_URL` | At **runtime** | `http://convex-backend:3210` | SSR inside container |

**Changing `VITE_CONVEX_URL`**: Requires `docker compose build frontend` then `docker compose up -d frontend`. A restart is NOT enough because the value is baked into the image.

**Changing `CONVEX_SSR_URL`**: A restart (`docker compose up -d frontend`) is sufficient since it's read from `process.env` at runtime.

## Development Workflow

### Local Docker Development

```bash
# Start just the backend
docker compose up -d convex-backend

# Start frontend + backend
docker compose up -d --build

# View logs
docker compose logs -f convex-backend
docker compose logs -f frontend
```

### Switching between Docker and local Convex dev

**Never run both simultaneously** — both the Docker backend and `bunx convex dev` bind port 3210 and use separate data stores.

- To use local `bunx convex dev`: `docker compose down`
- To use Docker backend: `docker compose up -d convex-backend`

## Production Deployment

### Build and start

```bash
docker compose up -d --build          # Build + start all services
docker compose up -d convex-dashboard # Optional dashboard
```

### Rolling updates

When updating environment variables that affect the frontend build:

```bash
# Rebuild frontend with new VITE_CONVEX_URL
docker compose build frontend
docker compose up -d frontend
```

### Backups

SQLite data is in the `data` volume. To backup:

```bash
docker compose down
docker run --rm -v tournament-tracker_data:/data alpine tar czf /backup/convex-data.tar.gz -C /data .
# Or use docker volume cp:
docker volume cp tournament-tracker_data:/convex/data ./data-backup/
docker compose up -d
```

## Admin Key Management

### Generate admin key

```bash
docker compose exec convex-backend ./generate_admin_key.sh
```

**Important**: Each run issues a **new** key. Previously issued keys continue to work across restarts as long as `INSTANCE_NAME` and `INSTANCE_SECRET` remain unchanged.

### Key validity

- Admin keys are derived from `INSTANCE_NAME` + `INSTANCE_SECRET`
- Changing `INSTANCE_SECRET` invalidates ALL existing keys
- Changing `INSTANCE_NAME` also invalidates existing keys
- Keep `INSTANCE_SECRET` stable across deployments

## Troubleshooting

### Convex backend won't start

```bash
# Check logs
docker compose logs convex-backend

# Check health
docker compose ps

# Reset data (WARNING: loses all data)
docker compose down -v
docker compose up -d convex-backend
```

### Frontend can't reach Convex

Verify `VITE_CONVEX_URL` in `.env` is `http://localhost:3210`, not `http://convex-backend:3210`. The browser must reach it from the host.

### Dashboard connection issues

Ensure `NEXT_PUBLIC_DEPLOYMENT_URL` in `.env` points to the correct Convex origin (usually `http://127.0.0.1:3210`).

### Port conflicts

If port 3000 or 3210 is already in use:
- Modify `docker-compose.yml` port mappings
- Or stop the conflicting service

## Volume Reference

| Volume | Path inside container | Purpose |
|--------|----------------------|---------|
| `data` | `/convex/data` | SQLite database persistence |

## Development Tips

1. **Hot reload**: Frontend changes require `docker compose build frontend` + restart for VITE_* changes. Non-VITE code changes auto-reload via Docker volume mounts... wait, actually the current Dockerfile builds everything inside the image. Let me check if there's volume mounting.

Looking at the current `docker-compose.yml`, the frontend service only has `build:` and `depends_on:` — no volume mounts for development. This is intentional for production builds. For development, you'd need to add volume mounts.

2. **Convex functions**: Backend functions are defined in `convex/`. They're picked up by the Convex backend at runtime. No need to rebuild the backend image for function changes.

3. **Admin key persistence**: The generated admin key is stored in Convex's internal key storage. It persists as long as `INSTANCE_SECRET` doesn't change.

## References

- [Convex Docs](https://docs.convex.dev)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Clerk Docs](https://clerk.com/docs)
- [TanStack Start](https://tanstack.com/router)