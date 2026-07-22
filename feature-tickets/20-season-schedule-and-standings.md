# Feature 20: Season Schedule & Standings Tabs

## Overview

Enable the currently disabled Schedule and Standings tabs on the season detail page (`/seasons/$id`). The schedule shows regular season games (`seasonGames` table) with when/where/who. The standings show computed W/L/T records from completed season games.

## Prerequisites
- [x] Ticket 14 — Schema season foundation (seasonGames table exists)
- [x] Ticket 15 — Season Convex functions (seasonGames CRUD exists at `convex/seasonGames.ts`)
- [x] Ticket 19 — Season detail page (route at `src/routes/seasons/$id/index.tsx`, tabs exist but disabled)

## Implementation Steps

### Step 1: Create `src/hooks/useSeasonGames.ts`

Hook wrapping `api.seasonGames.listBySeason`:

```typescript
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

export type SeasonGameWithTeams = Doc<"seasonGames"> & {
  homeTeam: Doc<"teams"> | null;
  awayTeam: Doc<"teams"> | null;
};

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

### Step 2: Create `src/components/SeasonGameDialog.tsx`

Dialog for creating/editing season games. Follows `GameDialog.tsx` pattern.

**Fields:**
- Home Team (select from season teams, required)
- Away Team (select from season teams, must differ from home)
- Date (date input, required)
- Location (text input, optional)
- Home Score (number input, shown when status = completed)
- Away Score (number input, shown when status = completed)
- Status (select: scheduled/completed)

**Pattern:**
- Uses `useMutation` for `api.seasonGames.create` / `api.seasonGames.update`
- Toast feedback on success/error
- Resets form on close
- Prevents same team for home/away

### Step 3: Create `src/components/SeasonScheduleView.tsx`

Table view of season games with CRUD for admins.

**Props:** `{ seasonId: Id<"seasons">, teams: Doc<"teams">[], isAdmin: boolean }`

**Features:**
- DataTable with columns: Date, Home Team, Away Team, Score, Location, Status, Actions
- "Add Game" button for admins
- Search by team name
- Status filter (All/Scheduled/Completed)
- Edit/Delete actions for admins
- Empty state: "No games scheduled yet"
- Loading state: skeletons

### Step 4: Create `src/components/SeasonStandingsView.tsx`

Standings computed client-side from seasonGames.

**Props:** `{ games: SeasonGameWithTeams[], teams: Doc<"teams">[] }`

**Computation:**
1. Initialize stats map: GP=0, W=0, L=0, T=0, PF=0, PA=0 for each team
2. For each completed game: increment GP, assign W/L, add PF/PA
3. Sort by Win % desc, then PF desc

**Columns:** #, Team, GP, W, L, T, Win %, PF, PA, +/-
- Top 2 rows highlighted with light green background
- Empty state: "No completed games to calculate standings"

### Step 5: Wire into Season Detail Page

Modify `src/routes/seasons/$id/index.tsx`:

- Import `SeasonScheduleView`, `SeasonStandingsView`, `useSeasonGames`
- Query season games with `useSeasonGames(id)`
- Enable Schedule and Standings tabs (remove `disabled`)
- Render SeasonScheduleView in schedule tab content
- Render SeasonStandingsView in standings tab content

## Acceptance Criteria

### Schedule Tab
- [ ] Schedule tab shows count of season games
- [ ] Games are listed in a table with Date, Home Team, Away Team, Score, Location, Status
- [ ] Completed games show scores with winner highlighted
- [ ] Adding a game opens SeasonGameDialog and creates via mutation
- [ ] Editing a game pre-fills the dialog and updates via mutation
- [ ] Deleting a game shows confirmation and removes via mutation
- [ ] Search filters games by team name
- [ ] Status filter (All/Scheduled/Completed) works
- [ ] "No games scheduled yet" shown when no games exist
- [ ] "Add Game" button only visible for admins
- [ ] Edit/Delete actions only visible for admins

### Standings Tab
- [ ] Standings table shows all teams in the season ranked by Win %
- [ ] Columns: #, Team, GP, W, L, T, Win %, PF, PA, +/-
- [ ] Completed games correctly contribute to standings
- [ ] Scheduled games are ignored in standings
- [ ] Top 2 rows have green background highlight
- [ ] Win % formatted to 1 decimal (e.g., "75.0%")
- [ ] Point differential shows "+" prefix for positive values
- [ ] "No completed games to calculate standings" shown when no completed games
- [ ] Teams with 0 games played show Win % as "-"

### Data Layer
- [ ] `useSeasonGames` hook returns games with homeTeam and awayTeam populated
- [ ] Loading state is properly handled (isLoading flag)
- [ ] Empty state returns empty array, not undefined

## Edge Cases

### Schedule
- Season with no games: empty state message
- Game where team was deleted: show "Deleted Team" fallback
- Same team selected for home and away: validation error
- Very long team names: truncate with ellipsis
- Scores of 0 are valid (not treated as "no score")
- Editing completed game: changing to scheduled clears scores

### Standings
- No completed games: empty state
- Team with no games: shows 0 across board, Win % = "-"
- All games tied: sorted by PF desc
- Zero scores are valid (correctly counted as 0 PF/PA)
- Large number of teams: scrollable table

## Related Files

### New Files
- `src/hooks/useSeasonGames.ts`
- `src/components/SeasonGameDialog.tsx`
- `src/components/SeasonScheduleView.tsx`
- `src/components/SeasonStandingsView.tsx`

### Modified Files
- `src/routes/seasons/$id/index.tsx`

### Existing References
- `convex/seasonGames.ts` — CRUD mutations/queries (already exists)
- `src/components/GameDialog.tsx` — Pattern for Season Game Dialog
- `src/components/GamesTable.tsx` — Pattern for schedule table
- `src/components/StandingsView.tsx` — Pattern for standings (same algorithm)
- `src/components/ConfirmDelete.tsx` — Delete confirmation pattern

## Design Reference

Full design doc at `src/design/SEASON_SCHEDULE_STANDINGS_DESIGN.md`

## Implementation Order

1. `src/hooks/useSeasonGames.ts` — data hook
2. `src/components/SeasonGameDialog.tsx` — create/edit dialog
3. `src/components/SeasonScheduleView.tsx` — schedule table
4. `src/components/SeasonStandingsView.tsx` — standings table
5. `src/routes/seasons/$id/index.tsx` — wire tabs, import components

## Testing Considerations

- E2E: Admin completes wizard, lands on season detail, views schedule, views standings
- E2E: Admin adds a season game via dialog
- E2E: Admin edits/deletes a season game
- E2E: Standings update after completing a game
- E2E: Unauthenticated user cannot see Add Game button
- Verify `npm run check` passes
- Verify `npm run build` succeeds

## Notes

- `seasonGames.listBySeason` already returns homeTeam and awayTeam populated — no Convex changes needed
- `StandingsView` (tournament) uses `Doc<"games">` with `team1/team2` — too different to reuse. New `SeasonStandingsView` is cleaner against `seasonGames` with `homeTeam/awayTeam`
- Follow `GameDialog.tsx` pattern for SeasonGameDialog
- Follow `GamesTable.tsx` pattern for SeasonScheduleView
- Follow `StandingsView.tsx` logic algorithm for SeasonStandingsView
