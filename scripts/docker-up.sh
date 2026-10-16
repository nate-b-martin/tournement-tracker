#!/usr/bin/env bash
#
# docker-up.sh — one-shot bootstrap for the self-hosted Docker stack.
#
# Brings up the containerized stack (convex-backend, convex-dashboard, frontend),
# waits for the backend to become healthy, wires the Convex CLI to the
# self-hosted deployment by writing CONVEX_SELF_HOSTED_URL /
# CONVEX_SELF_HOSTED_ADMIN_KEY into .env.local, pushes the backend functions,
# and seeds the database.
#
# Idempotent: safe to re-run against an already-running stack. Reruns only ever
# rewrite the two CONVEX_SELF_HOSTED_* lines in .env.local; every other variable
# is left untouched.
#
# See docs/DOCKER_GUIDE.md for the manual walkthrough.

set -euo pipefail

cd "$(dirname "$0")/.."

# --- Configuration ----------------------------------------------------------
# Keep these in sync with the port mappings in docker-compose.yml.
CLIENT_URL="http://127.0.0.1:3210"   # Convex client sync
SITE_URL="http://127.0.0.1:3211"     # Convex site proxy (HTTP actions, JWKS)
DASHBOARD_URL="http://127.0.0.1:6791"
FRONTEND_URL="http://localhost:3000"
ENV_LOCAL=".env.local"
HEALTH_TIMEOUT_SECONDS="${HEALTH_TIMEOUT_SECONDS:-120}"
# Convex function reference for the seed mutation. The export in
# convex/seed.ts is named `seed`, so the reference is `seed:seed` (`seed` alone
# would mean the module's default export). Override if that ever changes.
SEED_FUNCTION="${CONVEX_SEED_FUNCTION:-seed:seed}"

# --- Preflight --------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
	echo "✗ docker not found — install Docker and Docker Compose v2 first." >&2
	exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
	echo "✗ 'docker compose' (Compose v2) is not available." >&2
	exit 1
fi

# Resolve a Convex CLI runner. The project documents `npx`, but fall back to Bun
# so the script also works on machines that only have Bun installed.
CONVEX_CLI=()
if command -v npx >/dev/null 2>&1; then
	CONVEX_CLI=(npx convex)
elif command -v bunx >/dev/null 2>&1; then
	CONVEX_CLI=(bunx convex)
elif command -v bun >/dev/null 2>&1; then
	CONVEX_CLI=(bun x convex)
else
	echo "✗ Neither npx nor bunx is available — install Node.js (npm) or Bun first." >&2
	exit 1
fi

# --- Start the stack --------------------------------------------------------
if [ ! -f .env ]; then
	echo "⚠️  No .env found — docker compose will fall back to the insecure default" >&2
	echo "    INSTANCE_SECRET. Copy docker-compose.env.example to .env and set it first." >&2
fi

echo "⏳ Starting Docker stack (convex-backend, convex-dashboard, frontend)..."
docker compose up -d

# --- Wait for a healthy backend --------------------------------------------
# Prefer host `curl` (it also proves the port is reachable from the host); fall
# back to curling from inside the container if the host has no curl.
backend_is_up() {
	if command -v curl >/dev/null 2>&1; then
		curl -sf "${CLIENT_URL}/version" >/dev/null 2>&1
	else
		docker compose exec -T convex-backend curl -sf http://localhost:3210/version >/dev/null 2>&1
	fi
}

echo "⏳ Waiting for convex-backend to become healthy (up to ${HEALTH_TIMEOUT_SECONDS}s)..."
health_deadline=$((SECONDS + HEALTH_TIMEOUT_SECONDS))
until backend_is_up; do
	if [ "$SECONDS" -ge "$health_deadline" ]; then
		echo "✗ convex-backend did not become healthy within ${HEALTH_TIMEOUT_SECONDS}s." >&2
		echo "  Inspect the logs with: docker compose logs convex-backend" >&2
		exit 1
	fi
	sleep 2
done
echo "✓ convex-backend is up"

# --- Generate (or reuse) the admin key --------------------------------------
# The key is derived inside the container from INSTANCE_NAME + INSTANCE_SECRET,
# both of which are stable, so previously issued keys keep working. Each run
# issues a fresh key and we store the newest one.
echo "⏳ Generating admin key..."
admin_key_raw="$(docker compose exec -T convex-backend ./generate_admin_key.sh | tr -d '\r')"
# The script prints a banner ("Admin key:") followed by the key on its own line,
# in the "<instance-name>|<secret>" form. Be lenient about the banner and just
# keep the last matching key.
admin_key="$(printf '%s\n' "$admin_key_raw" | grep -oE '[A-Za-z0-9_.-]+\|[0-9a-fA-F]{32,}' | tail -n 1 || true)"
if [ -z "$admin_key" ]; then
	admin_key="$(printf '%s\n' "$admin_key_raw" | awk 'NF { last = $0 } END { print last }')"
fi
if [ -z "$admin_key" ]; then
	echo "✗ Could not parse an admin key from generate_admin_key.sh output:" >&2
	printf '%s\n' "$admin_key_raw" >&2
	exit 1
fi
echo "✓ Obtained admin key"

# --- Point the CLI at the self-hosted backend -------------------------------
# Idempotent: drop any previous self-hosted lines, then append the current ones.
touch "$ENV_LOCAL"
sed -i.bak '/^CONVEX_SELF_HOSTED_URL=/d; /^CONVEX_SELF_HOSTED_ADMIN_KEY=/d' "$ENV_LOCAL"
{
	echo "CONVEX_SELF_HOSTED_URL=${CLIENT_URL}"
	echo "CONVEX_SELF_HOSTED_ADMIN_KEY=${admin_key}"
} >>"$ENV_LOCAL"
rm -f "${ENV_LOCAL}.bak"
echo "✓ Wired CONVEX_SELF_HOSTED_* into ${ENV_LOCAL}"

# The Convex CLI refuses to target a self-hosted backend while CONVEX_DEPLOYMENT
# is set. Don't touch the user's line, just warn them.
if grep -qE '^[[:space:]]*CONVEX_DEPLOYMENT=' "$ENV_LOCAL" 2>/dev/null; then
	echo "⚠️  ${ENV_LOCAL} still sets CONVEX_DEPLOYMENT; the Convex CLI will refuse the" >&2
	echo "    self-hosted backend until it is unset/commented out." >&2
fi

# --- Push functions, then seed ----------------------------------------------
echo "⏳ Pushing Convex functions to the self-hosted backend..."
"${CONVEX_CLI[@]}" dev --once

echo "⏳ Seeding the database..."
if ! "${CONVEX_CLI[@]}" run "$SEED_FUNCTION"; then
	echo "ℹ️  Seed did not complete (the seed mutation currently requires an" >&2
	echo "    authenticated admin — wired up in Phase 2 / ticket 07)." >&2
fi

echo "✓ Docker stack ready."
echo "  Frontend:       ${FRONTEND_URL}"
echo "  Convex backend: ${CLIENT_URL} (site: ${SITE_URL})"
echo "  Dashboard:      ${DASHBOARD_URL}"
