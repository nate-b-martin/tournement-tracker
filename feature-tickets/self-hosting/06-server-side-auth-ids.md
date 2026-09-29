# Ticket 06: Server-Side Auth — `identity.subject` → `getAuthUserId(ctx)`

## Overview

Migrate every backend function that referenced Clerk's `identity.subject` to the Convex Auth–aware `getAuthUserId(ctx)` helper. With Clerk, `subject` was the Clerk user ID; with Convex Auth, `subject` is a user id joined to a session id (`"{users._id}::{authSessions._id}"`), so string equality checks against a bare user id are wrong.

## Current State

The following files use `identity.subject` (see `grep -rn "identity.subject" convex/`):

| File | Usages |
|---|---|
| `convex/userProfiles.ts` | `getCurrentUser`, `getUserRole`, `getIsFirstUser`, `createUserProfile`, (update role) — compares `args.userId !== identity.subject`, `createUserProfile` also inserts `userId: identity.subject` |
| `convex/teams.ts` | query filter `.eq("userId", identity.subject)` |
| `convex/players.ts` | query filter + `userId: identity.subject` on insert |
| `convex/games.ts` | query filter `.eq("userId", identity.subject)` |
| `convex/seasonGames.ts` | query filter |
| `convex/seasons.ts` | `organizerId: identity.subject` on insert |
| `convex/tournaments.ts` | `organizerId: identity.subject` on insert |
| `convex/seed.ts` | userProfiles lookup by subject |

## Prerequisites

- [x] Ticket `05` (Convex Auth installed; `getAuthUserId` available)

## Implementation Steps

### Step 1: Add the helper import

In each touched file:

```typescript
import { getAuthUserId } from "@convex-dev/auth/server";
```

### Step 2: Replace eagerly

Pattern A — **authenticated check + user id** (most cases):

```typescript
const userId = await getAuthUserId(ctx);
if (userId === null) {
  throw new Error("Unauthorized");
}
// userId is an Id<"users"> — use it for eq() filters, inserts, and comparisons
```

- `userProfiles.getCurrentUser`/`getUserRole`: compare `args.userId !== userId` (client passes the `users._id`, ticket `09`).
- `userProfiles.createUserProfile`: insert `userId` as the resolved `userId` from the token.
- `teams`/`players`/`games`/`seasonGames` filters: `.withIndex("by_userId", (q) => q.eq("userId", userId))`.
- `players` insert: `userId` = token user id.
- `seasons`/`tournaments` insert: `organizerId` = token user id.

Pattern B — **anything that must still read raw identity**: if a function needs the session id or custom claims, keep `ctx.auth.getUserIdentity()` for those extras, but never compare `subject` to a bare user id.

### Step 3: Keep behavior identical

- Auth-guard semantics (`throw new Error("Unauthorized")`) unchanged.
- `getIsFirstUser` still checks whether any `userProfiles` row exists.
- The first-user→admin rule in `createUserProfile` stays (ticket `07` will pre-seed admin so it rarely triggers).

### Step 4: Update seed.ts ownership refs

The seed inserts `userProfiles.userId: "user_clerk_test_001"` and `organizerId: "user_clerk_test_001"` across entities. These IDs must map to the seeded Convex Auth user ids from ticket `07` — resolve them in seed code (e.g. look up the seeded `users` doc and use `users._id`). Do this as part of ticket `07`; this ticket only removes `identity.subject` from seed so it doesn't break.

### Step 5: Typecheck + lint

```bash
npx convex dev --once   # regenerate _generated bindings if needed
npm run check
npm run build
```

## Acceptance Criteria

- [ ] `grep -rn "identity.subject" convex/` returns NO matches (excluding `_generated/`)
- [ ] `userProfiles` compares against the token-derived `getAuthUserId(ctx)` result, not raw `subject`
- [ ] Inserts of `userId`/`organizerId` use the token user id (Convex Auth `users._id`)
- [ ] All existing `.withIndex("by_userId", ...)` filters are keyed on the correct id
- [ ] Unauthorized guards unchanged (`getUserIdentity()` null → throw)
- [ ] `npm run check` and `npm run build` pass

## Testing Considerations

- With Convex Auth enabled but no sign-in, all guarded functions must still throw `Unauthorized`.
- After ticket `07` seeds an admin and ticket `09` wires the client, verify `getCurrentUser` returns the admin profile for the matching user and throws `Forbidden` for another user's id.
- Re-run existing unit tests (mock layer may assert `getUserIdentity` — update mocks per ticket `12`).

## Related Files

- `convex/userProfiles.ts`, `teams.ts`, `players.ts`, `games.ts`, `seasonGames.ts`, `seasons.ts`, `tournaments.ts`, `seed.ts`
- `src/hooks/useAuth.ts` (consumes the new user-id semantics — coordinated in ticket `09`)

## Helpful Resources

- https://labs.convex.dev/auth/authz (`getAuthUserId` usage)
- `node_modules/@convex-dev/auth/dist/server/` for the `getAuthUserId` signature

## Notes

- `getAuthUserId` returns `Id<"users"> | null` — null means unauthenticated, equivalent to the old `identity === null` check.
- Do not bundle CSS/UI here; this ticket is backend-only.