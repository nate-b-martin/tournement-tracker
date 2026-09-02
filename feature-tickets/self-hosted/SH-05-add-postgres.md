# SH-05: Add PostgreSQL Service to Docker Compose

## Overview
Extend the local `docker-compose.yml` to include a PostgreSQL 16 service and configure the Convex backend to use it instead of SQLite.

## Prerequisites
- SH-01 complete (base docker-compose works)
- SH-04 complete (local verification passed)

## Implementation Steps

### Step 1: Update `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: convex_self_hosted
      POSTGRES_USER: convex
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-convex-dev-password}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: pg_isready -U convex -d convex_self_hosted
      interval: 5s
      start_period: 10s

  convex-backend:
    image: ghcr.io/get-convex/convex-backend:latest
    ports:
      - "3210:3210"
      - "3211:3211"
    volumes:
      - convex-data:/convex/data
    environment:
      - CONVEX_CLOUD_ORIGIN=http://127.0.0.1:3210
      - CONVEX_SITE_ORIGIN=http://127.0.0.1:3211
      - INSTANCE_SECRET=${INSTANCE_SECRET:-dev-secret-change-in-production}
      - POSTGRES_URL=postgresql://convex:${POSTGRES_PASSWORD:-convex-dev-password}@postgres:5432
      - DO_NOT_REQUIRE_SSL=1
      - RUST_LOG=info
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: curl -f http://localhost:3210/version
      interval: 5s
      start_period: 15s

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
  postgres-data:
```

### Step 2: Update `.env.example`

```bash
# Local development - self-hosted Convex with PostgreSQL
INSTANCE_SECRET=dev-secret-change-in-production
POSTGRES_PASSWORD=convex-dev-password
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
# CONVEX_SELF_HOSTED_ADMIN_KEY=  # Generated after startup
```

### Step 3: Test PostgreSQL connection

```bash
npm run convex:down -v  # Clean start (removes SQLite volume)
npm run convex:up
# Wait for both health checks
docker compose logs convex-backend | grep -i "postgres\|connected"
```

Should show: `Connected to Postgres` or similar

## Acceptance Criteria

- [ ] `npm run convex:up` starts postgres, backend, dashboard
- [ ] Postgres health check passes
- [ ] Backend logs confirm "Connected to Postgres"
- [ ] Dashboard accessible and functional
- [ ] Data persists in `postgres-data/` volume across restarts
- [ ] `npm run convex:down -v` cleans both volumes

## Edge Cases

- Postgres startup slower than SQLite — increased `start_period`
- Port 5432 conflict — document alternative in README
- Password with special chars — use proper escaping in POSTGRES_URL

## Related Files

### Modified Files
- `docker-compose.yml` (add postgres service, configure POSTGRES_URL)
- `.env.example` (add POSTGRES_PASSWORD)

### New Files
- None

## Testing

- `npm run convex:up && sleep 20 && curl http://127.0.0.1:3210/version`
- Verify backend logs show Postgres connection
- Run `npm run dev` and verify app works
- Restart: `npm run convex:down && npm run convex:up` — data persists