# Ticket 15: CI Workflow Update — Local Convex + Form Sign-In, No Clerk

## Overview

Update `.github/workflows/ci.yml` so the e2e stage authenticates via the seeded Convex Auth accounts (form sign-in) instead of Clerk test users. Secret-requiring Clerk steps are removed; the pipeline relies on a locally seeded backend (already started with `npx convex dev`).

## Current State

- CI starts `npx convex dev` locally, waits for "Convex functions ready", then runs `npx convex run seed || true`.
- The e2e step exports Clerk secrets into env:
  `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_TEST_EMAIL`, `CLERK_TEST_PASSWORD` (with a debug step that hard-fails if empty).
- Those secrets no longer exist after tickets `11`/`13`.

## Prerequisites

- [x] Tickets `07`, `13`, `14` (seeded accounts + rewritten global-setup + RBAC specs)

## Implementation Steps

### Step 1: Remove Clerk env export + secret gate

Delete the "Export Convex and Clerk env for e2e" and "Debug - Verify env vars are set" steps (lines ~88-109). Remove:

- `VITE_CLERK_PUBLISHABLE_KEY` (no longer read)
- `CLERK_SECRET_KEY`, `CLERK_TEST_EMAIL`, `CLERK_TEST_PASSWORD`

### Step 2: Keep local Convex + seed — adjust the seed step for auth accounts

- Keep the "Start local Convex" + "Seed Convex database" steps as-is (local `npx convex dev` remains the CI backend).
- The seed step (`npx convex run seed || true`) must now also create the auth users (ticket `07`). If seed needs `SITE_ADMIN_PASSWORD`, export a CI dev default so the accounts are deterministic:

```yaml
- name: Seed Convex database
  run: |
    echo "SITE_ADMIN_EMAIL=admin@example.com SITE_ADMIN_PASSWORD=dev-password" ...
    npx convex run seed || true
```

(No repo secrets needed — dev defaults are used in CI, matching `.env.example`.)

### Step 3: Env for the e2e step

Keep `VITE_CONVEX_URL=http://localhost:3210`. Remove Clerk vars from the `env:` block of "Run e2e tests" and pass `SITE_ADMIN_EMAIL`/`SITE_ADMIN_PASSWORD` (read from repo-defaults, incl. spectator creds via `SITE_SPECTATOR_EMAIL`/`SITE_SPECTATOR_PASSWORD` if ticket `14` needs them).

### Step 4: Ordering & health robustness

- Assert the seed step actually produced auth users before e2e: either let global-setup fail with the clear "backend unseeded" message (ticket `13`), or add a fast `npx convex run` guard returning an admin row. Prefer the former (less CI complexity, same failure signal).
- Consider enabling the wait loop's failure path (add `set -e` + explicit "Convex failed to start" error when the grep never matches) so infra issues fail fast instead of timing out.

### Step 5: Add authorization/secret hygiene

- Confirm no `clerk` references remain in the workflow (grep).
- Optional: add a `permissions: contents: read` job-level block for the PR-triggered run.

## Acceptance Criteria

- [ ] CI has zero `clerk`/`CLERK_*` references
- [ ] e2e job starts local Convex, seeds admin+spectator (dev creds), then signs in via the app form
- [ ] No GitHub secrets required; suite green in a fork/PR without secret configuration
- [ ] Unit + build + lint steps unchanged and passing
- [ ] New `admin.spec.ts`/`spectator.spec.ts` run as part of `npm run test:e2e`

## Testing Considerations

- Validate by opening a PR from a fork-free branch with **no** repo secrets set — the run must pass (previously it hard-failed on the debug step).
- Re-run a couple days apart to catch slow-seed flakiness; CI wait loop relies on "Convex functions ready".
- Confirm Playwright report artifact still uploads on failure.

## Related Files

- `.github/workflows/ci.yml` — primary
- `.env.example`
- `tests/e2e/global-setup.ts` (+ spectator setup, ticket `14`)
- `convex/seed.ts` (auth accounts, ticket `07`)

## Helpful Resources

- GitHub Actions env/expression docs: https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions

## Notes

- Because auth now depends only on seeded data (no external service), CI is hermetic: `npx convex dev` + `npx convex run seed` → e2e form sign-in. This is the payoff of the whole self-hosting effort.