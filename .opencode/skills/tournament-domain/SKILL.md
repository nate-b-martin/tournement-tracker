---
name: tournament-domain
description: Tournament business logic patterns for TanStack Tournament Tracker - bracket generation, game scheduling, scoring, standings
metadata:
  audience: developers
  stack: convex-typescript-react
---

## Domain Overview

The tournament domain focuses on American sports (starting with softball) with a single-elimination bracket format. Key entities: `tournaments`, `teams`, `players`, `games`, `fields`, `gameStats`.

The tournaments page at `/tournamentspage` is currently a stub — it only renders `"Hello '/tournamentspage/'!"`. The `useTournaments.ts` hook is empty. The Convex `tournaments.ts` only has a `count` query.

## Schema Reference

### Tournaments Table (`convex/schema.ts:4-49`)
```typescript
tournaments: defineTable({
  name: v.string(),
  sport: v.string(),
  location: v.string(),
  startDate: v.optional(v.number()),
  bracketType: v.union(
    v.literal("single_elimination"),
    v.literal("double_elimination"),
    v.literal("round_robin"),
  ),
  maxTeams: v.number(),
  currentTeamCount: v.number(),
  fieldsAvailable: v.number(),
  gameDuration: v.number(),
  status: v.union(
    v.literal("draft"),
    v.literal("registration_open"),
    v.literal("registration_closed"),
    v.literal("active"),
    v.literal("complete"),
  ),
  organizerId: v.string(),
})
```

### Status Lifecycle
```
draft → registration_open → registration_closed → active → complete
```

## Tournament Queries to Add

Following the pattern in `convex/teams.ts` and `convex/players.ts`:

```typescript
// convex/tournaments.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    status: v.optional(v.array(v.string())),
    sport: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let tournaments = await ctx.db.query("tournaments").collect();

    if (args.status?.length) {
      tournaments = tournaments.filter((t) => args.status!.includes(t.status));
    }

    return tournaments;
  },
});

export const getById = query({
  args: { id: v.id("tournaments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

## Bracket Generation (Single Elimination)

### Algorithm Overview
Single-elimination bracket for up to 32 teams:

```typescript
function generateBracket(teams: Team[], startTime: number, fieldIds: Id<"fields">[], gameDuration: number) {
  const teamCount = teams.length;
  const rounds = Math.ceil(Math.log2(teamCount));
  const totalSlots = Math.pow(2, rounds);
  const byes = totalSlots - teamCount;

  // Shuffle teams for seeding
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const bracket = [];
  let gameNumber = 0;
  let currentTime = startTime;
  let fieldIndex = 0;

  for (let round = 1; round <= rounds; round++) {
    const gamesInRound = Math.pow(2, rounds - round);
    const roundGames = [];

    for (let g = 0; g < gamesInRound; g++) {
      const idx = g + gameNumber;
      const team1 = shuffled[idx * 2] || null;
      const team2 = shuffled[idx * 2 + 1] || null;

      roundGames.push({
        round,
        gameNumber: idx,
        team1Id: team1?._id,
        team2Id: team2?._id,
        fieldId: fieldIds[fieldIndex % fieldIds.length],
        scheduledTime: currentTime,
        status: "scheduled" as const,
      });

      fieldIndex++;
      currentTime += gameDuration * 60 * 1000;
    }

    bracket.push(...roundGames);
    gameNumber += gamesInRound;
  }

  return bracket;
}
```

### Create Games Mutation
```typescript
export const generateBracket = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    fields: v.array(v.id("fields")),
    startTime: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    const teams = await ctx.db.query("teams").collect();
    const tournamentTeams = teams.filter((t) => t.tournamentId === args.tournamentId);

    const games = generateBracket(tournamentTeams, args.startTime, args.fields, tournament.gameDuration);

    for (const game of games) {
      await ctx.db.insert("games", game);
    }

    await ctx.db.patch(args.tournamentId, {
      status: "active",
      updatedAt: Date.now(),
    });
  },
});
```

## Score Entry

### Enter Game Result Mutation
```typescript
export const enterScore = mutation({
  args: {
    gameId: v.id("games"),
    team1Score: v.number(),
    team2Score: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    const winnerId = args.team1Score > args.team2Score
      ? game.team1Id
      : game.team2Id;

    return await ctx.db.patch(args.gameId, {
      team1Score: args.team1Score,
      team2Score: args.team2Score,
      winnerId,
      status: "completed",
      actualEndTime: Date.now(),
    });
  },
});
```

## Bracket Visualization Idea
For the public bracket display, consider a CSS grid approach:

```
Round 1          Round 2          Finals
[Team A vs B] ── [Winner AB]
                              ── [Winner ABCD]
[Team C vs D] ── [Winner CD]
```

## Key Files to Reference
- `convex/schema.ts:4-49` — Tournament table schema
- `convex/schema.ts:91-111` — Games table schema
- `convex/schema.ts:113-122` — Fields table schema
- `src/hooks/useTournaments.ts` — Empty hook that needs implementation
- `src/routes/tournamentspage/index.tsx` — Stub page that needs implementation
- `feature-tickets/` — Open feature tickets for reference
- `TOURNAMENT_PLAN.md` — Full tournament requirements and specs

## Implementation Priorities
1. Add `tournaments` Convex queries (list, getById)
2. Implement `useTournaments` hook
3. Build tournament creation wizard (dialog/form)
4. Build bracket generation algorithm
5. Build games list for tournament detail view
6. Build score entry interface
7. Build bracket visualization
