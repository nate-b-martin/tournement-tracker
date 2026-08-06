# Season Schedule & Standings Feature Design

## Overview

Enable the currently disabled Schedule and Standings tabs on the season detail page (`/seasons/$id`). The season schedule shows regular season games (`seasonGames` table) with when/where/who. The standings show computed W/L/T records from completed season games.

## Wireframe

```
+------------------------------------------------------------------+
| [← Back to Seasons]                                              |
| Spring 2025 Season                              [✏️ Edit]        |
| [active] [Baseball]                                               |
|                                                                  |
| +-------------+  +-------------+  +-------------+                |
| | Details     |  | Teams       |  | Tournament  |                |
| | Name: Spring|  | [icon]  3   |  | [icon] Spring|               |
| | Sport: Baseb|  | Teams       |  | Championship |               |
| | Dates: Mar..|  |             |  +-------------+                |
| +-------------+  +-------------+                                  |
|                                                                  |
| [Overview (3)] [Schedule (5)] [Standings]                        |
|                                                                  |
| === SCHEDULE TAB =============================================  |
|                                                                  |
| [+ Add Game]                               [Search...]           |
|                                                                  |
| Date         | Home          | Away          | Score  | Location |
|-------------|---------------|---------------|--------|----------|
| Jul 15, 2026 | Diamond Divas | Swing Sisters | 8 - 3  | Field A  |
| Jul 16, 2026 | Ball Busters  | Pitch Please  | -      | Field B  |
| Jul 17, 2026 | Diamond Divas | Ball Busters  | -      | Field C  |
|                                                                  |
| === STANDINGS TAB ============================================  |
|                                                                  |
| # | Team          | GP | W | L | T | Win % | PF | PA | +/-    |
|---|---------------|----|---|----|-------|----|----|--------|
| 1 | Diamond Divas | 4  | 3 | 1 | 0 | 75.0% | 32 | 18 | +14    |
| 2 | Swing Sisters | 4  | 2 | 2 | 0 | 50.0% | 22 | 24 |  -2    |
| 3 | Ball Busters  | 4  | 1 | 3 | 0 | 25.0% | 15 | 27 | -12    |
+------------------------------------------------------------------+
```

## Section Breakdown

### Schedule Tab
- **Admin action**: "Add Game" button visible for admins
- **Search**: Filter games by team name
- **Table columns**:
  1. Date — scheduled date (formatted, sortable)
  2. Home Team — name, winner highlight if completed
  3. Away Team — name, winner highlight if completed
  4. Score — Home-Away (winner bold green), "-" if not completed
  5. Location — field/location text or "-"
  6. Status — badge: scheduled (blue), completed (green)
  7. Actions — Edit/Delete buttons for admins
- **Empty state**: "No games scheduled yet. Season games will appear here once they're added."
- **Loading state**: Skeleton rows

### Standings Tab
- **Table columns**:
  1. # — Rank (1-based, sorted by Win % desc)
  2. Team — team name
  3. GP — Games Played
  4. W — Wins
  5. L — Losses
  6. T — Ties
  7. Win % — (W/GP)*100, formatted to 1 decimal
  8. PF — Points For (total homeScore + awayScore across all games)
  9. PA — Points Against
  10. +/- — Point differential (green if positive, red if negative)
- **Top 2 highlight**: Light green background on top 2 rows
- **Empty state**: "No completed games to calculate standings."
- **Loading state**: Skeleton rows

### SeasonGameDialog (Add/Edit Game)
- Modal dialog for creating/editing season games
- **Fields**:
  - Home Team — Select dropdown (from season teams)
  - Away Team — Select dropdown (from season teams, excluding home team)
  - Date — Date input
  - Time — Time input (optional)
  - Location — Text input (optional)
  - Home Score — Number input (only for completed games)
  - Away Score — Number input (only for completed games)
  - Status — Select: Scheduled (default) / Completed
- **Validation**: Home and Away teams must be different
- **Pattern**: Follows `GameDialog` from tournament detail

