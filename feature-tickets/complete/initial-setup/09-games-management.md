# Feature: Games Management

## Overview
Build full CRUD for games — schedule games between teams, record scores, and track game status. Games are the core competitive unit in a tournament, connecting teams, fields, and scores. Currently games exist only in the schema and seed data.

## Current State
- `convex/schema.ts` has `games` table with fields: tournamentId, round, gameNumber, team1Id, team2Id, winnerId, scheduledTime, actualStartTime, actualEndTime, fieldId, team1Score, team2Score, status
- Seed data has 2 games inserted (1 completed, 1 scheduled)
- No `convex/games.ts` file exists
- No games route, component, or hook exists
- No way to view, create, edit, or delete games from the UI
- No way to schedule games within a tournament context

## Prerequisites
- [ ] Ticket `06-crud-mutations.md` — tournament CRUD mutations must exist
- [ ] Ticket `08-create-edit-flows.md` — dialog patterns established

## Implementation Steps

### Step 1: Create Games Convex Functions (`convex/games.ts`)

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const count = query({
  args: {
    tournamentId: v.optional(v.id("tournaments")),
  },
  handler: async (ctx, args) => {
    let games = await ctx.db.query("games").collect();
    if (args.tournamentId) {
      games = games.filter((g) => g.tournamentId === args.tournamentId);
    }
    return games.length;
  },
});

