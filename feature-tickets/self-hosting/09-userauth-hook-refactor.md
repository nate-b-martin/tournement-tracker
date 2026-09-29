# Ticket 09: Refactor `src/hooks/useAuth.ts` — Convex Auth State

## Overview

Rewire the app's `useAuth` hook off Clerk's `useUser()` and onto Convex Auth's `useConvexAuth()` + `useUser()`. The hook's **public return shape stays identical** so `ProtectedRoute`, pages, and the Header don't change. The "not configured" fallback switches from "no Clerk key" to "no Convex URL".

## Current State

- `src/hooks/useAuth.ts` calls `useUser()` from `@clerk/clerk-react`, queries `api.userProfiles.getCurrentUser` with Clerk `user.id`, and auto-creates a profile via `createUserProfile`.
- Fallback: if `VITE_CLERK_PUBLISHABLE_KEY` is absent → returns a safe unauthenticated object.
- Profile query is gated on `isSignedIn && user ? { userId: user.id } : "skip"`.

## Prerequisites

- [x] Ticket `08` (provider swap)
- [x] Ticket `06` (backend `getCurrentUser` compares against Convex Auth user id)

## Implementation Steps

### Step 1: New imports & auth state

```tsx
import { useConvexAuth, useUser } from "@convex-dev/auth/react";
```

- `const { isLoading: authLoading, isAuthenticated } = useConvexAuth();`
- `const user = useUser();` — the Convex Auth `users` doc (`{ _id, email, name, image, ... }`), or `null` when signed out.

### Step 2: Profile query + auto-create

```tsx
const userId = isAuthenticated && user ? user._id : "skip";
const profile = useQuery(api.userProfiles.getCurrentUser, userId);

const createProfile = useMutation(api.userProfiles.createUserProfile);
```

Keep the existing `useEffect` auto-create guard, but:
- trigger key: `isAuthenticated && user && profile === null`
- arguments: `createProfile({ userId: user._id, email: user.email, displayName: user.name })`

### Step 3: Fallback condition

Replace the Clerk-key check with the Convex-config check:

```tsx
if (!import.meta.env.VITE_CONVEX_URL) {
  return { /* same safe unauthenticated defaults as today */ };
}
```

### Step 4: Derived state

- `isSignedIn = isAuthenticated`
- `isLoaded = !authLoading` (plus the existing profile-creation busy state)
- `user` continues to be exposed for name/email fallbacks (`user?.name`, `user?.email`).
- `isAdmin/isOrganizer/isPlayer/isSpectator` from `profile?.role` — unchanged.
- Keep offline detection, retry counter, and toast logic as-is.

### Step 5: Update anything consuming Clerk-specific fields

Grep the app for `primaryEmailAddress`, `firstName`, `fullName`, `username` (Clerk user shape) and switch to Convex Auth equivalents (`email`, `name`). Most references centralize on `useAuth`'s returned `user` + `profile`; fix those here or in ticket `10` when the UI is rebuilt.

## Acceptance Criteria

- [ ] `useAuth` return shape unchanged (no consumer re-writes required beyond ticket `10`)
- [ ] Uses `useConvexAuth` + `useUser` from `@convex-dev/auth/react`; zero `@clerk/clerk-react` imports in the hook
- [ ] Profile query keyed on Convex Auth `users._id` with `"skip"` when signed out
- [ ] Auto profile creation runs with Convex Auth user data and is idempotent
- [ ] Fallback activates when `VITE_CONVEX_URL` is unset
- [ ] `npm run check` + `npm run build` pass

## Testing Considerations

- Signed out: `isLoaded: true`, `isSignedIn: false`, no profile query fired.
- Signed in as seed admin: profile auto-created (or already exists), `isAdmin: true`.
- Second account: role `spectator`.
- Unit tests that mock `@clerk/clerk-react` are updated separately (ticket `12`).

## Related Files

- `src/hooks/useAuth.ts` — REWRITE internals (same exports/types)
- `src/components/ProtectedRoute.tsx` — no change (consumes the stable interface)
- `src/components/AuthWidget.tsx`, `src/routes/index.tsx` — consume `user` fields; cleaned up in ticket `10`

## Helpful Resources

- https://labs.convex.dev/auth/authz — `useConvexAuth`, `useUser`, `useAuthActions`

## Notes

- Keep the exported `Role`/`UserProfile` types and the rest of the interface byte-for-byte stable to avoid cascading changes.
- The `user` object shape differs from Clerk's; centralize name/email fallbacks so only this hook (and ticket `10`) touch them.