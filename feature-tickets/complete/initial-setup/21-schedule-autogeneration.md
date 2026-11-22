# Feature 21: Schedule Auto-Generation with Tournament Brackets

## Overview

Add automatic schedule generation for seasons and tournament bracket generation for playoffs. Admins configure the regular season length (weeks), game days per week, and schedule type, then the system generates all season games using round-robin scheduling. Once the regular season is complete, the system generates tournament bracket games seeded by final standings.

## Prerequisites

- [x] Ticket 14 — Schema season foundation (seasons, seasonGames, seasonTeams tables exist)
- [x] Ticket 15 — Season Convex functions (seasonGames CRUD at `convex/seasonGames.ts`)
- [x] Ticket 19 — Season detail page (route at `src/routes/seasons/$id/index.tsx`)
- [x] Ticket 20 — Season Schedule & Standings tabs (ScheduleView, StandingsView, GameDialog exist)

## Implementation Steps

### Step 1: Schema Changes (`convex/schema.ts`)

Add scheduling config fields to the `seasons` table:

```typescript
regularSeasonWeeks: v.number(),
gamesPerWeek: v.number(),
gameDays: v.array(v.number()),  // day-of-week indices: 0=Sun, 1=Mon...6=Sat
scheduleType: v.union(v.literal("single_round_robin"), v.literal("double_round_robin")),
regularSeasonComplete: v.optional(v.boolean()),
playoffTeamsCount: v.optional(v.number()),
```

Make `games.team1Id` and `games.team2Id` optional so future bracket rounds can be pre-generated with "TBD" slots:

```typescript
team1Id: v.optional(v.id("teams")),
team2Id: v.optional(v.id("teams")),
```

After schema changes, run `npx convex dev` to generate updated type bindings.

### Step 2: Create `src/lib/scheduleGenerator.ts`

Shared utility for computing game-day timestamps from configuration:

```typescript
export interface ScheduleConfig {
  startDate: number;          // season start (ms timestamp)
  regularSeasonWeeks: number;
  gameDays: number[];         // day-of-week indices
}

export function computeGameDays(config: ScheduleConfig): number[]
```

Returns a flat array of ms timestamps for each game day across the season.

### Step 3: Add `generateSchedule` Mutation (`convex/seasonGames.ts`)

**Args:**
- `seasonId: v.id("seasons")`
- `regularSeasonWeeks: v.number()`
- `gamesPerWeek: v.number()`
- `gameDays: v.array(v.number())`
- `scheduleType: v.union(v.literal("single_round_robin"), v.literal("double_round_robin"))`

**Algorithm (circle method):**
1. Fetch all teams in the season via `seasonTeams.listBySeason`
2. If odd team count, add a phantom "bye" placeholder (will produce no game for the paired team)
3. Generate rounds:
   - **Single round-robin**: N-1 rounds (each team plays each other once)
   - **Double round-robin**: 2*(N-1) rounds (home-and-away)
   - Each round produces floor(N/2) pairings
   - Circle method: fix team 1, rotate all others clockwise each round
4. Map rounds to game-day dates using `computeGameDays()`:
   - Round 1 → first game day, Round 2 → second game day, etc.
   - If more slots than rounds, spread out; if fewer, error