## Technical Implementation

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/useSeasonGames.ts` | Hook wrapping `api.seasonGames.listBySeason` |
| `src/components/SeasonScheduleView.tsx` | Schedule table with filter/search/CRUD |
| `src/components/SeasonGameDialog.tsx` | Create/edit dialog for season games |
| `src/components/SeasonStandingsView.tsx` | Standings computed from seasonGames |

### Modified Files

| File | Change |
|------|--------|
| `src/routes/seasons/$id/index.tsx` | Enable Schedule + Standings tabs, wire data queries and components |

### Data Dependencies

**Schedule tab:**
- `api.seasonGames.listBySeason({ seasonId })` — returns `(Doc<"seasonGames"> & { homeTeam, awayTeam })[]`
- `api.seasonTeams.listBySeason({ seasonId })` — teams for Add Game dropdown (already loaded)
- `api.seasonGames.create`, `api.seasonGames.update`, `api.seasonGames.remove` — CRUD mutations

**Standings tab:**
- `api.seasonGames.listBySeason({ seasonId })` — same query as schedule
- `api.seasonTeams.listBySeason({ seasonId })` — teams (already loaded)
- Computed client-side: W/L/T, points for/against, win %

### useSeasonGames Hook

```typescript
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export interface SeasonGameWithTeams {
  _id: Id<"seasonGames">;
  seasonId: Id<"seasons">;
  homeTeamId: Id<"teams">;
  awayTeamId: Id<"teams">;
  scheduledDate: number;
  homeScore?: number;
  awayScore?: number;
  status: "scheduled" | "completed";
  location?: string;
  createdAt: number;
  updatedAt: number;
  homeTeam: Doc<"teams"> | null;
  awayTeam: Doc<"teams"> | null;
}

export function useSeasonGames(seasonId: string | undefined) {
  const games = useQuery(
    api.seasonGames.listBySeason,
    seasonId ? { seasonId: seasonId as Id<"seasons"> } : "skip",
  );
  return {
    games: (games || []) as SeasonGameWithTeams[],
    isLoading: games === undefined,
  };
}
```

### SeasonScheduleView Component

Props: `{ seasonId: Id<"seasons">, teams: Doc<"teams">[], isAdmin: boolean }`

Uses `useSeasonGames` internally. Renders a DataTable with columns:
- Date (scheduledDate, formatted)
- Home Team (name from homeTeam, winner highlight)
- Away Team (name from awayTeam, winner highlight)
- Score (homeScore - awayScore, or "-")
- Location
- Status (badge)
- Actions (edit/delete for admins)

Toolbar: "Add Game" button (admin), search by team name, status filter

### SeasonGameDialog Component

Props: `{ mode: "create" | "edit", game?: ..., seasonId, teams, open, onOpenChange }`

Follows `GameDialog` pattern. Fields:
- Home Team (select, required)
- Away Team (select, required, different from home)
- Date (date input, required)
- Location (text input, optional)
- Home Score (number, shown when status = completed)
- Away Score (number, shown when status = completed)
- Status (select: scheduled/completed)

### SeasonStandingsView Component

Props: `{ games: SeasonGameWithTeams[], teams: Doc<"teams">[] }`

Computes standings client-side:
1. Initialize stats map with all teams (GP=0, W=0, L=0, T=0, PF=0, PA=0)
2. For each completed game: increment GP, W/L for winner/loser, PF/PA for both
3. Sort by Win % desc, then PF desc
4. Render table with rank, team name, GP, W, L, T, Win %, PF, PA, +/-

### Season Detail Page Changes

In `src/routes/seasons/$id/index.tsx`:

```typescript
// Add imports
import { SeasonScheduleView } from "@/components/SeasonScheduleView";
import { SeasonStandingsView } from "@/components/SeasonStandingsView";
import { useSeasonGames } from "@/hooks/useSeasonGames";

// Add data query
const { games: seasonGames, isLoading: seasonGamesLoading } = useSeasonGames(id);