export const list = query({
  args: {
    tournamentId: v.optional(v.id("tournaments")),
    pagination: v.optional(v.object({
      pageIndex: v.number(),
      pageSize: v.number(),
    })),
    sorting: v.optional(v.object({
      field: v.string(),
      direction: v.union(v.literal("asc"), v.literal("desc")),
    })),
    filtering: v.optional(v.object({
      status: v.optional(v.array(v.string())),
      round: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    let games = await ctx.db.query("games").collect();

    if (args.tournamentId) {
      games = games.filter((g) => g.tournamentId === args.tournamentId);
    }

    if (args.filtering?.status?.length) {
      games = games.filter((g) => args.filtering!.status!.includes(g.status));
    }

    if (args.filtering?.round !== undefined) {
      games = games.filter((g) => g.round === args.filtering!.round);
    }

    if (args.sorting) {
      const { field, direction } = args.sorting;
      games.sort((a, b) => {
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

    // Fetch team names for each game
    const gamesWithTeams = await Promise.all(
      games.map(async (game) => {
        const [team1, team2, winner] = await Promise.all([
          ctx.db.get(game.team1Id),
          ctx.db.get(game.team2Id),
          game.winnerId ? ctx.db.get(game.winnerId) : null,
        ]);
        return { ...game, team1, team2, winner };
      }),
    );

    const totalCount = gamesWithTeams.length;

    if (args.pagination) {
      const { pageIndex, pageSize } = args.pagination;
      return {
        data: gamesWithTeams.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
        totalCount,
      };
    }

    return { data: gamesWithTeams, totalCount };
  },
});

export const getByTournament = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const games = await ctx.db.query("games").collect();
    const tournamentGames = games.filter(
      (g) => g.tournamentId === args.tournamentId,
    );

    return await Promise.all(
      tournamentGames.map(async (game) => {
        const [team1, team2, winner] = await Promise.all([
          ctx.db.get(game.team1Id),
          ctx.db.get(game.team2Id),
          game.winnerId ? ctx.db.get(game.winnerId) : null,
        ]);
        return { ...game, team1, team2, winner };
      }),
    );
  },
});

export const create = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    round: v.number(),
    gameNumber: v.number(),
    team1Id: v.id("teams"),
    team2Id: v.id("teams"),
    scheduledTime: v.optional(v.number()),
    fieldId: v.optional(v.id("fields")),
    status: v.optional(v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("postponed"),
      v.literal("cancelled"),
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("games", {
      ...args,
      status: args.status ?? "scheduled",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("games"),
    team1Score: v.optional(v.number()),
    team2Score: v.optional(v.number()),
    winnerId: v.optional(v.id("teams")),
    status: v.optional(v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("postponed"),
      v.literal("cancelled"),
    )),
    scheduledTime: v.optional(v.number()),
    actualStartTime: v.optional(v.number()),
    actualEndTime: v.optional(v.number()),
    fieldId: v.optional(v.id("fields")),
    round: v.optional(v.number()),
    gameNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("games") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Also remove associated gameStats
    const stats = await ctx.db.query("gameStats").collect();
    const gameStats = stats.filter((s) => s.gameId === args.id);
    for (const stat of gameStats) {
      await ctx.db.delete(stat._id);
    }

    await ctx.db.delete(args.id);
  },
});
```

### Step 2: Create Games Hook (`src/hooks/useGames.ts`)

Follow the same pattern as `usePlayers.ts` / `useTeams.ts`:
- `useGames` — paginated, filtered, sorted game list with team data
- `useGamesByTournament` — all games for a specific tournament
- `useGameCount` — total game count
- `useGameMutations` — wrapper returning create, update, remove mutations

### Step 3: Create GamesTable Component (`src/components/GamesTable.tsx`)

Columns:
- Round, Game #, Team 1 vs Team 2 (with names), Score (T1 - T2), Field, Status (colored badge), Scheduled Time
- Conditional winner highlighting (bold/check for winning team)
- Sortable columns
- Edit/Delete actions for admins
- Toolbar with status filters
- A "Record Score" action for games in progress

### Step 4: Create Game Dialog (`src/components/GameDialog.tsx`)

Create form with:
- tournamentId (pre-selected from context)
- round (number)
- gameNumber (number)
- team1Id / team2Id (select from teams in tournament)
- fieldId (select from tournament fields)
- scheduledTime (datetime picker)
- status select

Edit form additionally:
- team1Score / team2Score (number inputs)
- winnerId (auto-calculated based on scores, or manual override)
- actualStartTime / actualEndTime

### Step 5: Create Game Management Route or Section

Option A: Games as a sub-route (`/tournaments/$id/games`)
Option B: Games section within tournament detail page
Option C: Standalone games route with tournament filter

Recommendation: Start with a games section within the tournament detail page (Option B, to be built in ticket 10). Also add a "Schedule Games" action on the tournament page.

## Acceptance Criteria
- [ ] Games Convex functions exist: count, list, getByTournament, create, update, remove
- [ ] Games list returns team names alongside each game
- [ ] Games can be created with tournament, round, game number, teams, field, scheduled time
- [ ] Game scores can be recorded via edit
- [ ] Winner is automatically determined by score or manually set
- [ ] Game status transitions: scheduled → in_progress → completed | postponed | cancelled
- [ ] Games table shows all key columns with colored status badges
- [ ] Delete game also cleans up associated gameStats
- [ ] Auth validation on all mutations
- [ ] Games are filterable by tournament, status, and round
- [ ] Admin-only edit/delete on games

## Edge Cases
- Both teams are the same (should prevent)
- Score entered without a winner (auto-determine from score, or allow draw)
- Game cancelled after scores entered (clear scores or keep them?)
- Postponed game rescheduling (update scheduledTime)
- Team deleted after being assigned to a game (show "Deleted Team")
- Tournament deletion cascade — should also delete games
- Games in a tournament with no fields assigned

## Testing Considerations
- Test game creation with minimum required fields
- Test score recording updates winner correctly
- Test status transitions
- Test games list returns teams
- Test filter by tournament, status, round
- Test game deletion cascades to gameStats
- Test auth validation on mutations

## Related Files
- `convex/games.ts` — NEW (all queries and mutations)
- `src/hooks/useGames.ts` — NEW
- `src/components/GamesTable.tsx` — NEW
- `src/components/GameDialog.tsx` — NEW
- `convex/schema.ts` — Verify games table schema
- `convex/seed.ts` — Update seed with more game variety if needed

## Helpful Resources

### Convex Joining
- [Convex Database Get](https://docs.convex.dev/database/reading-data#get)
- [Convex Promise.all patterns](https://docs.convex.dev/database/reading-data#fetching-multiple-documents)

### Game Scheduling
- [Tournament scheduling patterns](https://en.wikipedia.org/wiki/Tournament_scheduling)
- Simple approach: admin manually schedules games per round

## Notes
- Games are tightly coupled to tournaments — always filter by tournamentId
- Team names should be fetched at query time (not stored on the game document)
- Score recording triggers winner calculation: if team1Score > team2Score, team1 wins; if team2Score > team1Score, team2 wins; if equal, draw/no winner (configurable)
- Status flow: `scheduled` → `in_progress` → `completed` (can go to `postponed` or `cancelled` from any non-completed state)
- Consider adding a confirm dialog for score recording to prevent accidental entry
- Future: bracket-based game generation (auto-create games based on bracketType)
- Future: round progression (winners advance to next round in elimination brackets)