5. Alternate home/away based on round parity
6. Skip "bye" pairings (don't create a game for them)
7. Delete any existing season games for this season (with confirm), insert all new ones
8. Update the season document with the schedule config fields
9. Return `{ gameCount, totalRounds, weeksUsed }`

**Validation:**
- Season must have at least 2 teams
- `regularSeasonWeeks * gamesPerWeek` must be >= total rounds
- Season must not already have completed games (if so, block with warning)
- Auth: organizer/admin only

### Step 4: Create `src/components/GenerateScheduleDialog.tsx`

**Props:** `{ seasonId: Id<"seasons">, startDate: number, teamCount: number, open, onOpenChange, onSuccess }`

**Form fields:**

| Field | Control | Default |
|-------|---------|---------|
| Schedule Type | Radio: Single / Double Round-Robin | Single |
| Regular Season Weeks | Number input | 10 |
| Games Per Week | Number input (1-7) | 2 |
| Game Days | Checkbox group (Su Mo Tu We Th Fr Sa) | Mon, Wed (limited to games per week count) |
| Summary | Read-only display | "X teams × Y rounds = Z games over W weeks" |

**Behavior:**
- Changing weeks/gameDays updates the summary live
- Game Days checkboxes limited to `gamesPerWeek` max selections
- "Generate" button calls `api.seasonGames.generateSchedule`
- Loading state during generation
- On success: toast, close, call `onSuccess` which refreshes the schedule view
- If games already exist: confirm dialog "Replace existing schedule?"
- Validation: ensures total slots >= rounds needed

### Step 5: Add `generateBracket` Mutation (`convex/games.ts`)

**Args:**
- `tournamentId: v.id("tournaments")`
- `seasonId: v.id("seasons")`
- `playoffTeamsCount: v.number()`

**Algorithm:**
1. Fetch season standings from completed seasonGames (client-style computation, re-implemented server-side)
2. Take top K teams sorted by Win % → PF
3. Round K up to next power of 2 if needed (with byes)
4. Validate against `tournament.bracketType`:
   - Single elimination: K must produce valid bracket (auto-adjust if not power of 2)
5. Generate bracket games:

   **Single elimination example for K=8:**
   - Round 1 (quarterfinals): gameNumber 1-4, team1Id/team2Id set
   - Round 2 (semifinals): gameNumber 5-6, teams TBD
   - Round 3 (finals): gameNumber 7, teams TBD

   **Seeding:** 1 vs 8, 4 vs 5, 3 vs 6, 2 vs 7 (standard snake seeding)

6. Assign `scheduledTime` by spreading across 2 playoff weeks using the season's `gameDays`
7. Delete any existing tournament games (with confirm), insert all new ones
8. Set `season.regularSeasonComplete = true`

**Validation:**
- Tournament must be linked to the season
- Season must have completed games
- Playoff teams count must be >= 2
- Playoff teams count must be <= total teams in season
- Tournament must not already have completed games

### Step 6: Create `src/components/GenerateBracketDialog.tsx`

**Props:** `{ seasonId: Id<"seasons">, tournamentId: Id<"tournaments"> | null, bracketType: string, open, onOpenChange, onSuccess }`

**Form fields:**

| Field | Control | Notes |
|-------|---------|-------|
| Teams in Playoffs | Number input | Default 4, validated against team count |
| Tournament | Select from linked tournaments on season | Or "No tournament linked" message |
| Bracket Type | Read-only display | From tournament config |
| Seeding Preview | Table | Shows projected seeds based on current standings |

**Behavior:**
- Fetches current standings to show seeding preview
- If no tournament linked, shows message and links to create one
- "Generate" button calls `api.games.generateBracket`
- On success: toast, optionally navigate to tournament detail page
- If games exist: confirm "Regenerate bracket?"

### Step 7: Modify `SeasonScheduleView.tsx`

Add "Generate Schedule" button to the toolbar (admin only, hidden if current user is not admin):

```typescript
// In toolbar actions, prepend if isAdmin:
{
  label: "Generate Schedule",
  variant: "default" as const,
  onClick: handleGenerateSchedule,
}
```

Add state for the dialog:
```typescript
const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
```

Render dialog at bottom of component:
```tsx
<GenerateScheduleDialog
  seasonId={seasonId}
  startDate={seasonStartDate}
  teamCount={teams.length}
  open={generateDialogOpen}
  onOpenChange={setGenerateDialogOpen}
  onSuccess={() => { /* refresh handled by useSeasonGames auto-refetch */ }}
/>
```

Update `SeasonScheduleViewProps` to include `seasonStartDate`:
```typescript
interface SeasonScheduleViewProps {
  seasonId: Id<"seasons">;
  teams: Team[];
  isAdmin: boolean;
  seasonStartDate: number;
  scheduleConfig?: {
    regularSeasonWeeks: number;
    gamesPerWeek: number;
    gameDays: number[];
    scheduleType: "single_round_robin" | "double_round_robin";
    regularSeasonComplete?: boolean;
  };
}
```

### Step 8: Modify `SeasonStandingsView.tsx`

Add "Generate Tournament Bracket" button below the standings table (admin only, only when at least one game is completed):

```typescript
interface SeasonStandingsViewProps {
  games: SeasonGameWithTeams[];
  teams: Doc<"teams">[];
  isAdmin?: boolean;
  seasonId?: Id<"seasons">;
  linkedTournament?: { _id: Id<"tournaments">; name: string; bracketType: string } | null;
  regularSeasonComplete?: boolean;
}
```

Button renders at bottom:
```tsx
{isAdmin && hasCompletedGames && (
  <GenerateBracketDialog
    seasonId={seasonId}
    tournamentId={linkedTournament?._id}
    bracketType={linkedTournament?.bracketType}
    open={generateBracketOpen}
    onOpenChange={setGenerateBracketOpen}
    onSuccess={() => navigate to tournament page}
  />
)}
```

### Step 9: Wire into Season Detail Page (`src/routes/seasons/$id/index.tsx`)

Pass additional props to schedule and standings views:

```typescript
// SeasonScheduleView — pass startDate and schedule config
<SeasonScheduleView
  seasonId={id as Id<"seasons">}
  teams={teams}
  isAdmin={isAdmin}
  seasonStartDate={season.startDate}
  scheduleConfig={{
    regularSeasonWeeks: season.regularSeasonWeeks,
    gamesPerWeek: season.gamesPerWeek,
    gameDays: season.gameDays,
    scheduleType: season.scheduleType,
    regularSeasonComplete: season.regularSeasonComplete,
  }}
/>

// SeasonStandingsView — pass admin state + tournament info
<SeasonStandingsView
  games={seasonGames}
  teams={teams}
  isAdmin={isAdmin}
  seasonId={id as Id<"seasons">}
  linkedTournament={linkedTournament}
  regularSeasonComplete={season.regularSeasonComplete}
/>
```

### Step 10: Regenerate Convex Bindings

Run `npx convex dev` to regenerate type bindings after schema changes.

## Acceptance Criteria

### Schedule Generation
- [ ] "Generate Schedule" button visible on Schedule tab for admins
- [ ] Button opens GenerateScheduleDialog with all config fields
- [ ] Can select Single or Double round-robin
- [ ] Can set regular season weeks (default 10)
- [ ] Can set games per week (default 2)
- [ ] Can pick specific days of the week (limited to games per week count)
- [ ] Summary shows total games and weeks preview
- [ ] Generating creates correct number of round-robin pairings
- [ ] Each team plays every other team (once or twice based on type)
- [ ] Games are assigned to correct days of the week
- [ ] Home/away alternates appropriately
- [ ] Existing games are replaced with confirmation
- [ ] Season document is updated with schedule config
- [ ] Non-admins cannot see the Generate button
- [ ] Season with < 2 teams shows error
- [ ] Not enough slots for rounds shows validation error

### Bracket Generation
- [ ] "Generate Tournament Bracket" button visible on Standings tab for admins
- [ ] Button only shown when at least one game is completed
- [ ] Seeding preview shows current standings projected into bracket
- [ ] Top K teams advance to tournament based on config
- [ ] Teams are seeded correctly (1 vs K, 2 vs K-1, etc.)
- [ ] Bracket games are created with correct round/gameNumber
- [ ] Future round games have TBD teams (null team IDs)
- [ ] Games are spread across 2 playoff weeks
- [ ] Bracket renders correctly in the tournament detail BracketView
- [ ] Non-admins cannot see the Generate button
- [ ] No tournament linked shows helpful message

## Edge Cases

### Schedule Generation
- **Odd number of teams**: bye rounds handled correctly (no game created)
- **No teams in season**: block with "Add teams first"
- **Already has completed games**: warn that this will reset scores
- **Already has scheduled games**: confirm replacement
- **Too few game days for rounds**: error message suggesting more weeks/days
- **Too many game days**: schedule spreads out, some days have no games
- **Season start date in the past**: allow but warn
- **Single team season**: error, minimum 2 teams
- **Large number of teams**: verify performance of circle algorithm

### Bracket Generation
- **Playoff team count not power of 2**: auto-round to next power of 2 with byes
- **Too few completed games**: show current standings but warn if incomplete
- **Tournament already has games**: confirm regeneration
- **Tournament already has completed games**: block, can't regenerate
- **Tie in standings**: tiebreak by PF, then head-to-head (note: head-to-head not implemented in v1, just PF)
- **Less than 2 teams in season**: can't generate
- **Playoff count > team count**: clamp to team count
- **Bye teams**: teams with byes auto-advance to next round (handled by not creating a round 1 game)

## Related Files

### New Files
- `src/lib/scheduleGenerator.ts` — game-day computation utility
- `src/components/GenerateScheduleDialog.tsx` — schedule config modal
- `src/components/GenerateBracketDialog.tsx` — bracket generation modal

### Modified Files
- `convex/schema.ts` — add season config + optional game team IDs
- `convex/seasonGames.ts` — add `generateSchedule` mutation
- `convex/games.ts` — add `generateBracket` mutation
- `src/components/SeasonScheduleView.tsx` — add Generate button + dialog
- `src/components/SeasonStandingsView.tsx` — add Generate Bracket button
- `src/routes/seasons/$id/index.tsx` — wire new props

## Implementation Order

1. `src/lib/scheduleGenerator.ts` — shared day-computation utility
2. `convex/schema.ts` — schema changes for seasons + games
3. `convex/seasonGames.ts` — `generateSchedule` mutation
4. `src/components/GenerateScheduleDialog.tsx` — schedule config UI
5. `src/components/SeasonScheduleView.tsx` — wire Generate button
6. `convex/games.ts` — `generateBracket` mutation
7. `src/components/GenerateBracketDialog.tsx` — bracket generation UI
8. `src/components/SeasonStandingsView.tsx` — wire Generate Bracket button
9. `src/routes/seasons/$id/index.tsx` — wire all new props
10. Run `npx convex dev` to regenerate bindings
11. Test with `npm run check && npm run build`

## Testing

### Unit / Integration
- Verify round-robin algorithm produces correct pairings for 2, 3, 4, 5, 6, 8, 10 teams
- Verify single vs double round-robin produces correct game counts
- Verify bye rounds don't create games
- Verify game days map to correct dates
- Verify bracket seeding produces correct matchups
- Verify null team IDs work in bracket views

### E2E Tests (Playwright)
- `tests/e2e/schedule-autogeneration.spec.ts` — E2E test suite for schedule generation
- `tests/e2e/pages/SeasonDetailPage.ts` — Page object for the season detail route

Test scenarios covered:
- **Happy path**: Navigate to a season → Schedule tab → open Generate Schedule dialog → configure Double Round-Robin → submit → verify success toast and schedule table
- **Validation**: Open dialog → enter too-few weeks → verify generate button is disabled
- **Standings**: Switch to Standings tab → verify table renders → click Generate Tournament Bracket if available
- **Unauthenticated**: Visit season detail while signed out → verify "please sign in" prompt

All tests use `test.skip()` to gracefully handle missing seed data (no seasons, not admin, etc.).

### Commands
```bash
npm run check          # Biome lint + format
npm run build          # TypeScript compilation
npm run test:e2e schedule-autogeneration.spec.ts  # E2E tests (requires CLERK_TEST_EMAIL/PASSWORD)
```

## Design Reference

Full planning discussion in `feature-tickets/TODO/21-schedule-autogeneration.md` (this file). UI follows patterns established by existing dialogs and data tables.

## Notes

- The game-day computation utility uses `season.startDate` as week 1, day 1
- Round-robin circle method: fix team[0], rotate teams[1..N-1] clockwise each round
- For double round-robin, run the circle method twice, swapping home/away in the second pass
- Bracket seeding uses standard snake format: 1 vs K, 2 vs K-1, 3 vs K-2, etc.
- Null team IDs for future bracket rounds — the bracket UI already handles null (shows "TBD")
- The standings computation on the server-side for bracket seeding mirrors the client-side `SeasonStandingsView` logic
