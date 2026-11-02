# Ticket 07: Seed Auth Users — Admin, Organizer, Spectator

## Overview

Extend `convex/seed.ts` to create Convex Auth accounts (`users` + `authAccounts`) for deterministic testing: a **seed admin** (earns `userProfiles.role: "admin"`), plus organizer and spectator accounts for RBAC verification. Replace the legacy `user_clerk_*` ownership fixtures with the seeded auth user ids.

## Current State

- `convex/seed.ts` references `user_clerk_test_001` for `userProfiles.userId` and `organizerId` across seasons/tournaments, and `user_clerk_team1_p{i}` / `user_clerk_team2_p{i}` for player `userId`s.
- No Convex Auth accounts exist yet (ticket `05` adds the tables; ticket `06` updates id semantics).

## Prerequisites

- [x] Tickets `05` + `06` (auth tables exist; `getAuthUserId` semantics in place)
- [x] Decide credentials — recommended defaults, overridable via env:
  - Admin: `admin@example.com` / password from `SITE_ADMIN_PASSWORD`
  - Organizer: `organizer@example.com`
  - Spectator: `spectator@example.com`

## Implementation Steps

### Step 1: Understand the Password provider storage

Read `node_modules/@convex-dev/auth/dist/providers/Password*` (or `src/providers/Password.ts` in the GitHub repo). Confirm the exact shape of the `users` and `authAccounts` documents the Password provider writes, including:

- The `provider` value stored in `authAccounts` (the configured Password provider `id`, e.g. the string used as the provider key in `signIn("password", ...)`).
- Hashes via lucia `Scrypt` — `import { Scrypt } from "lucia";`

### Step 2: Add a seed helper in `convex/seed.ts`

```typescript
import { Scrypt } from "lucia";

async function ensureAuthUser(
  ctx: { db: ... },
  email: string,
  password: string,
  name: string,
): Promise<Id<"users">> {
  const existing = await ctx.db
    .query("authAccounts")
    .withIndex("by_userEmail", (q) => q.eq("email", email)) // verify actual index
    .first();
  if (existing) return existing.userId;
  const userId = await ctx.db.insert("users", {
    email,
    emailVerified: false,
    name,
    image: undefined,
  });
  const passwordHash = await new Scrypt().hash(password);
  await ctx.db.insert("authAccounts", {
    userId,
    provider: "password", // MUST match the Password provider's id used by the client
    passwordHash,
    // any other fields the provider requires
  });
  return userId;
}
```

**Important:** Verify against the real provider implementation before writing — account linking on sign-in is keyed by `(provider, email)`, so both the provider string and any other match fields must match what the client will send (`signIn("password", { email, password, flow: "signIn" })`).

Fallback if direct inserts drift from the provider contract: seed a "sign-up trigger" instead — have the E2E/global-setup sign up the admin through the UI once (existing first-user→admin rule promotes it), then the seed only ensures fixture `userProfiles` rows exist. Choose direct-insert as primary; keep this fallback documented in the ticket Notes.

### Step 3: Build userProfiles + ownership from auth ids

- Insert `userProfiles` for admin (role `admin`), organizer (role `organizer`), spectator (role `spectator`) keyed by their `users._id`.
- Replace every `organizerId: "user_clerk_test_001"` with the admin `users._id`.
- Replace `user_clerk_team1_p{i}` / `user_clerk_team2_p{i}` player `userId`s with the admin `users._id` (or leave `userId` undefined if the player→user link isn't intended — check `convex/players.ts` expectations).
- Keep `getIsFirstUser` consistent: since admin is pre-seeded, `createUserProfile` first-user logic will be inert for new signups (`spectator`).

### Step 4: Provide a `createAuthUsers` command

Either fold into `seed` or add `convex/seed.ts` export `ensureAuthSeedUsers` so CI/tests can guarantee the accounts exist idempotently.

### Step 5: Document credentials

Record default creds in `.env.example` (ticket `04`) and the E2E config (ticket `13`). Never hard-code real passwords in committed seed code — read from `process.env.SITE_ADMIN_PASSWORD` with a documented dev default.

## Acceptance Criteria

- [ ] Seeding creates Convex Auth `users` + `authAccounts` for admin/organizer/spectator
- [ ] Sign-in as `admin@example.com` (with the configured password) returns a valid session (verifiable end-to-end once ticket `10` ships) 
- [ ] `userProfiles`: exactly one `admin`, one `organizer`, one `spectator`
- [ ] Zero `user_clerk_*` string literals remain in `convex/seed.ts`
- [ ] Seasons/tournaments reference the seeded admin `users._id` as `organizerId`
- [ ] Seed is idempotent (rerun-safe) and clears/reseeds without duplicate auth accounts
- [ ] `npx convex run seed` succeeds against the target backend

## Testing Considerations

- Run seed against a fresh Docker volume and against a fresh local `~/.convex` store.
- Attempt a sign-in with a wrong password → rejected (verifies hashes stored correctly).
- Attempt sign-in as spectator → session valid, role `spectator` (RBAC check in ticket `14`).
- Rerun seed twice → counts stable (no duplicate users/authAccounts).

## Related Files

- `convex/seed.ts` — primary
- `convex/schema.ts` — already extended by ticket `05` (auth tables)
- `.env.example` — credentials (ticket `04`)
- `convex/userProfiles.ts` — role insert path (unchanged logic, keyed correctly)

## Helpful Resources

- https://labs.convex.dev/auth/config/passwords
- Password provider source: https://github.com/get-convex/convex-auth/blob/main/src/providers/Password.ts
- lucia `Scrypt`: shipped as a dependency of `@convex-dev/auth`

## Notes

- The **fallback strategy** (UI sign-up promotes first user to admin) is acceptable as a last resort but less deterministic; prefer direct account inserts that match the provider contract exactly.
- If the `authAccounts` index name is not `by_userEmail`, use the correct index from `convex/schema.ts` after ticket `05`.
- Keep passwords out of git: default dev password is fine in `.env.example`, but production creds must come from env.