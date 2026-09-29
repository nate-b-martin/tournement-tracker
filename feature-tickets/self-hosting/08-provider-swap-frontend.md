# Ticket 08: Provider Swap — `ConvexAuthProvider` in the Root Layout

## Overview

Replace the Clerk+Convex provider chain in the root layout with Convex Auth's `ConvexAuthProvider` (`@convex-dev/auth/react`), reusing the already-exported Convex client from `src/router.tsx`. Delete the now-unused provider files and the `clerk:signout` event listener.

## Current State

- `src/routes/__root.tsx` wraps the app in `ConvexClerkProvider` and listens for `window` `"clerk:signout"` events to toast.
- Active provider: `src/integrations/convex-clerk-provider.tsx` (constructs its own `ConvexReactClient`, assumes `PUBLISHABLE_KEY`).
- Orphaned/unused: `src/integrations/clerk/provider.tsx`, `src/integrations/convex/provider.tsx`.
- `src/router.tsx` already exports a shared `convex` `ConvexReactClient`.

## Prerequisites

- [x] Ticket `05` (Convex Auth installed + backend wired)
- [x] `@convex-dev/auth/react` exports `ConvexAuthProvider` (verify export name against installed package)

## Implementation Steps

### Step 1: Rewire `src/routes/__root.tsx`

```tsx
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { convex } from "../router"; // already exported

// in RootDocument:
<ConvexAuthProvider client={convex}>
  <AuthErrorBoundary>…</AuthErrorBoundary>
</ConvexAuthProvider>
```

- Remove the `ConvexClerkProvider` import and its wrapper.
- Remove the `clerk:signout` listener effect. (Sign-out toast is handled by the sign-out button in ticket `10`.)
- Keep the existing client-mount gate used by the providers so SSR/hydration with `ConvexAuthProvider` (client state, localStorage token) does not mismatch. Convex Auth docs target client-side React apps; the gate is what makes this safe in TanStack Start.

### Step 2: Delete the old provider files

- `src/integrations/convex-clerk-provider.tsx`
- `src/integrations/clerk/provider.tsx`
- `src/integrations/convex/provider.tsx`

(Confirm no remaining imports reference them — `grep -rn "convex-clerk-provider|integrations/clerk/provider|integrations/convex/provider"`.)

### Step 3: Verify build + dev

```bash
npm run dev   # or build + serve
```

- Page renders signed-out with no console errors.
- No Clerk network calls (check devtools network tab for `clerk.accounts.dev`).

## Acceptance Criteria

- [ ] `ConvexAuthProvider` wraps the app with the shared `convex` client from `src/router.tsx`
- [ ] `clerk:signout` listener removed from `__root.tsx`
- [ ] All three old provider files deleted; zero imports remain
- [ ] App boots signed-out with no errors in dev
- [ ] No requests to `*.clerk.accounts.dev` / `*.convex.cloud` in the browser

## Testing Considerations

- SSR: confirm the shell HTML renders (no hydration mismatch noise) — run `npm run build` and preview.
- Authenticate (once ticket `10` exists) and reload: session survives (token in localStorage managed by `ConvexAuthProvider`).
- Confirm `AuthErrorBoundary` still catches provider init errors.

## Related Files

- `src/routes/__root.tsx` — modified
- `src/router.tsx` — reused (no change expected)
- `src/integrations/convex-clerk-provider.tsx` — DELETED
- `src/integrations/clerk/provider.tsx` — DELETED
- `src/integrations/convex/provider.tsx` — DELETED

## Helpful Resources

- https://labs.convex.dev/auth/setup (React provider section)
- https://labs.convex.dev/auth/authz (`useAuthToken`, auth state)

## Notes

- `ConvexAuthProvider` manages the JWT/session client-side; queries/mutations made through the shared `convex` client automatically carry the token.
- Keep provider mounting client-side-only to avoid SSR/localStorage mismatches.