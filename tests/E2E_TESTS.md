# End-to-End (E2E) Tests — Authentication & How to Run

## Overview
This document explains how the Playwright-based E2E tests work in this repo, with a focus on authentication (Clerk) and how to run, debug, and extend tests reliably.

Key concepts:
- Global setup authenticates once and writes a browser storage state file.
- Tests consume the saved storage state via Playwright `storageState` so they start authenticated.
- Unauthenticated tests explicitly reset storage state.

Files of interest
- `playwright.config.ts` — test runner configuration; defines the `global setup` project and uses `playwright/.clerk/user.json` as `storageState` for authenticated tests.
- `tests/e2e/global-setup.ts` — single source of truth for creating auth state (calls `clerkSetup()` + `clerk.signIn()` and writes `playwright/.clerk/user.json`).
- `tests/e2e/fixtures/auth.ts` — lightweight test export (`test` and `expect`). It no longer performs sign-in.
- `tests/e2e/*.spec.ts` — specs. Auth tests use default project `storageState`; unauthenticated tests call `test.use({ storageState: { cookies: [], origins: [] } })`.
- `playwright/.clerk/user.json` — generated auth-state file (ignored by git).

## Environment variables (required)
Set these in `.env.local` or CI secrets before running tests:
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `CLERK_SECRET_KEY` — Clerk secret key (sensitive)
- `CLERK_TEST_EMAIL` — test user's email (used during global setup to sign in)

Note: We also provide a placeholder `.env` file in the repo for local dev (do not commit secrets).

## How the authentication flow works
1. Global setup project runs first (Playwright project named `global setup`).
2. `tests/e2e/global-setup.ts`:
   - Calls `clerkSetup({ publishableKey, secretKey })` to obtain a testing token and configure Clerk helpers.
   - Uses `clerk.signIn({ page, emailAddress: CLERK_TEST_EMAIL })` (the project uses the `emailAddress` helper for reliability).
   - Verifies the app is actually authenticated by navigating to a protected route (e.g., `/dashboard`) and waiting for a page-specific element.
   - Calls `context.storageState({ path: 'playwright/.clerk/user.json' })` to persist cookies/localStorage/IndexedDB.
3. Playwright loads `playwright/.clerk/user.json` as `storageState` for subsequent tests (configured in `playwright.config.ts`).
4. Tests that should run unauthenticated clear storage state explicitly with `test.use({ storageState: { cookies: [], origins: [] } })`.

Why this is better:
- Avoids repeated UI sign-ins during tests (faster, more reliable).
- Keeps a single authoritative place to change test-user or auth logic.

## Running tests locally
Open a terminal at the repo root and ensure your dev server is running (the Playwright config starts a web server automatically when running tests if configured):

Run the full suite:

```bash
# run full Playwright suite
npx playwright test
```

Run only the E2E auth/navigation focused specs (faster feedback):

```bash
# targeted run used during development
npx playwright test tests/e2e/auth.spec.ts tests/e2e/navigation.spec.ts
```

Run a single test file or test name (Playwright supports `-g` to filter by title):

```bash
# single spec file
npx playwright test tests/e2e/navigation.spec.ts

# run tests matching a name
npx playwright test -g "can open and close menu"
```

If you want the HTML report to open automatically set `PW_TEST_HTML_REPORT_OPEN=always` (CI-friendly runs should set `never`):

```bash
PW_TEST_HTML_REPORT_OPEN=never npx playwright test
```

## Regenerating auth state
If auth state expires or you want to switch the test user:
1. Delete the file `playwright/.clerk/user.json`.
2. Ensure `.env.local` contains the required Clerk keys and `CLERK_TEST_EMAIL`.
3. Re-run the test suite (the `global setup` project will regenerate `user.json`).

```bash
rm -f playwright/.clerk/user.json
npx playwright test tests/e2e/global-setup.ts
```

## CI considerations
- Add `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `CLERK_TEST_EMAIL` to CI secrets.
- Run tests with `workers: 1` in CI or ensure test accounts are isolated per worker (see Playwright docs for "one account per worker").
- Keep `playwright/.clerk` in `.gitignore` (it is by default).
- If you run tests in GitHub Actions, set permissions and secrets appropriately and avoid exposing the secret key in logs.

## Debugging common failures
- Missing env keys: Setup will throw errors early; verify `.env.local` or CI secrets.
- `global-setup` times out waiting for a page element: check dev server is running and reachable at `http://localhost:3000` or the configured `baseURL`.
- Saved `user.json` is invalid or empty: delete and re-run global setup to regenerate.
- Tests claiming user UI not visible: the user menu lives inside the slide-out nav; ensure your test opens the nav before attempting to click the user button.
- Parallel runs cause token/session clashes: use `workers: 1` in CI or use one-account-per-worker strategy.

## Adding new authenticated tests
- Write tests normally using `page`.
- For behavior requiring an authenticated session, rely on the saved `storageState` (no per-test sign-in).
- If you need multiple roles (admin, user), extend `global-setup.ts` to generate multiple `playwright/.clerk/<role>.json` files and use `test.use({ storageState: 'playwright/.clerk/admin.json' })` in the relevant `describe` blocks.

## Key file references (quick)
- `playwright.config.ts` — test runner config and project dependency wiring.
- `tests/e2e/global-setup.ts` — authenticate + persist storage state.
- `playwright/.clerk/user.json` — saved authenticated state.
- `tests/e2e/fixtures/auth.ts` — test harness `test` export (no sign-in logic).
- `tests/e2e/*.spec.ts` — spec files.

## Troubleshooting checklist (quick)
1. Are env vars set? `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_TEST_EMAIL`.
2. Is dev server running or reachable? (Playwright can start it per config.)
3. Does `playwright/.clerk/user.json` exist? If not, run global setup to create it.
4. If a test can't find UI elements, open the HTML report (`npx playwright show-report`) and inspect screenshots/traces.

---
Saved: `tests/E2E_TESTS.md` — place any follow-up questions or requests (CI example workflows, per-worker auth, role-based tests) and I can expand this doc with examples for those scenarios.
