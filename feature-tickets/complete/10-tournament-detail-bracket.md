# Feature: Tournament Detail View & Bracket Visualization

## Overview
Build a tournament detail page that shows all tournament information, a list of registered teams, the game schedule, and a visual bracket for elimination tournaments. This transforms the app from a simple data browser into a true tournament tracker.

## Current State
- No tournament detail route exists
- Clicking a tournament name does nothing (no navigation)
- Teams are visible in the teams table but not grouped by tournament
- Games have no UI (see ticket 09)
- Bracket types exist in schema (single, double_elimination, round_robin) but have zero visualization
- No way to see tournament progress or standings

## Prerequisites
- [ ] Ticket `06-crud-mutations.md` — tournament getById must exist
- [ ] Ticket `07-tournament-management.md` — tournament table must exist
- [ ] Ticket `08-create-edit-flows.md` — dialog patterns established
- [ ] Ticket `09-games-management.md` — games must be viewable

## Implementation Steps

### Step 1: Create Tournament Detail Route

```typescript
// src/routes/tournaments/$id/index.tsx
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/tournaments/$id/")({
  component: TournamentDetailPage,
});

function TournamentDetailPage() {
  const { id } = useParams({ from: "/tournaments/$id/" });
  const { isAdmin } = useAuth();
  const tournament = useQuery(api.tournaments.getById, { id: id as Id<"tournaments"> });
  const teams = useQuery(api.teams.list, {
    filtering: { tournamentId: id as Id<"tournaments"> },
  });
  const games = useQuery(api.games.getByTournament, {
    tournamentId: id as Id<"tournaments">,
  });
  const fields = useQuery(api.fields.getByTournament, {
    tournamentId: id as Id<"tournaments">,
  });

  if (!tournament) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header section */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{tournament.name}</h1>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{tournament.sport}</Badge>
            <Badge>{tournament.status.replace(/_/g, " ")}</Badge>
            <Badge variant="secondary">
              {tournament.currentTeamCount}/{tournament.maxTeams} Teams
            </Badge>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline">Edit Tournament</Button>
            <Button>Schedule Games</Button>
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Location:</span> {tournament.location || "TBD"}</p>
            <p><span className="text-muted-foreground">Dates:</span> {formatDateRange(tournament.startDate, tournament.endDate)}</p>
            <p><span className="text-muted-foreground">Bracket:</span> {BRACKET_LABELS[tournament.bracketType]}</p>
            <p><span className="text-muted-foreground">Seeding:</span> {tournament.seedingType}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Game Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Fields:</span> {fields?.length || 0}</p>
            <p><span className="text-muted-foreground">Game Duration:</span> {tournament.gameDuration} min</p>
            <p><span className="text-muted-foreground">Break:</span> {tournament.breakBetweenGames} min</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Registration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Deadline:</span> {formatDate(tournament.registrationDeadline)}</p>
            <p><span className="text-muted-foreground">Min Teams:</span> {tournament.minTeams}</p>
            <p><span className="text-muted-foreground">Max Teams:</span> {tournament.maxTeams}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Teams | Games | Bracket | Standings */}
      <Tabs defaultValue="teams">
        <TabsList>
          <TabsTrigger value="teams">Teams ({teams?.totalCount || 0})</TabsTrigger>
          <TabsTrigger value="games">Games ({games?.length || 0})</TabsTrigger>
          <TabsTrigger value="bracket">Bracket</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="mt-4">
          {/* Teams list for this tournament */}
          {teams?.teams?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.teams.map((team) => (
                <TeamCard key={team._id} team={team} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No teams registered yet.
            </div>
          )}
        </TabsContent>

        <TabsContent value="games" className="mt-4">
          {/* Games list for this tournament */}
          <GamesTable
            tournamentId={tournament._id}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="bracket" className="mt-4">
          {/* Bracket visualization */}
          <BracketView
            bracketType={tournament.bracketType}
            games={games || []}
          />
        </TabsContent>

        <TabsContent value="standings" className="mt-4">
          {/* Standings/rankings */}
          <StandingsView
            tournamentId={tournament._id}
            games={games || []}
            teams={teams?.teams || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function formatDate(ms?: number): string {
  if (!ms) return "TBD";
  return new Date(ms).toLocaleDateString();
}

function formatDateRange(start?: number, end?: number): string {
  if (!start && !end) return "TBD";
  if (start && !end) return `From ${formatDate(start)}`;
  if (!start && end) return `Until ${formatDate(end)}`;
  return `${formatDate(start)} — ${formatDate(end)}`;
}
```

### Step 2: Add shadcn Components

```bash
bunx shadcn@latest add tabs
bunx shadcn@latest add separator
bunx shadcn@latest add tooltip
```

### Step 3: Create Bracket Visualization Components

The bracket should handle three bracket types:

**Single Elimination Bracket (`src/components/Bracket/SingleElimination.tsx`):**
- Classic tournament bracket layout
- Rounds flow left to right
- Winners advance to next round
- Uses CSS grid or flexbox for alignment
- Each match shows team names, score, and status

```typescript
// Conceptual layout:
// Round 1        Round 2        Finals
// Team A ──────┐
//              ├── Winner ────┐
// Team B ──────┘              │
//                              ├── Champion
// Team C ──────┐              │
//              ├── Winner ────┘
// Team D ──────┘
```

**Double Elimination Bracket (`src/components/Bracket/DoubleElimination.tsx`):**
- Winners bracket + Losers bracket
- More complex layout with grid
- Scrollable container for larger brackets

**Round Robin Table (`src/components/Bracket/RoundRobin.tsx`):**
- Shows all teams and their match results
- Win/Loss/Tie record for each team
- Sorted by points/win percentage

