# Feature: Game Stats UI

## Overview
Build UI for viewing and recording individual player statistics per game. The `gameStats` table exists in the schema (with fields: gameId, playerId, sportType, gamesPlayed, atBats, hits, singles, doubles, triples, homeRuns, rbi) and seed data has 7 gameStat records. A `playerStats.ts` Convex function already aggregates stats. The missing piece is the UI to view and record stats.

## Current State
- `convex/schema.ts` has `gameStats` table with all fields
- `convex/playerStats.ts` has `count` and `list` queries that aggregate stats across games
- `src/hooks/usePlayerStats.ts` has `usePlayerStats` hook that fetches aggregated data
- `src/components/PlayersTable.tsx` has a "Individual Stats" view that shows aggregated player stats
- No way to record stats per game
- No way to view stats for a specific game in context

## Prerequisites
- [ ] Ticket `09-games-management.md` — games must exist so stats can be attached

## Implementation

### Step 1: Create Game Stats Convex Functions (`convex/gameStats.ts`)

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const allStats = await ctx.db.query("gameStats").collect();
    const gameStats = allStats.filter((s) => s.gameId === args.gameId);

    // Enrich with player info
    return await Promise.all(
      gameStats.map(async (stat) => {
        const player = await ctx.db.get(stat.playerId);
        return { ...stat, player };
      }),
    );
  },
});

export const getByPlayer = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const allStats = await ctx.db.query("gameStats").collect();
    const playerStats = allStats.filter((s) => s.playerId === args.playerId);
    return await Promise.all(
      playerStats.map(async (stat) => {
        const game = await ctx.db.get(stat.gameId);
        return { ...stat, game };
      }),
    );
  },
});

export const upsert = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    sportType: v.optional(v.string()),
    gamesPlayed: v.optional(v.number()),
    atBats: v.optional(v.number()),
    hits: v.optional(v.number()),
    singles: v.optional(v.number()),
    doubles: v.optional(v.number()),
    triples: v.optional(v.number()),
    homeRuns: v.optional(v.number()),
    rbi: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const { gameId, playerId, ...stats } = args;
    const allStats = await ctx.db.query("gameStats").collect();
    const existing = allStats.find(
      (s) => s.gameId === gameId && s.playerId === playerId,
    );

    if (existing) {
      await ctx.db.patch(existing._id, stats);
      return existing._id;
    }

    return await ctx.db.insert("gameStats", {
      gameId,
      playerId,
      gamesPlayed: stats.gamesPlayed ?? 0,
      atBats: stats.atBats ?? 0,
      hits: stats.hits ?? 0,
      singles: stats.singles ?? 0,
      doubles: stats.doubles ?? 0,
      triples: stats.triples ?? 0,
      homeRuns: stats.homeRuns ?? 0,
      rbi: stats.rbi ?? 0,
      sportType: stats.sportType,
    });
  },
});
```

### Step 2: Create Per-Game Stats Component

Add a "Stats" tab or panel to the game detail view where admins can:
- See all players who played in the game
- Record batting stats for each player
- View aggregated game totals

### Step 3: Player Stats Detail View

Enhance the existing player stats view to:
- Show per-game breakdown (which games, what stats)
- Support filtering by tournament or date range
- Show career/season totals

## Acceptance Criteria
- [ ] Game stats can be recorded per player per game
- [ ] Upsert mutation handles create vs update (one stat record per player per game)
- [ ] Player stats aggregated view works (already exists in playerStats.ts)
- [ ] Per-game stats view shows all player stats for that game
- [ ] Admin-only recording of stats
- [ ] Stats are displayed in the existing "Individual Stats" table view

## Related Files
- `convex/gameStats.ts` — NEW
- `src/hooks/useGameStats.ts` — NEW
- `src/components/GameStatsSheet.tsx` — NEW (per-game stats recording)
- `src/components/PlayersTable.tsx` — MODIFY (existing stats view)
- `convex/playerStats.ts` — existing (already aggregates stats)

## Notes
- Game stats are sport-specific (currently softball/baseball oriented with batting stats)
- The `upsert` pattern prevents duplicate stat records for the same player+game combo
- Stats recording is a power-user/admin feature — keep the UI functional but don't over-engineer
- Future: support different sport types with different stat categories
