# Ticket 11: Dependency & Env Cleanup — Remove Clerk

## Overview

Remove all Clerk dependencies and environment variables now that Convex Auth fully replaces them: delete `@clerk/clerk-react` and `@clerk/testing`, purge `CLERK_*` env vars from `.env.local` and the config files that reference them, and update the CSP to drop Clerk domains.

## Current State

- `package.json`: `@clerk/clerk-react` (deps), `@clerk/testing` + `@clerk/backend` usage via `tests/e2e/global-setup.ts`.
- `.env.local`: `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_JWT_ISSUER_DOMAIN`, `ADMIN_CLERK_EMAIL/PASSWORD`, `CLERK_EMAIL/PASSWORD`, `CLERK_TEST_EMAIL/PASSWORD`.
- `playwright.config.ts` reads `VITE_CLERK_PUBLISHABLE_KEY`.
- `.github/workflows/ci.yml` uses Clerk secrets.
- CSP in `netlify.toml` allows Clerk domains.
- `AGENTS.md` documents the Clerk+Convex auth flow and `.env.local` Clerk vars.

## Prerequisites

- [x] Tickets `08`–`10` (no functional Clerk usage remains in `src/`)
- [x] Ticket `13` dependency awareness — global-setup rewrite must land before/with this (see ordering note)

## Implementation Steps

### Step 1: Remove packages

```bash
npm uninstall @clerk/clerk-react @clerk/testing
```

Also remove `@clerk/backend` if it was added directly (global-setup imports it — removed by ticket `13`; coordinate ordering so the tree isn't broken).

### Step 2: Purge env references

- `.env.local`: delete all `CLERK_*` / `ADMIN_CLERK_*` / `VITE_CLERK_PUBLISHABLE_KEY` lines. (Keep `CONVEX_*`, `VITE_CONVEX_*`, seed-admin creds from ticket `07`.)
- `playwright.config.ts`: drop `VITE_CLERK_PUBLISHABLE_KEY` handling (ticket `13` reworks this file).
- `src/hooks/useAuth.ts` / providers: already replaced in tickets `08`–`09`.
- `.github/workflows/ci.yml`: remove Clerk env export + debug steps (ticket `15` covers in depth).

### Step 3: Grep sweep

```bash
rg -n -i "clerk" --glob '!node_modules' --glob '!dist' --glob '!playwright-report' --glob '!*.log'
```

Resolve every hit (docs → README/AGENTS.md cleanup below; code → should be zero; tests → ticket `12`/`13`; CI → ticket `15`).

### Step 4: Update CSP (`netlify.toml`)

Remove `https://*.clerk.accounts.dev`, `https://*.clerk.accounts.com`, and any Clerk/cloudflare entries from `connect-src`/`frame-src`. Keep `'self'` + localhost Convex origins from ticket `04`.

### Step 5: Update `AGENTS.md`

Rewrite the **Authentication & Authorization** section: replace the Clerk+Convex flow with the Convex Auth flow (password provider, `useAuth` hook, seed admin, `via @convex-dev/auth`), and update the `.env.local` template to drop Clerk keys. Update the Common Auth Patterns code block comments.

### Step 6: Update README

Replace the Clerk prerequisites/setup bullets with the Convex Auth + seeded-admin instructions (`SITE_ADMIN_EMAIL`/`SITE_ADMIN_PASSWORD`).

## Acceptance Criteria

- [ ] `@clerk/clerk-react` and `@clerk/testing` removed from `package.json` and lockfile
- [ ] Zero `clerk` (case-insensitive) matches in `src/`, `convex/` (excluding docs/AGENTS if updated), `package.json`
- [ ] `.env.local` has no `CLERK_*` (manually removed; do not commit secrets)
- [ ] CSP has no Clerk domains
- [ ] `AGENTS.md` auth section describes the Convex Auth flow
- [ ] `npm ci`, `npm run check`, `npm run build` pass
- [ ] Tests still pass (coordinate with tickets `12`–`15`)

## Testing Considerations

- Ordering with ticket `13`: the E2E global-setup (which imports `@clerk/backend`/`@clerk/testing`) must be rewritten before `npm uninstall` breaks it. Recommended order: ticket `13` (or `12`) first, then this cleanup.
- Re-verify no app behavior references Clerk at runtime (browser network tab).

## Related Files

- `package.json`, `package-lock.json`,
- `.env.local` (local only; safe to edit freely)
- `playwright.config.ts`
- `netlify.toml`
- `AGENTS.md`, `README.md`
- `tests/e2e/global-setup.ts` (removal coordination with ticket `13`)

## Helpful Resources

- n/a (mechanical cleanup)

## Notes

- This ticket is intentionally the "dust" sweep — all real logic changes happen in tickets `08`–`10` and `12`–`15`. Land it after those to avoid mid-refactor breakage.