// Change tabs to enabled
<TabsList>
  <TabsTrigger value="overview">Overview ({teams.length})</TabsTrigger>
  <TabsTrigger value="schedule">Schedule ({seasonGames.length})</TabsTrigger>
  <TabsTrigger value="standings">Standings</TabsTrigger>
</TabsList>

// Schedule tab content
<TabsContent value="schedule" className="mt-4">
  <SeasonScheduleView
    seasonId={id as Id<"seasons">}
    teams={teams}
    isAdmin={isAdmin}
  />
</TabsContent>

// Standings tab content
<TabsContent value="standings" className="mt-4">
  {seasonGamesLoading ? (
    <Skeleton className="h-64 w-full" />
  ) : seasonGames.length > 0 && teams.length > 0 ? (
    <SeasonStandingsView games={seasonGames} teams={teams} />
  ) : (
    <div className="text-center py-12 text-muted-foreground">
      Standings will appear once games have been played.
    </div>
  )}
</TabsContent>
```

### Components Used
- **shadcn/new**: Dialog, Select, Input, Label, Button (for SeasonGameDialog)
- **shadcn/existing**: Tabs, Badge, Button, Card, Skeleton
- **Custom/existing**: DataTable (for ScheduleView)
- **Custom/new**: SeasonScheduleView, SeasonGameDialog, SeasonStandingsView
- **Icons**: Plus, Pencil, Trash2 (lucide-react)

### State Management
- `dialogOpen: boolean` — controls SeasonGameDialog visibility
- `editingGame: SeasonGameWithTeams | undefined` — game being edited
- `dialogMode: "create" | "edit"` — dialog mode
- `deleteConfirmOpen: boolean` — delete confirmation dialog
- `searchQuery: string` — schedule text search
- `statusFilter: string` — schedule status filter

### Responsive Behavior
- Schedule table: horizontal scroll on mobile, full table on desktop
- Standings table: horizontal scroll on mobile, condensed columns on small screens
- Add Game dialog: full-screen on mobile, centered modal on desktop

## Edge Cases

### Schedule
- Season with no games: "No games scheduled yet" empty state
- Game with deleted team: Show "Deleted Team" fallback
- Same team selected for home/away: Validation prevents this
- Very long team names: truncate with ellipsis
- Games on same date: Grouped by date or sorted by time
- Editing a completed game: Scores are editable, changing to scheduled clears scores

### Standings
- No completed games: "No completed games to calculate standings."
- Team with no games played: Shows 0 across the board, Win % = "-"
- All games tied: All teams have 0 wins, sorted by PF
- Single team in season (shouldn't happen but): Standings shows that team with 0 games
- Large number of teams: Scrollable table
- Zero scores: Scores of 0 are valid (not treated as "no score")

## SeasonGame Convex API Reference

Already exists at `convex/seasonGames.ts`:
- `listBySeason({ seasonId })` — returns games with homeTeam/awayTeam populated
- `create({ seasonId, homeTeamId, awayTeamId, scheduledDate, location? })` — creates scheduled game
- `update({ id, homeScore?, awayScore?, status?, scheduledDate?, location? })` — updates game
- `remove({ id })` — deletes game

## Implementation Phases

### Phase 1: Data Layer
1. Create `src/hooks/useSeasonGames.ts`
2. Verify `seasonGames` Convex functions return correct data with team details

### Phase 2: Schedule Tab
1. Create `src/components/SeasonGameDialog.tsx`
2. Create `src/components/SeasonScheduleView.tsx` (table + filter + CRUD)
3. Wire into season detail page, enable Schedule tab

### Phase 3: Standings Tab
1. Create `src/components/SeasonStandingsView.tsx`
2. Wire into season detail page, enable Standings tab

### Phase 4: Testing
1. Write E2E test: Admin completes wizard → lands on season detail → views schedule → views standings
2. Write E2E test: Admin adds game to schedule
3. Write E2E test: Standings update after completing a game
