# syntax=docker/dockerfile:1

# Build with the official Vite+ toolchain image. It runs as the non-root `vp`
# user and provisions the exact Node.js version from `.node-version`, so there is
# no Node-version-specific image tag to keep in sync with CI.
# Keep this version in sync with the `vite-plus` devDependency; ticket 15
# formalises that coupling (see tests/unit/infra/dockerImage.test.ts).
ARG VITE_PLUS_VERSION=1.3.0

# ---- Build stage ------------------------------------------------------------
FROM ghcr.io/voidzero-dev/vite-plus:${VITE_PLUS_VERSION} AS build
WORKDIR /app

# Install from the lockfile only, so the image is reproducible.
COPY --chown=vp:vp package.json bun.lock .node-version ./
RUN vp install --frozen-lockfile

COPY --chown=vp:vp . .

# Vite inlines `VITE_*` variables at BUILD time — there is no runtime env
# injection for the client bundle. The browser (not the compose network) is what
# talks to Convex, so this has to be a host-reachable address
# (`http://localhost:3210`), never the compose service name `convex-backend`.
ARG VITE_CONVEX_URL=http://localhost:3210
ARG VITE_CLERK_PUBLISHABLE_KEY=""
ENV VITE_CONVEX_URL=${VITE_CONVEX_URL}
ENV VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY}

RUN vp build

# Export the exact Node.js binary Vite+ resolved from `.node-version` so the
# runtime stage runs the SSR bundle on the same runtime.
RUN cp "$(vp env which node | head -1)" /tmp/node

# ---- Dependencies stage -----------------------------------------------------
# A separate, fresh `--prod` install so devDependencies (including the Vite+
# toolchain) are excluded from the runtime image. Running `--prod` over the full
# install above would not prune the already-installed devDependencies.
FROM ghcr.io/voidzero-dev/vite-plus:${VITE_PLUS_VERSION} AS deps
WORKDIR /app
COPY --chown=vp:vp package.json bun.lock .node-version ./
RUN vp install --frozen-lockfile --prod

# ---- Runtime stage ----------------------------------------------------------
# glibc base: the copied Node.js binary is an official, signature-verified build
# (the toolchain image is glibc based, so a musl runtime would not run it).
FROM debian:bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Unlike VITE_*, this is read at RUNTIME via `process.env`, not inlined at build
# time, so it never reaches the client bundle. SSR runs inside this container,
# where `localhost` is the container itself rather than the host, so the default
# is the compose service name. Override to reach a Convex instance from outside
# the compose network.
ENV CONVEX_SSR_URL=http://convex-backend:3210

# Only the SSR bundle, the static client assets and the production packages are
# needed at runtime. `dist/server/server.js` exports a WinterCG-style `fetch`
# handler rather than listening on a socket, so it is mounted by `srvx`, which
# also serves `dist/client` as static assets. Keep this command in sync with the
# `start` script in package.json.
COPY --from=build /tmp/node /usr/local/bin/node
COPY --from=build /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

USER nobody
EXPOSE 3000

# Exec the server directly (no `npm run` wrapper) so Node is PID 1 and receives
# SIGTERM for graceful shutdown.
CMD ["./node_modules/.bin/srvx", "--prod", "-s", "/app/dist/client", "/app/dist/server/server.js"]
