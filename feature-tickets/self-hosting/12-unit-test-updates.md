# Ticket 12: Unit Test Updates — Swap Clerk Mocks for Convex Auth Mocks

## Overview

Update Vitest unit tests so nothing imports or mocks `@clerk/clerk-react`. Most tests already mock the app's `src/hooks/useAuth` (whose interface is unchanged by ticket `09`), so the work is mostly: replace the one Clerk module mock and adjust test renders that mount sign-in UI.

## Current State

- `tests/unit/components/Homepage.test.tsx` has `vi.mock("@clerk/clerk-react")` (provides `SignInButton` + `useUser`).
- Other component tests (`HomepageWizard`, `DashboardWizard`, `SeasonsPage`, `SeasonDetailPage`, `PlayerDetails`) mock `@/hooks/useAuth` — these should keep working as-is because the hook return type is unchanged.

## Prerequisites

- [x] Tickets `09` + `10` (hook + UI shipped)

## Implementation Steps

### Step 1: Inventory

```bash
rg -n "clerk" tests/unit
```

Expect exactly the `Homepage.test.tsx` mock (plus any stray `isSignedIn: true` fixtures which are app-hook mock values and fine).

### Step 2: Replace the Clerk mock in `Homepage.test.tsx`

Remove `vi.mock("@clerk/clerk-react")` entirely and, if the test renders the sign-in section, mock the new components instead. Two options:

**Option A (recommended):** mock `@/hooks/useAuth` only (like the other tests) and add a `vi.mock("@/components/auth/SignInDialog")` if the homepage sign-in CTA renders a dialog:

```tsx
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ /* signed-out-or-signed-in fixture as before */ }),
}));

vi.mock("@/components/auth/SignInDialog", () => ({
  SignInDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
```

**Option B:** if `SignInDialog` uses `useAuthActions`, mock `@convex-dev/auth/react`:

```tsx
vi.mock("@convex-dev/auth/react", () => ({
  useConvexAuth: () => ({ isLoading: false, isAuthenticated: false }),
  useAuthActions: () => ({ signIn: vi.fn(), signOut: vi.fn() }),
  useUser: () => null,
}));
```

Only reach for Option B if the test mounts the real dialog (prefer Option A for unit isolation).

### Step 3: Add unit tests for the new auth UI (optional but recommended)

Small `SignInDialog` test:
- renders email + password fields + submit
- calls `signIn("password", { email, password, flow })` on submit (mock `useAuthActions`)
- toggles to "create account" flow
- shows error message on rejected sign-in

`SignOutButton` test:
- calls `signOut()` and shows success toast (mock `toast` from `sonner` if used).

### Step 4: Update `src/test-utils` providers if needed

If `src/test-utils/setup.ts` or a test renderer wraps the app in providers that import `@clerk/*`, switch them to `ConvexAuthProvider` (or remove the wrapper — most component tests use hook mocks and simple render).

## Acceptance Criteria

- [ ] `rg -n "clerk" tests/unit` returns nothing
- [ ] `Homepage.test.tsx` no longer mocks `@clerk/clerk-react`; sign-in section renders via the mock/config used elsewhere
- [ ] Remaining `vi.mock("@/hooks/useAuth")` tests pass unchanged
- [ ] (Recommended) New unit tests for `SignInDialog` + `SignOutButton`
- [ ] `npm run test` green

## Testing Considerations

- Keep fixtures (`isSignedIn`, `isAdmin`, role) identical to today's `useAuth` mock shape to avoid touching unrelated assertions.
- If dialog tests mount real `useAuthActions`, ensure `@convex-dev/auth/react` is mocked to avoid needing a live backend.

## Related Files

- `tests/unit/components/Homepage.test.tsx`
- `tests/unit/components/SignInDialog.test.tsx` — NEW (optional)
- `tests/unit/components/SignOutButton.test.tsx` — NEW (optional)
- `src/test-utils/*` — check for Clerk wrappers

## Helpful Resources

- Vitest API: `vi.mock`, `hoisted` (`https://vitest.dev/api/vi.html#vi-mock`)
- Existing Homepage mock pattern as reference: `tests/unit/components/Homepage.test.tsx`

## Notes

- The app hook mock pattern (`vi.mock("@/hooks/useAuth")`) is the clean seam — prefer it over mocking Convex internals in every test.