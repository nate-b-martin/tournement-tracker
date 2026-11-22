# Feature: CRUD Mutations for Core Entities (Players, Teams, Tournaments)

## Overview
Add create, update, and delete mutations for the three core domain entities — players, teams, and tournaments. Currently, only `userProfiles` has mutations. Without these, the app is read-only for all tournament data.

## Current State
- `convex/players.ts` — has `count`, `list`, `getById`, `search` queries only
- `convex/teams.ts` — has `count`, `list` queries only
- `convex/tournaments.ts` — has `count` query only
- PlayersTable and TeamsTable have empty `handleEdit` / `handleDelete` stubs with `// TODO` comments
- No way to create new players, teams, or tournaments
- Only `userProfiles.ts` has mutations (`createUserProfile`, `updateUserRole`)

## Implementation Steps

### Step 1: Player Mutations (`convex/players.ts`)

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    teamId: v.id("teams"),
    firstName: v.string(),
    lastName: v.string(),
    jerseyNumber: v.optional(v.number()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    birthDate: v.optional(v.number()),
    isCaptain: v.optional(v.boolean()),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("injured"),
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("players", {
      ...args,
      userId: identity.subject,
      isCaptain: args.isCaptain ?? false,
      status: args.status ?? "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("players"),
    teamId: v.optional(v.id("teams")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    jerseyNumber: v.optional(v.number()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    birthDate: v.optional(v.number()),
    isCaptain: v.optional(v.boolean()),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("injured"),
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const { id, ...fields } = args;
    await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("players") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
  },
});
```

### Step 2: Team Mutations (`convex/teams.ts`)

```typescript
export const create = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    name: v.string(),
    description: v.optional(v.string()),
    coachName: v.string(),
    coachEmail: v.string(),
    coachPhone: v.string(),
    city: v.optional(v.string()),
    homeField: v.optional(v.string()),
    organization: v.optional(v.string()),
    teamAgeGroup: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("suspended"),
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("teams", {
      ...args,
      status: args.status ?? "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("teams"),
    tournamentId: v.optional(v.id("tournaments")),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    coachName: v.optional(v.string()),
    coachEmail: v.optional(v.string()),
    coachPhone: v.optional(v.string()),
    city: v.optional(v.string()),
    homeField: v.optional(v.string()),
    organization: v.optional(v.string()),
    teamAgeGroup: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("suspended"),
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const { id, ...fields } = args;
    await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("teams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
  },
});
```

### Step 3: Tournament Mutations (`convex/tournaments.ts`)

```typescript
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    sport: v.string(),
    location: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    registrationDeadline: v.optional(v.number()),
    maxTeams: v.number(),
    minTeams: v.number(),
    bracketType: v.union(
      v.literal("single"),
      v.literal("double_elimination"),
      v.literal("round_robin"),
    ),
    fieldsAvailable: v.number(),
    gameDuration: v.number(),
    breakBetweenGames: v.number(),
    seedingType: v.union(
      v.literal("random"),
      v.literal("manual"),
      v.literal("ranking"),
    ),
    gameFormatRules: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("registration_open"),
      v.literal("registration_closed"),
      v.literal("active"),
      v.literal("complete"),
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("tournaments", {
      ...args,
      organizerId: identity.subject,
      currentTeamCount: 0,
      status: args.status ?? "draft",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tournaments"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    sport: v.optional(v.string()),
    location: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    registrationDeadline: v.optional(v.number()),
    maxTeams: v.optional(v.number()),
    minTeams: v.optional(v.number()),
    bracketType: v.optional(v.union(
      v.literal("single"),
      v.literal("double_elimination"),
      v.literal("round_robin"),
    )),
    fieldsAvailable: v.optional(v.number()),
    gameDuration: v.optional(v.number()),
    breakBetweenGames: v.optional(v.number()),
    seedingType: v.optional(v.union(
      v.literal("random"),
      v.literal("manual"),
      v.literal("ranking"),
    )),
    gameFormatRules: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("registration_open"),
      v.literal("registration_closed"),
      v.literal("active"),
      v.literal("complete"),
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("tournaments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    await ctx.db.delete(args.id);
  },
});
```

### Step 4: Add Additional Queries
Add `getById` and `search` to `convex/tournaments.ts`:

```typescript
export const list = query({
  args: {
    pagination: v.optional(v.object({
      pageIndex: v.number(),
      pageSize: v.number(),
    })),
    sorting: v.optional(v.object({
      field: v.string(),
      direction: v.union(v.literal("asc"), v.literal("desc")),
    })),
    filtering: v.optional(v.object({
      search: v.optional(v.string()),
      status: v.optional(v.array(v.string())),
      sport: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    let tournaments = await ctx.db.query("tournaments").collect();

    if (args.filtering?.search) {
      const term = args.filtering.search.toLowerCase();
      tournaments = tournaments.filter(
        (t) => t.name.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term) ||
          t.location?.toLowerCase().includes(term),
      );
    }

    if (args.filtering?.status?.length) {
      tournaments = tournaments.filter(
        (t) => args.filtering!.status!.includes(t.status),
      );
    }

    if (args.filtering?.sport) {
      tournaments = tournaments.filter(
        (t) => t.sport === args.filtering!.sport,
      );
    }

    if (args.sorting) {
      const { field, direction } = args.sorting;
      tournaments.sort((a, b) => {
        const aVal = a[field as keyof typeof a];
        const bVal = b[field as keyof typeof b];
        if (aVal === undefined && bVal === undefined) return 0;
        if (aVal === undefined) return direction === "asc" ? 1 : -1;
        if (bVal === undefined) return direction === "asc" ? -1 : 1;
        return aVal < bVal ? (direction === "asc" ? -1 : 1)
             : aVal > bVal ? (direction === "asc" ? 1 : -1)
             : 0;
      });
    }

    const totalCount = tournaments.length;

    if (args.pagination) {
      const { pageIndex, pageSize } = args.pagination;
      tournaments = tournaments.slice(
        pageIndex * pageSize,
        (pageIndex + 1) * pageSize,
      );
    }

    return { data: tournaments, totalCount };
  },
});

export const getById = query({
  args: { id: v.id("tournaments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

## Acceptance Criteria
- [ ] Player `create` mutation exists with teamId, firstName, lastName (required) and all optional fields
- [ ] Player `update` mutation exists with partial update support (all fields optional except id)
- [ ] Player `remove` mutation exists
- [ ] Team `create` mutation exists with tournamentId, name, coachName, coachEmail, coachPhone (required)
- [ ] Team `update` mutation exists with partial update support
- [ ] Team `remove` mutation exists
- [ ] Tournament `create` mutation exists with all required fields (name, sport, maxTeams, minTeams, bracketType, etc.)
- [ ] Tournament `update` mutation exists with partial update support
- [ ] Tournament `remove` mutation exists
- [ ] Tournament `list` query exists with pagination, sorting, filtering (search, status, sport)
- [ ] Tournament `getById` query exists
- [ ] All mutations validate auth with `ctx.auth.getUserIdentity()`
- [ ] All mutations properly set `updatedAt` / `createdAt` timestamps
- [ ] Generated API types are up to date after schema changes

## Edge Cases
- Deleting a team that has players assigned (should handle by unassigning players or preventing deletion)
- Deleting a tournament that has teams/games (cascade behavior — allow with warning, or prevent)
- Creating a team with a non-existent tournamentId (should fail gracefully)
- Updating a deleted record (Convex returns null, should handle)
- Duplicate player email within same team (no unique constraint — up to UX)
- Empty string validation for required fields

## Testing Considerations
- Test `create` with minimum required fields
- Test `create` with all fields
- Test `update` with single field change
- Test `update` with multiple field changes
- Test `remove` on existing record
- Test `remove` on non-existent ID
- Test all mutations without auth (should throw)
- Test tournament `list` with various filter combinations
- Verify `updatedAt` changes after update
- Verify `currentTeamCount` is 0 on tournament creation

## Related Files
- `convex/players.ts` — ADD mutations (create, update, remove)
- `convex/teams.ts` — ADD mutations (create, update, remove)
- `convex/tournaments.ts` — ADD mutations (create, update, remove) + queries (list, getById)
- `convex/schema.ts` — Verify schema supports all fields
- `convex/_generated/` — Auto-generated after convex deploy

## Helpful Resources

### Convex Mutations
- [Convex Mutations Documentation](https://docs.convex.dev/functions/mutations)
- [Convex Schema Validation](https://docs.convex.dev/database/schema)
- [Convex Auth in Mutations](https://docs.convex.dev/auth/patterns)

### Validation
- [Convex Validators (v)](https://docs.convex.dev/database/schema#validators)

## Notes
- All mutations must validate `ctx.auth.getUserIdentity()` — no anonymous writes
- Use optional chaining on all filter arguments to avoid null issues
- Tournament `seedingType` and `bracketType` are enums — use `v.union` for type safety
- Team status options: active, inactive, suspended
- Player status options: active, inactive, injured
- Tournament status options: draft, registration_open, registration_closed, active, complete
- Consider adding a `getByTournamentId` query on teams for tournament detail views
- After mutations are created, they must be deployed with `npx convex deploy` before useQuery/useMutation hooks can use them
