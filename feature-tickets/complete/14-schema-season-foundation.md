# Feature 14: Schema & Backend Foundation — Seasons, SeasonTeams, SeasonGames

## Overview
Add three new database tables to the Convex schema (`seasons`, `seasonTeams`, `seasonGames`) and add a `seasonId` field to the `tournaments` table. This establishes the data model for a season-based tournament system where seasons contain teams (via join table) and have regular-season games ending in a championship tournament.

## Current State
- Schema has: `tournaments`, `teams`, `players`, `games`, `fields`, `gameStats`, `userProfiles`
- No concept of "season" exists
- Tournaments are standalone — no parent grouping
- Teams have `tournamentId` directly (FK to tournaments)

## Desired State

### Table: `seasons`
```typescript
seasons: defineTable({
  name: v.string(),           // e.g. "Spring 2026"
  sport: v.string(),          // e.g. "Softball"
  description: v.optional(v.string()),
  startDate: v.number(),      // ms timestamp
  endDate: v.number(),        // ms timestamp
  status: v.union(
    v.literal("planning"),
    v.literal("active"),
    v.literal("complete"),
  ),
  organizerId: v.string(),    // Clerk user ID
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_organizerId", ["organizerId"]),
```

### Table: `seasonTeams` (many-to-many join)
```typescript
seasonTeams: defineTable({
  seasonId: v.id("seasons"),
  teamId: v.id("teams"),
  createdAt: v.number(),
})
  .index("by_seasonId", ["seasonId"])
  .index("by_teamId", ["teamId"]),
```

### Table: `seasonGames` (regular season schedule)
```typescript
seasonGames: defineTable({
  seasonId: v.id("seasons"),
  homeTeamId: v.id("teams"),
  awayTeamId: v.id("teams"),
  scheduledDate: v.number(),    // ms timestamp
  homeScore: v.optional(v.number()),
  awayScore: v.optional(v.number()),
  status: v.union(
    v.literal("scheduled"),
    v.literal("completed"),
  ),
  location: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_seasonId", ["seasonId"]),
```

### Modification: Add `seasonId` to `tournaments`
Add optional field to link a tournament to its parent season:
```typescript
seasonId: v.optional(v.id("seasons")),
```
This is optional — existing standalone tournaments remain unaffected. Tournaments created via the Setup Wizard will include `seasonId`.

## Implementation Steps

### Step 1: Add new table definitions to `convex/schema.ts`
Insert after the `tournaments` table definition:
- `seasons` table with all fields and `.index("by_organizerId", ["organizerId"])`
- `seasonTeams` table with `.index("by_seasonId", ["seasonId"])` and `.index("by_teamId", ["teamId"])`
- `seasonGames` table with `.index("by_seasonId", ["seasonId"])`

### Step 2: Add `seasonId` to `tournaments` schema
Add `seasonId: v.optional(v.id("seasons")),` to the tournaments table definition.

### Step 3: Generate types
Run `npx convex dev` to regenerate the `_generated` types.

## Acceptance Criteria
- [ ] `seasons` table added with all fields and `by_organizerId` index
- [ ] `seasonTeams` join table added with `by_seasonId` and `by_teamId` indexes
- [ ] `seasonGames` table added with `by_seasonId` index
- [ ] `seasonId` optional FK field added to `tournaments` table
- [ ] All fields use proper Convex validators (`v.string()`, `v.number()`, `v.optional()`, etc.)
- [ ] Indexes on frequently-queried fields prevent full table scans
- [ ] `npx convex dev` runs without errors after changes
- [ ] Existing standalone tournaments still work without `seasonId`

## Testing Considerations
- Verify schema deploys cleanly with `npx convex dev`
- Insert test documents for each new table via Convex dashboard
- Verify indexes are created (check Convex dashboard → Data → Indexes)
- Test that tournaments can be created with and without `seasonId`
- Verify join table direction: query `seasonTeams` by `seasonId` and by `teamId`

## Related Files
- `convex/schema.ts` — MODIFY (add 3 tables + modify tournaments)

## Dependency
- This ticket must be completed before Ticket 15 (Season Convex Functions)
- This ticket must be completed before Ticket 19 (Season Detail Page)

## Helpful Resources
- [Convex Schema & Validators](https://docs.convex.dev/database/schemas)
- [Convex Index Definitions](https://docs.convex.dev/database/indexes)
- [Convex ID Types](https://docs.convex.dev/database/types#referencing-documents)

## Notes
- `seasonId` on tournaments is optional (`v.optional()`) so existing code doesn't break
- The `by_organizerId` index on seasons enables efficient per-user listing
- The `by_seasonId` + `by_teamId` indexes on `seasonTeams` allow efficient lookups in both directions
- Timestamps stored as JS milliseconds (`Date.now()`) consistent with existing tables
- `seasonGames.status` uses `"scheduled"` / `"completed"` — same pattern as `games.status` but simplified
