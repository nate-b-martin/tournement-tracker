# SH-01: Docker Compose with Convex Backend + Dashboard

## Overview
Create a local `docker-compose.yml` that runs the Convex backend and dashboard using official Docker images. This is the foundation for all subsequent phases.

## Prerequisites
- Docker and Docker Compose v2+ installed
- Convex project exists with schema in `convex/schema.ts`

## Implementation Steps

### Step 1: Create `docker-compose.yml` at repo root

```yaml
services:
  convex-backend:
    image: ghcr.io/get-convex/convex-backend:latest
    ports:
      - "3210:3210"   # Convex API
      - "3211:3211"   # HTTP Actions
    volumes:
      - convex-data:/convex/data
    environment:
      - CONVEX_CLOUD_ORIGIN=http://127.0.0.1:3210
      - CONVEX_SITE_ORIGIN=http://127.0.0.1:3211
      - INSTANCE_SECRET=${INSTANCE_SECRET:-dev-secret-change-in-production}
      - RUST_LOG=info
    healthcheck:
      test: curl -f http://localhost:3210/version
      interval: 5s
      start_period: 10s

  convex-dashboard:
    image: ghcr.io/get-convex/convex-dashboard:latest
    ports:
      - "6791:6791"
    environment:
      - NEXT_PUBLIC_DEPLOYMENT_URL=http://127.0.0.1:3210
    depends_on:
      convex-backend:
        condition: service_healthy

volumes:
  convex-data:
```

### Step 2: Create `.env.example` for local development

```bash
# Local development - self-hosted Convex
INSTANCE_SECRET=dev-secret-change-in-production
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
# CONVEX_SELF_HOSTED_ADMIN_KEY=  # Generated after startup
```

### Step 3: Add npm scripts to `package.json`

```json
{
  "scripts": {
    "convex:up": "docker compose up -d",
    "convex:down": "docker compose down",
    "convex:logs": "docker compose logs -f convex-backend",
    "convex:admin-key": "docker compose exec convex-backend ./generate_admin_key.sh",
    "convex:dashboard": "docker run --rm -e NEXT_PUBLIC_DEPLOYMENT_URL=http://127.0.0.1:3210 -p 6791:6791 ghcr.io/get-convex/convex-dashboard:latest"
  }
}
```

### Step 4: Add `.gitignore` entries

```
# Self-hosted Convex local data
convex-data/
*.key
.env.local
```

## Acceptance Criteria

- [ ] `npm run convex:up` starts backend and dashboard successfully
- [ ] Backend health check passes (`curl http://127.0.0.1:3210/version` returns JSON)
- [ ] Dashboard accessible at `http://localhost:6791`
- [ ] Backend logs show "SQLite database initialized" or similar
- [ ] `npm run convex:down` stops all containers cleanly
- [ ] Data persists in `convex-data/` volume across restarts

## Edge Cases

- Port conflicts (3210, 3211, 6791) — document in README
- Windows line endings in generated admin key — handle in key generation script
- First startup takes 10-15s for SQLite initialization

## Related Files

### New Files
- `docker-compose.yml`
- `.env.example`

### Modified Files
- `package.json` (add scripts)
- `.gitignore` (add entries)

## Testing

- Run `npm run convex:up && sleep 15 && curl http://127.0.0.1:3210/version`
- Verify dashboard loads at http://localhost:6791
- Verify `npm run convex:down` cleans up