# Feature 22: Quality Seed Data for MVP Testing

## Overview

Reseed the database with comprehensive test data covering all wired features. The current seed (`convex/seed.ts`) was written before several core features existed (seasons, season schedule/standings, player stats aggregation, setup wizard, bracket generation). Many features now render empty states because no qualifying data exists.

### Current Gaps

| Feature | Why Data Is Missing | Impact |
|---------|-------------------|--------|
| Season Schedule tab | 0 `seasonGames` documents | Shows "No games scheduled yet" — can't test table, filters, or CRUD |
| Season Standings tab | 0 completed `seasonGames` | Shows "Standings will appear once games have been played" — can't verify W/L/T computation |
| Bracket Generation | No completed season games → standings empty | `generateBracket` throws "No completed games yet" — can't test playoff seeding |
| Player Stats page | Only 7 players have stats, all from 1 game | Aggregation across multiple games can't be tested; 25/32 players show zeroes |
| User Profiles | 0 `userProfiles` documents | `getCurrentUser` returns null; RBAC `getUserRole` returns null; wizard first-user check wrong |
| Hompage/Dashboard | 1 tournament, 1 season | Summary counts are trivial; no variety for filtering/sorting tests |
| Tournament Detail | 2 games (1 completed, 1 scheduled) | Bracket tab is sparse; standings tab only shows 2 teams |
| Status filtering | All teams "active", all players "active", all fields "available" | Status filter dropdowns always show single option — can't verify filter logic |

### Seed Data Design Principles

1. **Feature coverage** — Every wired feature has at least one document to render
2. **Variety** — All status values, sport values, and bracket types represented
3. **Edge cases** — Inactive teams/players, unavailable fields, stale seasons
4. **Realistic statistics** — Players have stats across multiple games for meaningful aggregation
5. **Insertion order** — Respect FK constraints (see order below)

## Prerequisites

- [x] Current schema (`convex/schema.ts`) — all tables defined: tournaments, seasons, seasonTeams, seasonGames, teams, players, games, fields, gameStats, userProfiles
- [x] Current seed (`convex/seed.ts`) — structure exists, needs comprehensive update
- [x] MVP Roadmap (`feature-tickets/MVP_ROADMAP.md`) — all core features complete
- [ ] Run `npx convex dev` to regenerate type bindings after writing seed

## Data Insertion Order (Critical)

Foreign key dependencies dictate the order:

```
 1. userProfiles       — no dependencies
 2. seasons            — no FK dependencies
 3. tournaments        — seasonId is optional, insert without it first
 4. fields             → tournaments
 5. teams              → tournaments
 6. players            → teams
 7. seasonTeams        → seasons, teams
 8. seasonGames        → seasons, teams
 9. games              → tournaments, teams, fields
10. gameStats          → games, players
11. Patch tournaments  — link tournament.seasonId after seasons exist
```

## Data Specification

### Section 1: userProfiles (1 record)

Admin profile matching the mock Clerk user ID used by all seed entities.

```typescript
await ctx.db.insert("userProfiles", {
  userId: "user_clerk_test_001",
  role: "admin",
  email: "admin@tournament-tracker.test",
  displayName: "Test Admin",
});
```

### Section 2: seasons (3 records — keep existing Spring 2026, Fall 2025, Summer 2026)

**Changes from current seed:**
- Spring 2026: add scheduling config fields (`regularSeasonWeeks: 8`, `gamesPerWeek: 2`, `gameDays: [1, 3]`, `scheduleType: "single_round_robin"`)
- Fall 2025 and Summer 2026: no changes, no schedule config needed

### Section 3: tournaments (3 records — 1 existing, 2 new)

**1 — Summer Softball Classic 2026** (existing, keep as-is)
- Status: `"active"`, Sport: `"softball"`, Bracket: `"single_elimination"`
- Linked to Spring 2026 season

**2 — Winter Indoor Tournament 2026** (new)
```typescript
{
  name: "Winter Indoor Tournament 2026",
  description: "Indoor basketball tournament for recreational teams",
  sport: "basketball",
  location: "Sports Dome Indoor Center",
  startDate: new Date("2026-01-10T08:00:00Z").getTime(),
  endDate: new Date("2026-01-12T18:00:00Z").getTime(),
  registrationDeadline: new Date("2025-12-20T23:59:59Z").getTime(),
  maxTeams: 16, minTeams: 2, currentTeamCount: 2,
  bracketType: "double_elimination",
  fieldsAvailable: 2, gameDuration: 45, breakBetweenGames: 10,
  status: "draft",
  organizerId: "user_clerk_test_001",
  seedingType: "random",
  createdAt: Date.now(), updatedAt: Date.now(),
}
```

