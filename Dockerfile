# syntax=docker/dockerfile:1

# Keep this tag in sync with the CI Node version (.github/workflows/ci.yml).
# Ticket 15 formalises that coupling.
ARG NODE_VERSION=24-alpine

# ---- Build stage ------------------------------------------------------------
FROM node:${NODE_VERSION} AS build
WORKDIR /app

# Install from the lockfile only, so the image is reproducible.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Vite inlines `VITE_*` variables at BUILD time — there is no runtime env
# injection for the client bundle. The browser (not the compose network) is what
# talks to Convex, so this has to be a host-reachable address
# (`http://localhost:3210`), never the compose service name `convex-backend`.
ARG VITE_CONVEX_URL=http://localhost:3210
ARG VITE_CLERK_PUBLISHABLE_KEY=""
ENV VITE_CONVEX_URL=${VITE_CONVEX_URL}
ENV VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY}

RUN npm run build

# ---- Runtime stage ----------------------------------------------------------
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Unlike VITE_*, this is read at RUNTIME via `process.env`, not inlined at build
# time, so it never reaches the client bundle. SSR runs inside this container,
# where `localhost` is the container itself rather than the host, so the default
# is the compose service name. Override to reach a Convex instance from outside
# the compose network.
ENV CONVEX_SSR_URL=http://convex-backend:3210

# Only the SSR bundle, the static client assets and the installed packages are
# needed at runtime. `dist/server/server.js` exports a WinterCG-style `fetch`
# handler rather than listening on a socket, so it is mounted by `srvx`, which
# also serves `dist/client` as static assets. Keep this command in sync with the
# `start` script in package.json.
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

USER node
EXPOSE 3000

# Exec the server directly (no `npm run` wrapper) so Node is PID 1 and receives
# SIGTERM for graceful shutdown.
CMD ["./node_modules/.bin/srvx", "--prod", "-s", "/app/dist/client", "/app/dist/server/server.js"]
