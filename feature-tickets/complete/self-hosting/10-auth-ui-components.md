# Ticket 10: Auth UI — `SignInDialog`, `SignOutButton`, Replace Clerk Components

## Overview

Build the password sign-in/sign-up UI with Convex Auth and replace every Clerk component (`SignInButton`, `UserButton`, `useClerk`) across the app: `AuthWidget`, the Header user area, and the homepage sign-in section. Login UX: modal dialog with email + password and a "create account" toggle (first account becomes admin).

## Current State

Clerk is used in:

- `src/components/AuthWidget.tsx` — `SignInButton`, `UserButton`, `useClerk().signOut`
- `src/routes/index.tsx` — `SignInButton mode="modal"` in the "Tournament Administrator?" section
- `src/routes/__root.tsx` — `clerk:signout` listener (already removed in ticket `08`)
- `src/integrations/clerk/header-user.tsx` — Clerk header component

## Prerequisites

- [x] Tickets `08` + `09` (provider + hook)

## Implementation Steps

### Step 1: `src/components/auth/SignInDialog.tsx`

Modal dialog wrapping a `Dialog` (or `AlertDialog`) from shadcn/ui with a simple form:

```tsx
import { useAuthActions } from "@convex-dev/auth/react";

const { signIn } = useAuthActions();

// state: email, password, flow ("signIn" | "signUp"), error, isSubmitting

const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  try {
    await signIn("password", { email, password, flow });
    setOpen(false);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Sign in failed");
  }
};
```

- Fields: Email, Password (type="password"), submit button labeled "Sign In" / "Create account".
- Toggle link: "No account? Create one" / "Have an account? Sign in".
- Close on success (provider updates `useConvexAuth` → app re-renders signed-in).
- Accessibility: labels on inputs, `aria-describedby` for the error message, `type="button"` on toggle.

### Step 2: `src/components/auth/SignOutButton.tsx`

```tsx
import { useAuthActions } from "@convex-dev/auth/react";

const { signOut } = useAuthActions();
```

Button (matching AuthWidget's existing ghost/sm styling) that calls `signOut()` and toasts success/failure.

### Step 3: Rewrite `AuthWidget.tsx`

- Signed out → "Sign In" button that opens `SignInDialog`.
- Signed in → avatar/initials (from `user?.name`/`profile?.displayName`/first letter of email), name + email, role badge (Admin/View logic unchanged), and `SignOutButton`.
- Drop `UserButton` entirely (self-hosted has no Clerk UI) — use a simple initials circle. Styles should match the current badge/skeleton layout.

### Step 4: Update `src/routes/index.tsx`

Replace the `SignInButton mode="modal"` block with the same `SignInDialog` trigger in the "Tournament Administrator?" section.

### Step 5: Update/remove `src/integrations/clerk/header-user.tsx`

Delete the Clerk header-user component (or rewire it to `AuthWidget`) — the Header should use `AuthWidget`. Confirm the Header actually references it; `grep -rn "header-user" src/`. Remove leftover imports.

### Step 6: Sanity sweep

`grep -rn "SignInButton|UserButton|useClerk|SignedIn|SignedOut|clerk" src/ --include="*.tsx"` → resolve/remove every remaining hit (may include tests, coordinated with ticket `12`).

## Acceptance Criteria

- [ ] New `SignInDialog` signs in with a Password provider flow and toasts on error
- [ ] "Create account" toggle works; first signed-up user gets an admin profile server-side
- [ ] `SignOutButton` signs out and the UI returns to signed-out state
- [ ] `AuthWidget` renders initials avatar + role badge + email (no `UserButton`)
- [ ] `routes/index.tsx` sign-in section uses the dialog
- [ ] No `@clerk/*` imports remain in `src/` (excluding tests until ticket `12`)
- [ ] Buttons are `type="button"`; inputs have accessible labels; error message is `aria`-wired
- [ ] `npm run check` and `npm run build` pass

## Testing Considerations

- Manual: sign in as seeded admin; sign out; create a new account via the toggle and verify spectator role.
- Wrong password → inline error, dialog stays open.
- Double-submit guard while `isSubmitting`.
- Keyboard: dialog opens/closes with Escape; focus lands on email field.

## Related Files

- `src/components/auth/SignInDialog.tsx` — NEW
- `src/components/auth/SignOutButton.tsx` — NEW
- `src/components/AuthWidget.tsx` — REWRITE
- `src/routes/index.tsx` — sign-in section
- `src/integrations/clerk/header-user.tsx` — DELETE or rewire
- `src/components/Header.tsx` — confirm it uses `AuthWidget`

## Helpful Resources

- https://labs.convex.dev/auth/config/passwords (sign-in form example)
- https://labs.convex.dev/auth/authz (`useAuthActions`)
- shadcn/ui Dialog component (already in use: `src/components/ui/dialog` if present; else `bunx shadcn@latest add dialog`)

## Notes

- No password-reset/email-verification UI in scope — the Password provider's `reset` option is out of scope for this self-hosted single-admin app.
- Keep the dialog generic so E2E (ticket `13`) can select stable labels ("Email", "Password", "Sign In").