**3 — Fall Championship Series 2026** (new)
```typescript
{
  name: "Fall Championship Series 2026",
  description: "Fall baseball championship tournament",
  sport: "baseball",
  location: "Riverfield Sports Park",
  startDate: new Date("2026-10-01T08:00:00Z").getTime(),
  endDate: new Date("2026-10-04T18:00:00Z").getTime(),
  registrationDeadline: new Date("2026-09-15T23:59:59Z").getTime(),
  maxTeams: 8, minTeams: 4, currentTeamCount: 0,
  bracketType: "round_robin",
  fieldsAvailable: 3, gameDuration: 90, breakBetweenGames: 20,
  status: "registration_open",
  organizerId: "user_clerk_test_001",
  seedingType: "manual",
  createdAt: Date.now(), updatedAt: Date.now(),
}
```

### Section 4: fields (6 records — 2 existing, 4 new)

**Existing fields (Summer Softball Classic):**
- "Field A — Main Diamond" (available)
- "Field B — Secondary Diamond" (available)

**New fields for Winter Indoor Tournament:**
```typescript
{
  tournamentId: winterTournamentId,
  name: "Court 1 — Main Arena",
  location: "Sports Dome, Center Court",
  status: "available",
}
{
  tournamentId: winterTournamentId,
  name: "Court 2 — Practice Court",
  location: "Sports Dome, East Wing",
  status: "maintenance", // Edge case for field status filter
}
```

**New fields for Fall Championship Series:**
```typescript
{
  tournamentId: fallTournamentId,
  name: "Diamond 1 — Championship Field",
  location: "Riverfield Sports Park, Main Entrance",
  status: "available",
}
{
  tournamentId: fallTournamentId,
  name: "Diamond 2 — Practice Field",
  location: "Riverfield Sports Park, Back Lot",
  status: "unavailable", // Edge case for field status filter
}
```

### Section 5: teams (8 records — 4 existing, 4 new)

**Existing teams** (keep as-is):
1. Diamond Divas (active, softball)
2. Swing Sisters (active, softball)
3. Ball Busters (active, softball)
4. Pitch Please (active, softball)

**New teams for Winter Indoor Tournament (basketball):**
```typescript
{
  tournamentId: winterTournamentId,
  name: "Hoops Heroes",
  description: "Community basketball team",
  coachName: "Marcus Williams",
  coachEmail: "marcus.williams@email.com",
  coachPhone: "555-0105",
  city: "Northville", homeField: "Northville Community Center",
  organization: "Northville Basketball League",
  teamAgeGroup: "Adult",
  status: "active",
  createdAt: Date.now(), updatedAt: Date.now(),
}
{
  tournamentId: winterTournamentId,
  name: "Net Navigators",
  description: "Travel basketball team",
  coachName: "David Thompson",
  coachEmail: "david.thompson@email.com",
  coachPhone: "555-0106",
  city: "Eastwood", homeField: "Eastwood High Gym",
  organization: "Eastwood Athletic Association",
  teamAgeGroup: "Adult",
  status: "inactive", // Edge case: inactive team for status filter testing
  createdAt: Date.now(), updatedAt: Date.now(),
}
```

**New teams for Fall Championship Series (baseball):**
```typescript
{
  tournamentId: fallTournamentId,
  name: "Slugger Squad",
  description: "Competitive baseball team from the local league",
  coachName: "Roberto Martinez",
  coachEmail: "roberto.martinez@email.com",
  coachPhone: "555-0107",
  city: "Westfield", homeField: "Westfield Stadium",
  organization: "Westfield Baseball Club",
  teamAgeGroup: "Adult",
  status: "active",
  createdAt: Date.now(), updatedAt: Date.now(),
}
{
  tournamentId: fallTournamentId,
  name: "Basepath Bandits",
  description: "Newly formed baseball team",
  coachName: "Chris Anderson",
  coachEmail: "chris.anderson@email.com",
  coachPhone: "555-0108",
  city: "Southpark", homeField: "Southpark Recreation Field",
  organization: "Southpark Youth Sports",
  teamAgeGroup: "Adult",
  status: "active",
  createdAt: Date.now(), updatedAt: Date.now(),
}
```