All bracket components should be wrapped in a shared `BracketView` component that selects the appropriate visualization:

```typescript
interface BracketViewProps {
  bracketType: "single" | "double_elimination" | "round_robin";
  games: Array<GameWithTeams>;
}

export function BracketView({ bracketType, games }: BracketViewProps) {
  switch (bracketType) {
    case "single":
      return <SingleElimination games={games} />;
    case "double_elimination":
      return <DoubleElimination games={games} />;
    case "round_robin":
      return <RoundRobin games={games} />;
  }
}
```

### Step 4: Create Standings View (`src/components/StandingsView.tsx`)

For tournaments with games recorded, show team standings:
- Rank, Team Name, Games Played, Wins, Losses, Ties, Win %, Points For/Against, +/- Differential
- Sortable by win percentage, wins, or points
- Responsive table layout
- Highlights top teams (playoff qualifiers)

### Step 5: Create Team Registration Flow

Add ability for admins to:
- Register existing teams into a tournament
- Create new teams directly from tournament detail page
- Remove teams from a tournament
- View registration status (pending/approved/declined)

### Step 6: Create Team Card Component (`src/components/TeamCard.tsx`)

For the Teams tab on the detail page:
- Team name, coach info, status badge
- Number of players on the team
- Quick actions: View Players, Edit Team, Remove from Tournament
- Link to team detail (future)

### Step 7: Navigation to Detail

Make tournament names clickable in the TournamentTable:

```typescript
// In TournamentTable columns
{
  header: "Name",
  field: "name",
  sortable: true,
  cell: (t) => (
    <Link
      to="/tournaments/$id"
      params={{ id: t._id }}
      className="font-medium hover:text-primary transition-colors"
    >
      {t.name}
    </Link>
  ),
}
```

## Acceptance Criteria
- [ ] Tournament detail page is accessible at `/tournaments/$id`
- [ ] Detail page shows tournament info: name, sport, status, dates, location, bracket type, seeding
- [ ] Detail page has info cards (Details, Game Settings, Registration)
- [ ] Tabs system with: Teams, Games, Bracket, Standings
- [ ] Teams tab shows registered teams with TeamCard components
- [ ] Games tab shows games scheduled for the tournament
- [ ] Bracket tab renders appropriate bracket type visualization
- [ ] Singles elimination bracket shows round progression
- [ ] Round robin view shows team-vs-team matrix or standings table
- [ ] Standings tab shows ranked teams with W/L record, win %, +/- differential
- [ ] Tournament names are clickable links in the tournament table
- [ ] Admin quick actions: Edit Tournament, Schedule Games
- [ ] Loading and empty states for all tabs
- [ ] Responsive layout works on mobile and desktop

## Edge Cases
- Tournament with no teams registered (empty teams tab)
- Tournament with no games scheduled (empty games/bracket tabs)
- Bracket with uneven number of teams (byes)
- Tournament registration deadline passed (visual indicator)
- Completed tournament should show final results on standings
- Round robin with large number of teams (scrollable table)
- Double elimination bracket rendering complexity with many teams
- Tournament not found (invalid ID)

## Testing Considerations
- Test tournament detail renders with seed data
- Test navigation from tournament table to detail page
- Test all tabs render correctly
- Test empty state for each tab
- Test single elimination bracket with 4 teams (2 games → 1 final)
- Test round robin standings calculation
- Test admin vs spectator view differences
- Test responsive layout

## Related Files
- `src/routes/tournaments/$id/index.tsx` — NEW detail route
- `src/components/Bracket/BracketView.tsx` — NEW bracket router
- `src/components/Bracket/SingleElimination.tsx` — NEW
- `src/components/Bracket/DoubleElimination.tsx` — NEW
- `src/components/Bracket/RoundRobin.tsx` — NEW
- `src/components/StandingsView.tsx` — NEW
- `src/components/TeamCard.tsx` — NEW
- `src/components/TournamentTable.tsx` — MODIFY (clickable names)
- `src/components/ui/tabs.tsx` — ADD (shadcn component)
- `convex/games.ts` — DEPENDS ON (getByTournament query)

## Helpful Resources

### Tournament Brackets
- [Single Elimination Brackets](https://en.wikipedia.org/wiki/Single-elimination_tournament)
- [Double Elimination Brackets](https://en.wikipedia.org/wiki/Double-elimination_tournament)
- [Round Robin Tournaments](https://en.wikipedia.org/wiki/Round-robin_tournament)

### CSS Bracket Layouts
- [CSS Tournament Bracket](https://codepen.io/collection/nLpNJm) — reference layouts
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout) — for bracket alignment
- [Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) — flexible bracket sizing

### React Router
- [TanStack Router Route Params](https://tanstack.com/router/latest/docs/framework/react/guide/route-paths)
- [TanStack Router Nested Routes](https://tanstack.com/router/latest/docs/framework/react/guide/nested-routes)

## Notes
- Start with single elimination bracket (most common) — it's the simplest to implement
- Round robin standings can be computed client-side from game data
- Double elimination is the most complex — implement last
- Use CSS Grid for bracket alignment rather than absolute positioning
- Keep brackets horizontally scrollable for tournaments with many rounds
- Consider a "compact" bracket view for mobile screens
- Standings calculation: Win = 2 pts, Tie = 1 pt, Loss = 0 pts (configurable per sport)
- Bye handling: if odd number of teams, top seed gets a first-round bye
- The bracket view should work both as a read-only display and as an interactive management tool for admins
- Future: drag-and-drop team seeding in bracket view
