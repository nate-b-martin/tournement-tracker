# Seed Data Reference

## Overview

**File**: [`convex/seed.ts`](../convex/seed.ts)

The seed function populates the database with test data for development and testing. It creates a complete tournament ecosystem with teams, players, games, and stats.

## Running

```bash
npx convex seed
```

## Data Insertion Order

Foreign key relationships dictate the insertion order:

```
1. Tournament (no dependencies)
2. Fields (depend on tournament)
3. Teams (depend on tournament)
4. Players (depend on teams)
5. Games (depend on tournament and teams)
6. GameStats (depend on games and players)
```

## Seed Entities

### 1 Tournament

| Field | Value |
|-------|-------|
| Name | "Summer Softball Classic 2026" |
| Sport | "Softball" |
| Location | "Central Park Sports Complex" |
| Bracket Type | `single_elimination` |
| Status | `active` |
| Max Teams | 8 |
| Min Teams | 4 |
| Current Team Count | 4 |
| Fields Available | 4 |
| Game Duration | 60 (minutes) |
| Break Between Games | 15 (minutes) |
| Seeding Type | `random` |

### 2 Fields

| Name | Location | Status |
|------|----------|--------|
| "Diamond 1" | "Main Field" | `available` |
| "Diamond 2" | "Practice Field" | `available` |

### 4 Teams (8 players each = 32 players)

| Team | Coach | Players |
|------|-------|---------|
| "Warriors" | "Mark Johnson" | 8 players (1 captain) |
| "Eagles" | "Sarah Williams" | 8 players (1 captain) |
| "Titans" | "Mike Thompson" | 8 players (1 captain) |
| "Legends" | "Jessica Davis" | 8 players (1 captain) |

Each team's 8 players include:
- 1 designated captain (`isCaptain: true`)
- 7 non-captain players
- Random jersey numbers (1-99)
- Various player statuses (most active, some inactive/injured for testing)

### 2 Games

| Game | Round | Teams | Status | Score |
|------|-------|-------|--------|-------|
| Game 1 | 1 (Quarterfinals) | Warriors vs Eagles | `completed` | 7-5 (Warriors win) |
| Game 2 | 1 (Quarterfinals) | Titans vs Legends | `scheduled` | — (no scores yet) |

### Player Stats (for Game 1 only)

Each player from Warriors and Eagles has stats recorded for the completed game:

| Stat | Values |
|------|--------|
| gamesPlayed | 1 |
| atBats | 2-4 per player |
| hits | 0-2 per player |
| singles | 0-2 |
| doubles | 0-1 |
| triples | 0 |
| homeRuns | 0 |
| rbi | 0-2 |

Note: Titans and Legends players have **no stats** since their game is still scheduled.

## Clearing Seed Data

```bash
npx convex dashboard
# Navigate to Data tab → Click "clearAllData" mutation → Run
```

There is also a `clearAllData` mutation in the seed file that removes all documents from all tables.

## Using Seed Data in Tests

The seed data is designed for:

- **Visual testing**: Browse a fully populated tournament in the UI
- **Filter/sort testing**: 32 players and 4 teams across statuses
- **Stats display**: Player stats for completed game, empty stats for scheduled
- **Bracket testing**: Single-elimination bracket with 2 games in round 1
- **Edge cases**: Teams with mixed player statuses (active, inactive, injured)