### Section 6: players (48 records — 32 existing, 16 new)

**Existing** — 32 players (8 per existing team), keep as-is.

**New for Hoops Heroes (basketball, winter tournament):**
| # | First | Last | Jersey | Captain? | Status |
|---|-------|------|--------|----------|--------|
| 1 | Jaylen | Carter | 0 | Yes | active |
| 2 | Andre | Foster | 1 | No | active |
| 3 | Malik | Simmons | 2 | No | active |
| 4 | Darius | Reynolds | 3 | No | active |
| 5 | Tyrone | Crawford | 4 | No | active |
| 6 | Kobe | Jennings | 5 | No | injured |
| 7 | Jamal | Gibson | 6 | No | active |
| 8 | Corey | Blake | 7 | No | inactive |

**New for Net Navigators (basketball, winter tournament):**
| # | First | Last | Jersey | Captain? | Status |
|---|-------|------|--------|----------|--------|
| 1 | Brandon | Knight | 10 | Yes | active |
| 2 | Isaiah | Ford | 11 | No | active |
| 3 | Cameron | Wells | 12 | No | active |
| 4 | Devin | Hunt | 13 | No | active |
| 5 | Elijah | Pierce | 14 | No | active |
| 6 | Jaden | Cole | 15 | No | active |
| 7 | Xander | Brooks | 16 | No | active |
| 8 | Tristan | Hayes | 17 | No | active |

**New for Slugger Squad (baseball, fall tournament):**
| # | First | Last | Jersey | Captain? | Status |
|---|-------|------|--------|----------|--------|
| 1 | Antonio | Ramirez | 40 | Yes | active |
| 2 | Carlos | Ortiz | 41 | No | active |
| 3 | Miguel | Sanchez | 42 | No | active |
| 4 | Javier | Torres | 43 | No | active |
| 5 | Diego | Flores | 44 | No | active |
| 6 | Luis | Castillo | 45 | No | active |
| 7 | Santiago | Reyes | 46 | No | active |
| 8 | Hector | Vargas | 47 | No | active |

**New for Basepath Bandits (baseball, fall tournament):**
| # | First | Last | Jersey | Captain? | Status |
|---|-------|------|--------|----------|--------|
| 1 | Ethan | Walker | 50 | Yes | active |
| 2 | Liam | Parker | 51 | No | active |
| 3 | Noah | Bennett | 52 | No | active |
| 4 | Oliver | Collins | 53 | No | active |
| 5 | William | Stewart | 54 | No | active |
| 6 | James | Morgan | 55 | No | injured |
| 7 | Benjamin | Cooper | 56 | No | active |
| 8 | Lucas | Peterson | 57 | No | active |

### Section 7: seasonTeams (8 records — 4 existing, 4 new)

**Existing** (keep):
- Spring 2026 → Diamond Divas
- Spring 2026 → Swing Sisters
- Fall 2025 → Ball Busters
- Fall 2025 → Pitch Please

**New:**
- Spring 2026 → Ball Busters
- Spring 2026 → Pitch Please
- Spring 2026 → Hoops Heroes (no, wait — Hoops Heroes is in Winter tournament, not a season)

Actually, let me clarify: `seasonTeams` links seasons to teams, not tournaments to teams. So all 4 Spring 2026 teams should be in seasonTeams. Currently only Diamond Divas and Swing Sisters are linked.

Fix: Add Season-Team links for all Spring 2026 season teams:
- Spring 2026 → Diamond Divas (existing)
- Spring 2026 → Swing Sisters (existing)
- Spring 2026 → Ball Busters (new)
- Spring 2026 → Pitch Please (new)

