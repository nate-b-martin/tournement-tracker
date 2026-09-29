# Ticket 05: Convex Auth Scaffold — Password Provider + JWT Issuer

## Overview

Install Convex Auth and wire it into the Convex backend with the **Password** provider (email + password, fully self-hosted). This replaces Clerk as the JWT issuer. The Convex backend must trust JWTs issued by itself (via `CONVEX_SITE_URL`), and the auth tables must be added to the schema.

## Current State

- `convex/auth.config.ts` trusts a single Clerk issuer (`CLERK_JWT_ISSUER_DOMAIN`).
- No `convex/auth.ts`, no `convex/http.ts`, no auth tables in `convex/schema.ts`.
- `@convex-dev/auth` / `@auth/core` are not installed.

## Prerequisites

- [x] A running Convex backend the CLI can push to and set env on:
  - Either the Dockerized backend from ticket `01` (then ticket `03` first), **or**
  - Local `npx convex dev` (unchanged workflow). Both share `VITE_CONVEX_URL=http://localhost:3210`.
- [x] Master plan decisions (SQLite, Password provider, seed-based admin)

## Implementation Steps

### Step 1: Install packages

```bash
npm install @convex-dev/auth @auth/core@0.41.1
```

### Step 2: Run the setup wizard

```bash
npx @convex-dev/auth
```

This should:

- Create `convex/auth.ts` (with the `convexAuth({ providers: [] })` boilerplate)
- Create `convex/http.ts` mounting `auth.addHttpRoutes(http)`
- Update `convex/auth.config.ts` to trust the local issuer
- Add `authTables` to `convex/schema.ts`
- Generate and set `JWT_PRIVATE_KEY` / `JWKS` env vars on the target deployment

If the wizard has trouble targeting the self-hosted deployment, fall back to **Manual Setup** (https://labs.convex.dev/auth/setup/manual):

1. `npx convex env set SITE_URL http://localhost:5173` → for this app set `SITE_URL=http://localhost:3211` (site origin).
2. Generate an RS256 keypair (`generateKeys.mjs` from the docs) and set `JWT_PRIVATE_KEY` + `JWKS` via `npx convex env set`.
3. Rewrite `convex/auth.config.ts`:

```typescript
import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
```

4. Create `convex/http.ts`:

```typescript
import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();
auth.addHttpRoutes(http);
export default http;
```

### Step 3: Configure the Password provider only

`convex/auth.ts`:

```typescript
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});
```

### Step 4: Verify the backend accepts its own JWTs

Push and smoke-test:

```bash
npx convex dev --once   # or: npx convex push
```

- Confirm `convex/schema.ts` now includes the auth tables (`users`, `authSessions`, `authAccounts`, `authVerificationRequests`).
- Confirm `.well-known` is served from the site origin:
  ```bash
  curl http://localhost:3211/.well-known/openid-configuration
  # jwks_uri must point at http://localhost:3211/.well-known/jwks.json
  curl http://localhost:3211/.well-known/jwks.json
  ```
- `getUserIdentity()` should now return non-null for a Convex-Auth-issued token (exercised end-to-end in tickets `09`/`10`).

### Step 5: Concurrency/version notes

- Confirm `package.json` pins `@convex-dev/auth` explicitly (it's in beta; pin versions for reproducibility).
- Add it to `docker-up.sh` env push step if env vars were only applied locally (the Dockerized backend stores env separately, so run `npx convex env set` against it via ticket `03`'s `.env.local` wiring).

## Acceptance Criteria

- [ ] `@convex-dev/auth` + `@auth/core@0.41.1` installed
- [ ] `convex/auth.ts` exports `{ auth, signIn, signOut, store, isAuthenticated }` with the `Password` provider
- [ ] `convex/http.ts` mounts auth HTTP routes; JWKS reachable at the site origin (`:3211`)
- [ ] `convex/auth.config.ts` trusts `CONVEX_SITE_URL` (applicationID `convex`) — no Clerk issuer
- [ ] `convex/schema.ts` includes `authTables`
- [ ] `JWT_PRIVATE_KEY` / `JWKS` env vars set on the active deployment (recorded, not logged)
- [ ] `curl http://localhost:3211/.well-known/openid-configuration` returns an OIDC document with the correct `jwks_uri`
- [ ] Existing queries/mutations still type-check and run (no behavior change yet)

## Testing Considerations

- Environment state is **per deployment** — the Dockerized backend and local `npx convex dev` backend each need their own env set. Document repeatability (ticket `03`).
- Don't commit `JWT_PRIVATE_KEY` / `JWKS`; they belong in the deployment env / `.env` (git-ignored).

## Related Files

- `convex/auth.ts` — NEW
- `convex/http.ts` — NEW
- `convex/auth.config.ts` — REWRITE (remove Clerk)
- `convex/schema.ts` — add `authTables`
- `package.json` — add `@convex-dev/auth`, `@auth/core`
- `scripts/docker-up.sh` — maybe: env-set step for the Dockerized backend

## Helpful Resources

- https://labs.convex.dev/auth/setup (and `/setup/manual`)
- https://labs.convex.dev/auth/config/passwords
- https://labs.convex.dev/auth/authz

## Notes

- Convex Auth is **beta**; the Password path is the most stable for self-hosted and needs no third-party service.
- The `domain`/applicationID in `auth.config.ts` is the JWT trust config, not an OAuth registration — it tells Convex to trust tokens with `iss` = `CONVEX_SITE_URL` and `aud` = `convex`.
- `getUserIdentity().subject` for Convex Auth tokens is `"{users._id}::{authSessions._id}"` — ticket `06` replaces usages that assumed Clerk's `subject` == user id.