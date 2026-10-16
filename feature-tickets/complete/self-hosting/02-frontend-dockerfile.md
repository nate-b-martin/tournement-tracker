# Ticket 02: Frontend Dockerfile — TanStack Start SSR Build

## Overview

Add a production `Dockerfile` that builds the TanStack Start app and runs the compiled server on port `3000`. The `VITE_CONVEX_URL` build-time env must be baked to the **host-reachable** URL (`http://localhost:3210`), because the browser (not the compose network) connects to Convex directly.

## Current State

- No `Dockerfile` exists.
- `npm run build` (Vite/TanStack Start) emits `dist/client` (static assets) + `dist/server/server.js` (Node SSR server).
- Production serving today is Netlify (`netlify.toml`, command `vite build`, dir `dist/client`).

## Prerequisites

- [x] `npm run build` succeeds locally and produces `dist/server/server.js`
- [x] Ticket `01` done (the backend the image will talk to)

## Implementation Steps

### Step 1: Multi-stage Dockerfile

```dockerfile
# ---- Build stage ----
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Bake the host-reachable Convex URL; the browser talks to this address.
ARG VITE_CONVEX_URL
ENV VITE_CONVEX_URL=${VITE_CONVEX_URL:-http://localhost:3210}
RUN npm run build

# ---- Runtime stage ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Only the server bundle + static client assets are needed at runtime.
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/server/server.js"]
```

Notes:

- Using `npm ci` (lockfile exists) for reproducible builds.
- `node_modules` is copied wholesale for simplicity; pruning to production deps with `npm ci --omit=dev` in the runtime stage is an optional refinement.
- Verify the actual TanStack Start server entry filename after a fresh build — if it differs from `dist/server/server.js`, update `CMD`.
- If SSR is ever disabled and the app becomes fully static, switch the runtime stage to `nginx:alpine` serving `dist/client`.

### Step 2: `.dockerignore`

```
node_modules
dist
dist-ssr
.nitro
.output
.vinxi
.tanstack
wrangler
.denv
.env
.env.local
.env.*.local
playwright
playwright-report
test-results
feature-tickets
docs
*.log
.git
```

(The key point: never copy `.env.local` or `node_modules` into the image.)

### Step 3: Add to compose

In `docker-compose.yml` (from ticket `01`) add the frontend service:

```yaml
  frontend:
    build:
      context: .
      args:
        VITE_CONVEX_URL: ${VITE_CONVEX_URL:-http://localhost:3210}
    ports:
      - "3000:3000"
    depends_on:
      convex-backend:
        condition: service_healthy
```

## Acceptance Criteria

- [ ] `docker build -t tournament-tracker:dev .` succeeds
- [ ] Image runs and serves the app on port 3000
- [ ] `VITE_CONVEX_URL` baked at build time (check the served JS bundle contains `localhost:3210`, not a compose internal hostname)
- [ ] `.dockerignore` prevents `.env.local`/`node_modules` from entering the build context
- [ ] Compose `frontend` service starts after `convex-backend` is healthy
- [ ] App renders in a browser at `http://localhost:3000` (it may show an unauthenticated state — auth comes in Phase 2)

## Testing Considerations

- Run the container and confirm the page loads even while Convex is unavailable (should show the app shell, not crash).
- Rebuild with a different `VITE_CONVEX_URL` and confirm the baked bundle changes.
- Confirm `npm ci` works from a clean clone (lockfile is committed).

## Related Files

- `Dockerfile` — NEW
- `.dockerignore` — NEW
- `docker-compose.yml` — modified (frontend service)
- `package.json` — unchanged (already builds `dist/`)

## Helpful Resources

- https://tanstack.com/start/latest — TanStack Start deployment
- https://vite.dev/guide/static-deploy — Vite `VITE_*` build-time env semantics (baked at build)

## Notes

- `VITE_` variables are inlined at **build** time by Vite. That is exactly why the URL must be host-reachable (`http://localhost:3210`) and cannot be the compose service name (`convex-backend:3210`).
- Do not fix the tag to `node:24-alpine` forever — keep it in sync with the CI node version (see ticket `15`).
- Runtime env changes to the frontend require a rebuild of the image (no runtime `.env` injection in this simple setup).