Note: Hoops Heroes and Net Navigators belong to the Winter tournament which is not linked to any season (it's in "draft" status). Similarly Slugger Squad and Basepath Bandits belong to Fall tournament (registration_open, no season link yet).

### Section 8: seasonGames (8 records — CRITICAL)

These are the regular season games for Spring 2026. Six completed games (with scores) produce meaningful standings for the Standings tab and for bracket generation. Two scheduled games test the Schedule tab's display.

```typescript
// Game 1 — Week 1: Diamond Divas vs Swing Sisters
await ctx.db.insert("seasonGames", {
  seasonId: springSeasonId,
  homeTeamId: team1Id,   // Diamond Divas
  awayTeamId: team2Id,   // Swing Sisters
  scheduledDate: new Date("2026-03-02T18:00:00Z").getTime(),
  homeScore: 5,
  awayScore: 3,
  status: "completed",
  location: "Field A — Main Diamond",
  createdAt: Date.now(), updatedAt: Date.now(),
})

// Game 2 — Week 1: Ball Busters vs Pitch Please
await ctx.db.insert("seasonGames", {
  seasonId: springSeasonId,
  homeTeamId: team3Id,   // Ball Busters
  awayTeamId: team4Id,   // Pitch Please
  scheduledDate: new Date("2026-03-02T18:00:00Z").getTime(),
  homeScore: 2,
  awayScore: 2,          // Tie game — tests T (tie) column in standings
  status: "completed",
  location: "Field B — Secondary Diamond",
  createdAt: Date.now(), updatedAt: Date.now(),
})

// Game 3 — Week 2: Swing Sisters vs Ball Busters
await ctx.db.insert("seasonGames", {
  seasonId: springSeasonId,
  homeTeamId: team2Id,   // Swing Sisters
  awayTeamId: team3Id,   // Ball Busters
  scheduledDate: new Date("2026-03-09T18:00:00Z").getTime(),
  homeScore: 4,
  awayScore: 6,
  status: "completed",
  location: "Field A — Main Diamond",
  createdAt: Date.now(), updatedAt: Date.now(),
})

// Game 4 — Week 2: Pitch Please vs Diamond Divas
await ctx.db.insert("seasonGames", {
  seasonId: springSeasonId,
  homeTeamId: team4Id,   // Pitch Please
  awayTeamId: team1Id,   // Diamond Divas
  scheduledDate: new Date("2026-03-09T18:00:00Z").getTime(),
  homeScore: 1,
  awayScore: 8,
  status: "completed",
  location: "Field B — Secondary Diamond",
  createdAt: Date.now(), updatedAt: Date.now(),
})

// Game 5 — Week 3: Diamond Divas vs Ball Busters
await ctx.db.insert("seasonGames", {
  seasonId: springSeasonId,
  homeTeamId: team1Id,   // Diamond Divas
  awayTeamId: team3Id,   // Ball Busters
  scheduledDate: new Date("2026-03-16T18:00:00Z").getTime(),
  homeScore: 3,
  awayScore: 4,
  status: "completed",
  location: "Field A — Main Diamond",
  createdAt: Date.now(), updatedAt: Date.now(),
})

// Game 6 — Week 3: Swing Sisters vs Pitch Please
await ctx.db.insert("seasonGames", {
  seasonId: springSeasonId,
  homeTeamId: team2Id,   // Swing Sisters
  awayTeamId: team4Id,   // Pitch Please
  scheduledDate: new Date("2026-03-16T18:00:00Z").getTime(),
  homeScore: 7,
  awayScore: 5,
  status: "completed",
  location: "Field B — Secondary Diamond",
  createdAt: Date.now(), updatedAt: Date.now(),
})

// Game 7 — Week 4: Ball Busters vs Pitch Please (scheduled)
await ctx.db.insert("seasonGames", {
  seasonId: springSeasonId,
  homeTeamId: team3Id,   // Ball Busters
  awayTeamId: team4Id,   // Pitch Please
  scheduledDate: new Date("2026-03-23T18:00:00Z").getTime(),
  status: "scheduled",
  location: "Field A — Main Diamond",
  createdAt: Date.now(), updatedAt: Date.now(),
})

// Game 8 — Week 4: Swing Sisters vs Diamond Divas (scheduled)
await ctx.db.insert("seasonGames", {
  seasonId: springSeasonId,
  homeTeamId: team2Id,   // Swing Sisters
  awayTeamId: team1Id,   // Diamond Divas
  scheduledDate: new Date("2026-03-23T18:00:00Z").getTime(),
  status: "scheduled",
  location: "Field B — Secondary Diamond",
  createdAt: Date.now(), updatedAt: Date.now(),
})
```

**Resulting Standings:**

| Rank | Team | GP | W | L | T | Win % | PF | PA | +/- |
|------|------|----|----|----|----|-------|----|----|-----|
| 1 | Diamond Divas | 3 | 2 | 1 | 0 | 66.7% | 16 | 8 | +8 |
| 2 | Ball Busters | 3 | 2 | 1 | 0 | 66.7% | 12 | 10 | +2 |
| 3 | Swing Sisters | 3 | 1 | 2 | 0 | 33.3% | 14 | 16 | -2 |
| 4 | Pitch Please | 3 | 0 | 2 | 1 | 0.0% | 8 | 17 | -9 |

Note: Diamond Divas and Ball Busters both at 2-1. Diamond Divas wins the tiebreaker (PF 16 > 12). This tests the tie-break logic in standings and bracket seeding.

### Section 9: games — Tournament Bracket (4 records — 2 existing, 2 new)

**Existing games** (keep):
- Game 1: Diamond Divas vs Swing Sisters (completed, DD won 8-3) — round 1
- Game 2: Ball Busters vs Pitch Please (scheduled) — round 1

**New Game 3 — Semifinal** (completed):
```typescript
await ctx.db.insert("games", {
  tournamentId: tournamentId,
  round: 2,
  gameNumber: 3,
  team1Id: team1Id,      // Diamond Divas (winner of Game 1)
  team2Id: team3Id,      // Ball Busters (winner of Game 2 — would win on the field)
  winnerId: team1Id,     // Diamond Divas advance
  scheduledTime: new Date("2026-07-16T09:00:00Z").getTime(),
  actualStartTime: new Date("2026-07-16T09:10:00Z").getTime(),
  actualEndTime: new Date("2026-07-16T10:30:00Z").getTime(),
  fieldId: field1Id,
  team1Score: 6,
  team2Score: 4,
  status: "completed",
})
```

**New Game 4 — Championship** (scheduled):
```typescript
await ctx.db.insert("games", {
  tournamentId: tournamentId,
  round: 3,
  gameNumber: 4,
  team1Id: team1Id,      // Diamond Divas
  // team2Id: undefined  // TBD — winner of consolation/other semifinal
  scheduledTime: new Date("2026-07-17T10:00:00Z").getTime(),
  fieldId: field1Id,
  status: "scheduled",
})
```

Note: Game 4 has only `team1Id` set but no `team2Id` — the schema supports optional team IDs. This edge case tests the bracket view rendering with TBD slots.

### Section 10: gameStats (19 records — 7 existing, 12 new)

**Existing** — 7 records from Game 1 (Diamond Divas vs Swing Sisters).

**New — Game 3 stats (Diamond Divas vs Ball Busters, DDs won 6-4):**

`team1PlayerIds` indexes: [0]=Emma Wilson, [1]=Olivia Brown, [2]=Ava Davis, [3]=Sophia Miller
`team3PlayerIds` indexes: [0]=Scarlett Lewis, [1]=Victoria Walker, [2]=Madison Hall

```typescript
// Diamond Divas — Game 3 batting (same players from Game 1 for aggregation)
await ctx.db.insert("gameStats", {
  gameId: game3Id, playerId: team1PlayerIds[0], // Emma Wilson
  sportType: "softball", gamesPlayed: 1,
  atBats: 4, hits: 3, singles: 2, doubles: 1, triples: 0, homeRuns: 0, rbi: 2,
})
await ctx.db.insert("gameStats", {
  gameId: game3Id, playerId: team1PlayerIds[1], // Olivia Brown
  sportType: "softball", gamesPlayed: 1,
  atBats: 3, hits: 1, singles: 1, doubles: 0, triples: 0, homeRuns: 0, rbi: 1,
})
await ctx.db.insert("gameStats", {
  gameId: game3Id, playerId: team1PlayerIds[2], // Ava Davis
  sportType: "softball", gamesPlayed: 1,
  atBats: 4, hits: 2, singles: 2, doubles: 0, triples: 0, homeRuns: 0, rbi: 1,
})
await ctx.db.insert("gameStats", {
  gameId: game3Id, playerId: team1PlayerIds[3], // Sophia Miller
  sportType: "softball", gamesPlayed: 1,
  atBats: 2, hits: 0, singles: 0, doubles: 0, triples: 0, homeRuns: 0, rbi: 0,
})

// Ball Busters — Game 3 batting (first stats for these players)
await ctx.db.insert("gameStats", {
  gameId: game3Id, playerId: team3PlayerIds[0], // Scarlett Lewis
  sportType: "softball", gamesPlayed: 1,
  atBats: 3, hits: 2, singles: 1, doubles: 1, triples: 0, homeRuns: 0, rbi: 1,
})
await ctx.db.insert("gameStats", {
  gameId: game3Id, playerId: team3PlayerIds[1], // Victoria Walker
  sportType: "softball", gamesPlayed: 1,
  atBats: 4, hits: 1, singles: 0, doubles: 0, triples: 1, homeRuns: 0, rbi: 1,
})
await ctx.db.insert("gameStats", {
  gameId: game3Id, playerId: team3PlayerIds[2], // Madison Hall
  sportType: "softball", gamesPlayed: 1,
  atBats: 3, hits: 0, singles: 0, doubles: 0, triples: 0, homeRuns: 0, rbi: 0,
})
```

**Resulting aggregated player stats (relevant rows only):**

| Player | Team | GP | AB | H | AVG | 1B | 2B | 3B | HR | RBI |
|--------|------|----|----|----|-----|----|----|----|----|-----|
| Emma Wilson | Diamond Divas | 2 | 7 | 5 | .714 | 3 | 2 | 0 | 0 | 4 |
| Olivia Brown | Diamond Divas | 2 | 7 | 4 | .571 | 3 | 0 | 1 | 0 | 2 |
| Ava Davis | Diamond Divas | 2 | 7 | 4 | .571 | 4 | 0 | 0 | 0 | 4 |
| Sophia Miller | Diamond Divas | 2 | 4 | 1 | .250 | 1 | 0 | 0 | 0 | 1 |
| Mia Taylor | Diamond Divas | 1 | 2 | 1 | .500 | 1 | 0 | 0 | 0 | 1 |
| Charlotte Anderson | Diamond Divas | 1 | 3 | 2 | .667 | 2 | 0 | 0 | 0 | 0 |
| Amelia Thomas | Diamond Divas | 1 | 3 | 1 | .333 | 0 | 1 | 0 | 0 | 1 |
| Scarlett Lewis | Ball Busters | 1 | 3 | 2 | .667 | 1 | 1 | 0 | 0 | 1 |
| Victoria Walker | Ball Busters | 1 | 4 | 1 | .250 | 0 | 0 | 1 | 0 | 1 |
| Harper Jackson | Swing Sisters | 1 | 3 | 1 | .333 | 1 | 0 | 0 | 0 | 0 |
| Evelyn White | Swing Sisters | 1 | 4 | 2 | .500 | 2 | 0 | 0 | 0 | 2 |

This produces realistically varied batting averages (.000–.714) and multiple-game aggregation for 4 players.

### Section 11: Patch Tournament Season Links

```typescript
// Link Summer Softball Classic to Spring 2026 season
await ctx.db.patch(tournamentId, {
  seasonId: springSeasonId,
  updatedAt: Date.now(),
})
// Note: Winter tournament and Fall tournament intentionally left unlinked
// (Winter is "draft", Fall is "registration_open" — not yet associated with a season)
```

## Implementation Steps

### Step 1: Rewrite `convex/seed.ts`

Replace the current file with the comprehensive seed described above. Key structural changes:

1. Add `userProfiles` at the top (no dependencies)
2. Add scheduling config to Spring 2026 season (`regularSeasonWeeks`, `gamesPerWeek`, etc.)
3. Insert two new tournaments (winter, fall)
4. Insert four new fields (two per new tournament)
5. Insert four new teams (two per new tournament)
6. Insert 16 new players (8 per new team)
7. Expand `seasonTeams` to link all 4 teams to Spring 2026
8. Replace placeholder season games section with 8 real games (6 completed, 2 scheduled)
9. Add Game 3 (semifinal) and Game 4 (championship TBD) to tournament games
10. Add 7 new gameStats records for Game 3 (same DDs players + Ball Busters debut)

### Step 2: Update `clearAllData` to Match

The `clearAllData` function's table list is already comprehensive. No changes needed unless new tables are added.

### Step 3: Regenerate Convex Bindings

```bash
npx convex dev
```

This updates `convex/_generated/` with any new types from the expanded data.

### Step 4: Verify

```bash
# Clear existing data and reseed
npx convex run seed:clearAllData
npx convex seed

# Verify counts in dashboard
npx convex run tournaments:count
npx convex run teams:count
npx convex run players:count
```

## Verification Checklist

### By Feature

- [ ] **Homepage** — Shows team count (8+), player count (48+), tournament count (3)
- [ ] **Dashboard** — PlayersTable renders 48+ players; TournamentTable renders 3 tournaments with different statuses
- [ ] **Tournament Detail** — Summer Softball Classic shows 4 teams, 4 games (2 completed, 2 scheduled), bracket view renders, standings shows 2 teams with results
- [ ] **Season Detail — Spring 2026** — Overview shows 4 teams, Schedule tab shows 8 games (6 completed, 2 scheduled), Standings tab shows 4 teams with computed W/L/T
- [ ] **Season Detail — Fall 2025** — Shows as complete, shows 2 linked teams, no schedule config
- [ ] **Season Detail — Summer 2026** — Shows as planning, no teams yet
- [ ] **Players Page** — Lists all 48 players; filter by status works for active/inactive/injured
- [ ] **Teams Page** — Lists all 8 teams; filter by status works for active/inactive
- [ ] **Fields** — Summer tournament shows 2 fields (both available); Winter shows 2 (1 available, 1 maintenance); Fall shows 2 (1 available, 1 unavailable)
- [ ] **Player Stats** — 10 players have stats; Emma Wilson shows .714 AVG across 2 games; multiple aggregation works
- [ ] **Bracket Generation** — `generateBracket` on Spring 2026 season works (6 completed games → standings → seeds)
- [ ] **User Profile** — `getCurrentUser("user_clerk_test_001")` returns admin profile; `getIsFirstUser` returns false

### Edge Cases Covered

- [ ] **Inactive team** — Net Navigators (status: "inactive") — tests team status filter
- [ ] **Injured player** — Jaylen Carter/Hoop (#5), James Morgan/Basepath (#6) — tests player status filter
- [ ] **Inactive player** — Corey Blake/Hoop (#7) — tests player status filter
- [ ] **Field maintenance** — Court 2 (maintenance) — tests field status filter
- [ ] **Field unavailable** — Diamond 2 (unavailable) — tests field status filter
- [ ] **Tied game** — Ball Busters vs Pitch Please (2-2) — tests T column in standings
- [ ] **Tiebreaker by PF** — Diamond Divas and Ball Busters both 2-1, DD wins on PF — tests standings sorting
- [ ] **Zero scores** — If any team scores 0, those are valid points (not treated as "no score")
- [ ] **Tournament game with TBD team** — Game 4 has team1Id but no team2Id — tests bracket with null
- [ ] **Team with no players** — Net Navigators has 8 players (not empty, but tests player count display); Fall tournament teams have 8 each but play no games
- [ ] **Season with no teams** — Summer 2026 (planning) — tests empty state
- [ ] **Tournament with no teams** — Fall Championship Series (registration_open, currentTeamCount: 0) — tests empty state on tournament detail
- [ ] **Double elimination bracket type** — Winter Indoor Tournament — tests bracket type display
- [ ] **Round robin bracket type** — Fall Championship Series — tests bracket type display

## Files Changed

### Modified
- `convex/seed.ts` — Comprehensive rewrite of seed data

### No Changes Needed
- `convex/clearAllData.ts` — Already clears all tables listed
- `convex/schema.ts` — Existing schema supports all new data
- All other files — Seed data is consumed by existing queries/mutations

## Commands

```bash
npx convex dev            # Regenerate type bindings if schema changed
npx convex run seed:clearAllData  # Clear existing test data
npx convex seed           # Insert new seed data
npm run check             # Biome lint + format
npm run build             # TypeScript compilation
```

## Notes

- Mock Clerk user ID should remain `"user_clerk_test_001"` throughout
- All timestamps use `Date.now()` or explicit `new Date(...).getTime()` (ms since epoch)
- Game stats model softball/baseball batting stats (at-bats, hits, doubles, etc.) — basketball stats would use different metrics but the schema only has batting fields. Winter tournament teams won't have gameStats unless a new `sportType`-specific stats table is added.
- The `games.team1Id` and `games.team2Id` fields are `v.optional(v.id("teams"))` — setting undefined for TBD slots is valid
- `seasonGames.scheduledDate` is a single date (no separate time field); times are implicitly 18:00 (6 PM) for all games
