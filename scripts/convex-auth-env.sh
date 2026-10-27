#!/usr/bin/env bash
#
# convex-auth-env.sh — ensure the env vars required by Convex Auth exist on the
# active Convex deployment.
#
# Idempotent and safe to re-run:
#   - SITE_URL is set only when missing.
#   - JWT_PRIVATE_KEY / JWKS are left untouched when both exist. If only one is
#     present the pair is regenerated (a mismatched pair cannot verify tokens);
#     that also invalidates existing sessions, so it is logged as a warning.
#
# Which deployment is "active" is decided by the Convex CLI (.env.local /
# CONVEX_DEPLOYMENT), so this works for both the Dockerized backend and a local
# `npx convex dev` backend. Env vars are per deployment, so run it once against
# each one.
#
# Values are never echoed; only the variable names are logged.
#
# Usage: bash scripts/convex-auth-env.sh
#        bun run auth:env
#
# SITE_URL defaults to the frontend origin (Docker compose maps it to :3000 and
# `bun run dev` uses the same port). Override with SITE_URL=... if needed.

set -euo pipefail

cd "$(dirname "$0")/.."

SITE_URL="${SITE_URL:-http://localhost:3000}"

# Resolve a Convex CLI runner. Mirrors scripts/docker-up.sh.
CONVEX_CLI=()
if command -v bunx >/dev/null 2>&1; then
	CONVEX_CLI=(bunx convex)
elif command -v bun >/dev/null 2>&1; then
	CONVEX_CLI=(bun x convex)
elif command -v npx >/dev/null 2>&1; then
	CONVEX_CLI=(npx convex)
else
	echo "✗ Neither bunx nor npx is available — install Bun (or Node.js) first." >&2
	exit 1
fi

# `convex env get` prints the value on stdout and exits non-zero when unset.
env_is_set() {
	local value
	value="$("${CONVEX_CLI[@]}" env get "$1" 2>/dev/null || true)"
	[ -n "$value" ]
}

if env_is_set SITE_URL; then
	echo "✓ SITE_URL is already set"
else
	"${CONVEX_CLI[@]}" env set SITE_URL "$SITE_URL"
	echo "✓ Set SITE_URL=${SITE_URL}"
fi

if env_is_set JWT_PRIVATE_KEY && env_is_set JWKS; then
	echo "✓ JWT_PRIVATE_KEY / JWKS are already set"
	exit 0
fi

key_dir="$(mktemp -d)"
trap 'rm -rf "$key_dir"' EXIT

if env_is_set JWT_PRIVATE_KEY || env_is_set JWKS; then
	echo "⚠️  Only one of JWT_PRIVATE_KEY / JWKS was set — regenerating the pair." >&2
	echo "    Existing sessions signed with the old key are invalidated." >&2
fi

if command -v bun >/dev/null 2>&1; then
	bun scripts/generate-auth-keys.mjs "$key_dir"
elif command -v node >/dev/null 2>&1; then
	node scripts/generate-auth-keys.mjs "$key_dir"
else
	echo "✗ Neither bun nor node is available to generate the auth keys." >&2
	exit 1
fi

# `--` stops option parsing: the private key value starts with `-----BEGIN`.
"${CONVEX_CLI[@]}" env set -- JWT_PRIVATE_KEY "$(cat "$key_dir/JWT_PRIVATE_KEY")"
"${CONVEX_CLI[@]}" env set -- JWKS "$(cat "$key_dir/JWKS")"
echo "✓ Generated and set JWT_PRIVATE_KEY / JWKS"
