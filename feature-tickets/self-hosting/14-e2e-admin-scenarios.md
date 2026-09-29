# Ticket 14: E2E Admin + Spectator RBAC Scenarios

## Overview

Add Playwright coverage that locks in the self-hosted RBAC model: the **seeded admin** can perform CRUD end-to-end, and a **seeded spectator** can read data but is blocked from create/edit/delete in the UI and server-side. This replaces the prior implicit "Clerk test user is admin" assumption with explicit role-based specs.

## Current State

- Existing specs (`teams.spec.ts`, `players.spec.ts`, `seasons.spec.ts`, `tournaments.spec.ts`, `setup-wizard.spec.ts`, etc.) run authenticated via global-setup's stored admin state and exercise CRUD without verifying RBAC boundaries.
- `tests/e2e/fixtures/auth.ts` just re-exports `@playwright/test`.
- `ProtectedPage.ts` covers signed-out redirects; nothing asserts spectator view-only behavior.

## Prerequisites

- [x] Tickets `07`, `10`, `13` (seeded admin + spectator accounts; admin e2e sign-in path)

## Implementation Steps

### Step 1: Add a spectator storage-state project

Extend `playwright.config.ts` with a second global-setup entry (or a separate setup spec) that:

- Signs in as the seeded **spectator** (`spectator@example.com` / configured password from `.env.local`).
- Saves `playwright/.auth/spectator.json`.

Recommended: a dedicated `tests/e2e/global-setup-spectator.ts` sharing the `SignInDialog` helper from ticket `13`, wired via the existing global-setup + a `test.use({ storageState })` guard in the spectator spec.

### Step 2: `tests/e2e/admin.spec.ts` — admin CRUD smoke

Keep this thin since CRUD is covered elsewhere; assert the *admin-canonical* path end-to-end on at least one entity:

- Create a team (dialog → valid + submit → appears in table).
- Edit its name (dialog prefilled → save → row updated).
- Delete it (ConfirmDeleteDialog → confirm → row gone).

Use the dedicated page objects (`TeamsPage`, `FormDialog`, `ConfirmDeleteDialog`) and a unique prefix (e.g. `ADMIN-SMOKE-<timestampLeaf>`) to avoid cross-spec collision on the shared seeded dataset.

### Step 3: `tests/e2e/spectator.spec.ts` — read-only, no write affordances

`test.describe` with `test.use({ storageState: "playwright/.auth/spectator.json" })`:

**Read:**
- Can view teams, players, seasons, tournaments tables and a detail page.

**Write blocked (UI):**
- No "Add"/create button, no row edit/delete affordances (dropdown menu absent, or items hidden) on teams/players/seasons/tournaments. Assert the absent selectors (e.g. `getByRole("button", { name: /add team/i })` count 0).

**Guard behavior:**
- Navigating directly to an admin-only path shows the access-denied state (`ProtectedPage.waitForAccessDenied()` reuse) rather than a 500.

### Step 4: Server-side rejection assertion (optional but valuable)

If the app exposes an admin-only mutation path, assert a server rejection surface: e.g. use `page.request`/`page.evaluate` to invoke a Convex mutation as spectator and expect `Unauthorized`. If no thin seam exists, rely on the UI-absence checks + the server-side guard already covered in ticket `06`/unit tests — don't force a brittle test.

### Step 5: Wire into CI

Ensure the new specs run under `npm run test:e2e` (config projects) and that CI (ticket `15`) seeds both admin and spectator accounts before the run.

## Acceptance Criteria

- [ ] `admin.spec.ts`: create → edit → delete succeeds for the seeded admin (one entity, full flow)
- [ ] `spectator.spec.ts`: viewer sees shared data, sees zero create/edit/delete affordances
- [ ] Admin-only route access by spectator renders access-denied (no crash)
- [ ] New specs use existing page objects; selectors match ticket `10`/`13` contracts
- [ ] `npm run test:e2e` passes with admin + spectator storage states (CI seed includes spectator)
- [ ] Data hygiene: tests don't leak mutations into the shared seed dataset

## Testing Considerations

- Both storage-state files must be freshly generated after any password/seed change (rerun setup).
- Run the suite twice to confirm idempotency (admin CRUD uses unique names; cleanup in `afterAll` if delete supported).
- Loosely-coupled from ticket `15`; coordinate timing so CI runs them only after `SITE_ADMIN_PASSWORD` seeding exists.

## Related Files

- `tests/e2e/admin.spec.ts` — NEW
- `tests/e2e/spectator.spec.ts` — NEW
- `tests/e2e/global-setup-spectator.ts` — NEW
- `tests/e2e/pages/*` — reuse (`TeamsPage`, `FormDialog`, `ConfirmDeleteDialog`, `ProtectedPage`)
- `playwright.config.ts` — spectator project/storageState
- `.github/workflows/ci.yml` — ensure spectator seeded (ticket `15`)

## Helpful Resources

- https://playwright.dev/docs/test-global-setup-teardown
- https://playwright.dev/docs/test-use-options (per-project `storageState`)

## Notes

- The spectator is the default role for new sign-ups (first user → admin); keep the two seed accounts stable in ticket `07` so these specs don't guess credentials.
- Where assertions differ only by role, prefer data-driven table/dataset naming to keep the suite readable.