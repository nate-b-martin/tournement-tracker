# Ticket 04: Security Headers, `.env.example`, and Ops Docs

## Overview

Update the CSP/security headers so the containerized deployment may connect to the self-hosted Convex origin, publish a documented `.env.example`, and add a README ops section covering volume backups, pinned-tag upgrades, the one-backend-at-a-time rule, and the self-hosted Convex limitations (single-node, FSL license).

## Current State

- `netlify.toml` contains a strict CSP whose `connect-src` only allows `https://*.convex.cloud` and `https://*.clerk.accounts.*` — neither is correct once self-hosted local origin + Convex Auth are in play.
- `.env.local` holds Clerk/cloud Convex secrets; there is no committed `VITE_*`/self-hosted env template.
- README has no ops/Docker guidance.

## Prerequisites

- [x] Tickets `01`–`03` shapes understand what env/URLs exist
- (Safe to do in parallel with Phase 2; adjust the final CSP once Convex Auth is in (no Clerk URLs remain).)

## Implementation Steps

### Step 1: CSP / connect-src update

**`netlify.toml`** (still the hosting target) and any nginx/headers you add for the Docker frontend (`02-frontend-dockerfile` decision if nginx is used later) must allow:

- `connect-src 'self' http://localhost:3210 ws://localhost:3210 http://127.0.0.1:3210 ws://127.0.0.1:3210` (Convex sync)
- The Convex site origin for HTTP actions/JWKS: `http://localhost:3211`
- If the dashboard is accessed, it lives on `127.0.0.1` only and is out of scope of the app CSP.

Remove the Clerk domains from `connect-src` (`https://*.clerk.accounts.dev`, `https://*.clerk.accounts.com`, `https://challenges.cloudflare.com` if no longer needed). Keep the rest of the existing policy unchanged.

Verification approach:

```bash
npm run build
# serve dist + fetch a page; confirm no CSP violations in the browser console
# explicitly exercise: page connects to Convex at localhost:3210 (query renders)
```

### Step 2: `.env.example`

Create `.env.example` documenting every variable used across both workflows:

```bash
# --- Convex (self-hosted backend) ---
# Written by `npx convex dev` (local) or `scripts/docker-up.sh` (Docker).
VITE_CONVEX_URL=http://localhost:3210
VITE_CONVEX_SITE_URL=http://localhost:3211

# CLI → self-hosted backend (set by scripts/docker-up.sh)
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=<generated>

# Docker compose backend knobs (used by docker-compose.yml)
INSTANCE_NAME=tournament-tracker
INSTANCE_SECRET=<generate a random value, keep stable>
CONVEX_CLOUD_ORIGIN=http://127.0.0.1:3210
CONVEX_SITE_ORIGIN=http://127.0.0.1:3211

# --- Seeded admin (used by convex/seed.ts + e2e) ---
SITE_ADMIN_EMAIL=admin@example.com
SITE_ADMIN_PASSWORD=<change-me>
E2E_ADMIN_EMAIL=admin@example.com
E2E_ADMIN_PASSWORD=<same as above or dedicated>
```

Add a comment block explaining cons/shared `.env.local` and the one-backend-at-a-time rule.

### Step 3: README ops section

Add to `README.md` under a "Self-Hosted Docker Deployment" heading:

- **Bootstrap:** `./scripts/docker-up.sh`
- **One-backend-at-a-time rule:** Docker stack and `npx convex dev` both bind `:3210` and hold separate data + env state; never run both simultaneously.
- **Backup the database volume:**
  ```bash
  docker run --rm -v tournament-tracker_data:/data -v "$PWD":/backup alpine \
    tar czf /backup/convex-backup-$(date +%F).tar.gz -C /data .
  ```
- **Restore:** extract the tarball back into the volume with the container stopped.
- **Upgrades:** pin the image tag (ticket `01`); before bumping, follow the self-hosted upgrade/migration instructions (https://docs.convex.dev/self-hosting or the self-hosted README). No official support plan for self-hosted.
- **Limitations:** single-node backend; FSL (fair-source, converts to Apache-2.0 after ~2 years); run one instance.
- **No cloud:** the Dockerized deployment uses no `convex.cloud` and no Clerk.

### Step 4: `.gitignore`

Ensure the local compose `.env` and `.env.local` are ignored (already git-ignored; confirm `docker-compose.env`/`.env` are added if they were introduced in ticket `01`/`03`).

## Acceptance Criteria

- [ ] CSP `connect-src` allows `http://localhost:3210`/`ws://localhost:3210` (and site origin `3211`) and drops Clerk/cloud domains
- [ ] `.env.example` exists with self-explanatory comments and no real secrets
- [ ] README has the Self-Hosted Docker Deployment section with the one-backend-at-a-time rule
- [ ] README documents volume backup + restore commands
- [ ] README documents pinned-tag upgrade steps + FSL/single-node limitations
- [ ] `.gitignore` covers the local compose `.env`

## Testing Considerations

- Load the deployed app and confirm zero CSP violations while Convex queries render.
- Confirm `connect-src` still allows the app assets (`'self'`) and font/images as before.
- Practice a backup → wipe volume → restore cycle on a throwaway stack.

## Related Files

- `netlify.toml` — CSP update
- `.env.example` — NEW
- `README.md` — ops section
- `.gitignore` — compose `.env`

## Helpful Resources

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
- https://github.com/get-convex/convex-backend/blob/main/self-hosted/README.md (upgrades, backups)

## Notes

- Update the CSP a second time after Phase 2 removes Clerk entirely — the final policy should have zero `clerk.*`/`.cloud` entries.
- Headers are applied by the static host (Netlify) today; the container frontend from ticket `02` runs `node dist/server/server.js` which does not set these headers itself — pair it behind a proxy or add header middleware if strict CSP is required in the container path.