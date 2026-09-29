# Ticket 13: E2E Auth Rewrite — Form Sign-In as Seeded Admin

## Overview

Rewrite the Playwright authentication path: drop `@clerk/testing` and `@clerk/backend`, and sign in through the app's own `SignInDialog` using the **seeded admin** credentials (ticket `07`) in global-setup. Save the authenticated storage state for the other specs and update page-object selectors.

## Current State

- `tests/e2e/global-setup.ts` uses `createClerkClient`, `clerk`, `clerkSetup` from `@clerk/testing`/`@clerk/backend`; it creates a Clerk test user via the Backend API, signs in through Clerk's hosted UI, and saves `playwright/.clerk/user.json`.
- `playwright.config.ts` sets `storageState: "playwright/.clerk/user.json"` and injects `VITE_CLERK_PUBLISHABLE_KEY`.
- `tests/e2e/pages/ClerkLogin.ts`, `AuthPage.ts`, `Navigation.ts`, `ProtectedPage.ts` selectors reference Clerk UI (`userButton`, `signInButton`).

## Prerequisites

- [x] Tickets `03`, `07`, `10` (docker-up wiring, seeded admin, sign-in UI)
- [x] Run this only against a seeded backend (Docker stack or local `npx convex dev` + `npx convex seed`)

## Implementation Steps

### Step 1: Rewrite `global-setup.ts`

Remove Clerk imports. New flow:

```ts
import { test as setup, expect } from "@playwright/test";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config(); // .env.local

const ADMIN_EMAIL = process.env.SITE_ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.SITE_ADMIN_PASSWORD ?? "dev-password";
const authFile = path.join(__dirname, "../../playwright/.auth/user.json");

setup("sign in as seeded admin and save auth state", async ({ page }) => {
  // ensure backend + seed are present; fail loudly if seed missing
  await ensureBackendSeeded(page); // see Step 3

  await page.goto("/");
  await page.getByRole("button", { name: /sign in/i }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Email").fill(ADMIN_EMAIL);
  await dialog.getByLabel("Password").fill(ADMIN_PASSWORD);
  await dialog.getByRole("button", { name: /sign in/i }).click();

  // signed-in confirmation: auth widget shows the user's avatar/name
  await expect(page.getByText(new RegExp(ADMIN_EMAIL.split("@")[0], "i")))
    .toBeVisible({ timeout: 20_000 });

  await page.context().storageState({ path: authFile });
});
```

Notes:
- Read creds from `.env.local` (`SITE_ADMIN_EMAIL`/`SITE_ADMIN_PASSWORD`) added in ticket `07`/`.env.example`.
- The exact selectors must match `SignInDialog` from ticket `10` (keep labels stable).
- Use the app-level "Sign In" widget, not a hosted page.

### Step 2: Rename storage state path

- `playwright.config.ts`: `storageState: "playwright/.auth/user.json"` (update `.gitignore` from `playwright/.clerk` to `playwright/.auth`).
- Remove `VITE_CLERK_PUBLISHABLE_KEY` handling from `playwright.config.ts`.
- `tests/e2e/auth.spec.ts` unauthenticated block: `test.use({ storageState: { cookies: [], origins: [] } })` stays valid.

### Step 3: Add a seed precondition check

Add a helper (in `global-setup.ts` or a fixture) that verifies seed data is present before signing in, e.g. hit the backend or expect the admin email's UI to exist after trying sign-in. If seeding is missing (fresh volume), either run `npx convex run seed` via a placeholder page or instruct the developer: `docker compose exec ... npx convex run seed`. Make the failure message explicit.

### Step 4: Update page objects

- `tests/e2e/pages/ClerkLogin.ts` → replace with `SignInDialog` page object (or delete and inline into global-setup). If kept: `emailInput` = `getByLabel("Email")`, `passwordInput` = `getByLabel("Password")`, `signInButton` = `getByRole("button", { name: "Sign In" })`.
- `AuthPage.ts`: `signInButton` → app widget trigger; `userButton` → initials/name element (or the "Sign Out" affordance) since `UserButton` no longer exists.
- `Navigation.ts`, `ProtectedPage.ts`: audited for Clerk-specific selectors; keep assertions feature-level (`accessDeniedTitle`, heading text) rather than Clerk chrome.

### Step 5: `auth.spec.ts` expectations

The "shows user button when signed in" test becomes "shows signed-in user (name/avatar) when signed in". The "can sign out" test clicks `SignOutButton` (from `AuthWidget`) and expects the sign-in button to reappear.

## Acceptance Criteria

- [ ] global-setup has zero Clerk imports and signs in via the app dialog with seeded admin creds
- [ ] `playwright/.auth/user.json` is produced (and replaced in `.gitignore`)
- [ ] `playwright.config.ts` storageState + env updated (no Clerk key)
- [ ] Page objects/selectors updated; no `clerk` matches in `tests/e2e`
- [ ] `npm run test:e2e` passes against a seeded backend with a fresh storage state
- [ ] Unauthenticated + authenticated + sign-out specs all green

## Testing Considerations

- Run twice: first with a fresh storage file, then reusing it (storage-state fast path).
- Confirm failure mode when the backend is up but unseeded → helpful message, not a cryptic timeout.
- Verify RBAC-sensitive specs (ticket `14`) run as admin.

## Related Files

- `tests/e2e/global-setup.ts` — REWRITE
- `tests/e2e/pages/ClerkLogin.ts`, `AuthPage.ts`, `Navigation.ts`, `ProtectedPage.ts`
- `tests/e2e/auth.spec.ts`
- `playwright.config.ts`
- `.gitignore` (`playwright/.auth`)
- `.env.example` (E2E creds)

## Helpful Resources

- Playwright storageState: https://playwright.dev/docs/api/class-browsercontext#browser-context-storage-state
- https://labs.convex.dev/auth/authz (session in localStorage — captured by storageState)

## Notes

- Land this BEFORE ticket `11`'s `npm uninstall @clerk/*` to keep the tree buildable.
- The dialog labels ("Email", "Password", "Sign In") are a contract with ticket `10` — keep them exact.