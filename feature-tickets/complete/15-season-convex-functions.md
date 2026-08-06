# Feature 15: Season Convex Functions — CRUD for Seasons, SeasonTeams, SeasonGames

## Overview
Create the Convex query and mutation functions for the `seasons`, `seasonTeams`, and `seasonGames` tables, and update `convex/tournaments.ts` to accept `seasonId`. All functions follow the existing patterns in `convex/tournaments.ts`, `convex/teams.ts`, and `convex/players.ts`.

## Prerequisites
- [ ] Ticket 14 — Schema must have `seasons`, `seasonTeams`, `seasonGames` tables deployed

## Implementation Steps

### Step 1: Create `convex/seasons.ts`

**count** — total seasons count
```typescript
// No args
// Returns: number
```

**list** — paginated, sorted, filtered seasons
```typescript
// Args: { pagination?, sorting?, filtering?: { search?, status?, sport? } }
// Returns: { data: Season[], totalCount: number }
// Follow query pattern from convex/tournaments.ts list()
```

**getById** — single season with team data
```typescript
// Args: { id: v.id("seasons") }
// Returns: Season | null
// Optionally queries seasonTeams to include team count
```

**create** — auth-guarded mutation
```typescript
// Args: { name, sport, description?, startDate, endDate, status? }
// Auth: ctx.auth.getUserIdentity() required
// Sets: organizerId, createdAt, updatedAt, default status "planning"
```

**update** — partial update mutation
```typescript
// Args: { id, name?, sport?, description?, startDate?, endDate?, status? }
// Auth: ctx.auth.getUserIdentity() required
// Sets: updatedAt = Date.now()
```

**remove** — cascading delete mutation
```typescript
// Args: { id: v.id("seasons") }
// Auth: ctx.auth.getUserIdentity() required
// Deletes: seasonTeams entries, seasonGames entries, unlinks tournaments (sets seasonId to undefined)
// Does NOT delete teams or tournaments themselves
```

### Step 2: Create `convex/seasonTeams.ts`

**listBySeason** — teams in a season with team details
```typescript
// Args: { seasonId: v.id("seasons") }
// Returns array of teams (joins via seasonTeams → teams)
// Uses by_seasonId index
```

**addTeams** — bulk-assign teams to season
```typescript
// Args: { seasonId: v.id("seasons"), teamIds: v.array(v.id("teams")) }
// Auth: ctx.auth.getUserIdentity() required
// Inserts seasonTeams documents for each team (skips duplicates)
```

**removeTeam** — remove a team from season
```typescript
// Args: { seasonId: v.id("seasons"), teamId: v.id("teams") }
// Auth: ctx.auth.getUserIdentity() required
// Deletes the seasonTeams document
```

### Step 3: Create `convex/seasonGames.ts`

**listBySeason** — all games for a season with team joins
```typescript
// Args: { seasonId: v.id("seasons") }
// Returns array of games with homeTeam and awayTeam data joined
// Uses by_seasonId index
```

**create** — create a new season game
```typescript
// Args: { seasonId, homeTeamId, awayTeamId, scheduledDate, location? }
// Auth: ctx.auth.getUserIdentity() required
// Sets: status "scheduled", createdAt, updatedAt
```

**update** — update game result
```typescript
// Args: { id, homeScore?, awayScore?, status?, scheduledDate?, location? }
// Auth: ctx.auth.getUserIdentity() required
// Sets: updatedAt = Date.now()
```

**remove** — delete a season game
```typescript
// Args: { id: v.id("seasonGames") }
// Auth: ctx.auth.getUserIdentity() required
```

### Step 4: Update `convex/tournaments.ts`

Add `seasonId: v.optional(v.id("seasons"))` to:
- `create` mutation args
- `update` mutation args
- Pass through to `ctx.db.insert` / `ctx.db.patch`

None of these changes are breaking — `seasonId` is optional everywhere.

## Acceptance Criteria
- [ ] `convex/seasons.ts` created with count, list, getById, create, update, remove
- [ ] `convex/seasonTeams.ts` created with listBySeason, addTeams, removeTeam
- [ ] `convex/seasonGames.ts` created with listBySeason, create, update, remove
- [ ] `convex/tournaments.ts` create/update accept optional seasonId
- [ ] All mutations validate auth with `ctx.auth.getUserIdentity()`
- [ ] All queries use `.withIndex()` for filtered lookups
- [ ] Season remove cascades: deletes seasonTeams + seasonGames, unlinks tournaments
- [ ] SeasonTeams addTeams handles duplicate team IDs gracefully
- [ ] Functions properly typed with Convex validators
- [ ] `npx convex dev` runs without errors

## Edge Cases
- Removing a season that has linked tournaments (should unlink, not delete tournaments)
- Adding duplicate team to same season (should skip, not error)
- Empty season with no teams or games
- Season with many teams (100+) — verify pagination or appropriate limits
- Editing a season game that's already completed

## Testing Considerations
- Test season CRUD lifecycle: create → update → remove
- Test cascading delete from seasons to seasonTeams/seasonGames
- Verify tournaments remain after their parent season is deleted (unlinked, not deleted)
- Test auth: unauthenticated calls should throw
- Test seasonTeams.listBySeason returns correct teams
- Test seasonGames.listBySeason returns games with joined team data

## Related Files
- `convex/seasons.ts` — NEW
- `convex/seasonTeams.ts` — NEW
- `convex/seasonGames.ts` — NEW
- `convex/tournaments.ts` — MODIFY (add seasonId)

## Dependency
- Blocked by Ticket 14 (schema must be deployed first)
- This ticket must be completed before Ticket 16 (hooks)
- This ticket must be completed before Ticket 17 (Setup Wizard)
- This ticket must be completed before Ticket 19 (Season Detail Page)

## Helpful Resources
- [Convex Queries](https://docs.convex.dev/functions/query-functions)
- [Convex Mutations](https://docs.convex.dev/functions/mutation-functions)
- [Convex Auth Patterns](https://docs.convex.dev/auth/clerk)
- Reference `convex/tournaments.ts` for list/create pattern
- Reference `convex/players.ts` for bulk-assign pattern
- Reference `convex/teams.ts` for cascading delete pattern

## Notes
- Follow existing code style: same error messages, same date handling, same auth checks
- `listBySeason` in seasonTeams should join the teams table to return full team objects
- `addTeams` should use a loop with individual inserts to skip duplicates (check existence first)
- Season status lifecycle: `planning` → `active` → `complete`
- `npx convex dev` auto-generates types — no manual _generated edits needed
