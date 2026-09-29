# Ticket 03: `scripts/docker-up.sh` — Bootstrap the Dockerized Stack

## Overview

Create a one-shot Bash script that brings up the containerized stack and wires the Convex CLI to the self-hosted backend: compose up → wait for health → generate admin key → write `CONVEX_SELF_HOSTED_URL`/`CONVEX_SELF_HOSTED_ADMIN_KEY` into `.env.local` → push backend functions → seed the database.

## Current State

- Backend/frontend compose services exist (tickets `01`/`02`).
- The Convex CLI targets either the cloud deployment or a local `npx convex dev` backend. Nothing wires it to a Dockerized self-hosted backend yet.

## Prerequisites

- [x] Tickets `01` and `02` (compose + frontend image)
- [x] `.env.local` present (CLI reads it; see Step 3)

## Implementation Steps

### Step 1: Create `scripts/docker-up.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "⏳ Starting Docker stack (convex-backend, convex-dashboard, frontend)..."
docker compose up -d

# Wait for the backend healthcheck.
echo "⏳ Waiting for convex-backend to become healthy..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:3210/version >/dev/null 2>&1; then
    echo "✓ convex-backend is up"
    break
  fi
  [ "$i" -eq 60 ] && echo "✗ convex-backend did not become healthy" && exit 1
  sleep 2
done

# Generate (or reuse) the admin key. Stable because INSTANCE_NAME/INSTANCE_SECRET are stable.
ADMIN_KEY=$(docker compose exec -T convex-backend ./generate_admin_key.sh | tr -d '\r')
echo "✓ Obtained admin key"

# Make the CLI target this self-hosted backend.
ENV_LOCAL=".env.local"
sed -i.bak '/^CONVEX_SELF_HOSTED_URL=/d; /^CONVEX_SELF_HOSTED_ADMIN_KEY=/d' "$ENV_LOCAL" || true
cat >> "$ENV_LOCAL" <<EOF
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=$ADMIN_KEY
EOF
rm -f "${ENV_LOCAL}.bak"

# Push backend functions to the self-hosted deployment, then seed.
echo "⏳ Pushing Convex functions..."
npx convex dev --once        # or: npx convex push
echo "⏳ Seeding the database..."
npx convex run seed || echo "ℹ️ Seed returned non-zero (file may not exist yet — safe during Phase 2)"

echo "✓ Docker stack ready."
echo "  Frontend:       http://localhost:3000"
echo "  Convex backend: http://localhost:3210 (site: 3211)"
echo "  Dashboard:      http://127.0.0.1:6791"
```

Notes:

- `./generate_admin_key.sh` is executed **inside** the `convex-backend` container (per the official self-hosted README).
- `npx convex dev --once` pushes functions and exits. Confirm the exact non-interactive push flag for the installed Convex CLI version (`npx convex --help`); older versions use `npx convex push`.
- `npx convex run seed` runs a single mutation/action by name. Seed file shape changes in ticket `07`; the `|| echo` guard keeps this script usable before then.
- The CLI discovers the self-hosted backend via `CONVEX_SELF_HOSTED_URL` + `CONVEX_SELF_HOSTED_ADMIN_KEY` in `.env.local` (it also needs `CONVEX_DEPLOYMENT` absent/unset so it doesn’t target cloud).

### Step 2: Make the script executable

```bash
chmod +x scripts/docker-up.sh
```

### Step 3: Document in README (brief)

Add a "Dockerized deployment" section (expanded in ticket `04`):

```bash
# Terminal 1 (one-time bootstrap)
./scripts/docker-up.sh
```

## Acceptance Criteria

- [ ] `scripts/docker-up.sh` exists and is executable
- [ ] Running it brings up the stack and waits for a healthy backend
- [ ] `.env.local` gains `CONVEX_SELF_HOSTED_URL` + `CONVEX_SELF_HOSTED_ADMIN_KEY` (idempotent — reruns don't duplicate lines)
- [ ] Functions are pushed to the self-hosted backend (verified via a scratch query or the dashboard)
- [ ] `npx convex run seed` executes against the self-hosted backend
- [ ] Script exits non-zero with a clear message if the backend never becomes healthy
- [ ] Running the script again after `docker compose down` works (admin key stable)

## Testing Considerations

- Run twice in a row; confirm no duplicate env lines and no seed-doubling errors (or that seed is idempotent).
- Test the failure path (`docker compose down` then run script while docker is paused) → clean error.
- Confirm the script does NOT clobber other `.env.local` vars (only its two lines are touched).

## Related Files

- `scripts/docker-up.sh` — NEW
- `env/bin/.env.local` — modified (two lines, by the script)
- `README.md` — uses this script

## Helpful Resources

- `feature-tickets/self-hosting/01-docker-compose-backend.md` (admin key generation)
- https://github.com/get-convex/convex-backend/blob/main/self-hosted/README.md (CLI self-hosted env vars)

## Notes

- Keep the script idempotent: safe to run against an already-running stack.
- The `sed`/append approach is deliberately simple and portable to macOS/BSD sed via `sed -i.bak ... || true`; move to a small Node script if this gets fragile.