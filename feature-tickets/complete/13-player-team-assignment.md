# Feature: Player to Team Assignment

## Overview
Improve the player-team relationship by providing dedicated UI for assigning players to teams, viewing team rosters, and managing player transfers between teams. Currently players have a `teamId` foreign key but there is no team roster view or bulk assignment UI.

## Current State
- `convex/schema.ts` — players have `teamId` foreign key referencing teams
- `convex/players.ts` list query fetches team data for each player
- `src/components/PlayersTable.tsx` shows team name column but no team management
- `src/components/TeamsTable.tsx` shows teams but no roster/player count
- Seed data assigns players to teams (8 per team), but in production there's no way to:
  - View all players on a specific team
  - Assign players to a team
  - Transfer players between teams
  - See player count per team

## Implementation

### Step 1: Team Roster View

Add a "View Players" action to the TeamsTable that shows all players on a team. Options:
- **Inline expansion** — click row to expand and show players
- **Dialog** — modal showing team roster with player details
- **Detail page** — navigate to `/teams/$id` for full team detail

Recommended approach: Start with a dialog for quick viewing, and save a full detail page for later.

### Step 2: Player Assignment in Create Dialog

In the PlayerDialog (ticket 08), include a team selector dropdown that lists all teams. On create, the player is immediately assigned to the selected team.

### Step 3: Team Player Count

Add a player count column to the TeamsTable:

```typescript
{
  header: "Players",
  field: "playerCount", // computed client-side from usePlayers query
  sortable: false,
  cell: (team) => {
    const teamPlayers = players.filter((p) => p.teamId === team._id);
    return <span>{teamPlayers.length}</span>;
  },
}
```

Or compute on the backend in `convex/teams.ts` list query:
```typescript
// After fetching teams, fetch player counts
const allPlayers = await ctx.db.query("players").collect();
const teamsWithCounts = teams.map((team) => ({
  ...team,
  playerCount: allPlayers.filter((p) => p.teamId === team._id).length,
}));
```

### Step 4: Bulk Player Management

Add ability to:
- Select multiple players in the PlayersTable and bulk-assign them to a team
- Move all players from one team to another (team merge)
- Remove a player from a team (set teamId to empty/null)

### Step 5: Filter Players by Team

Ensure player filtering by teamId works end-to-end:
- Select a team in the TeamsTable → navigate to PlayersTable filtered by that team
- Or use the existing teamId filter in the players query

## Acceptance Criteria
- [ ] Team roster can be viewed (click team row → see player list)
- [ ] Player count shown in TeamsTable
- [ ] Player create dialog has team assignment dropdown
- [ ] Player edit dialog allows team change
- [ ] Players can be removed from teams
- [ ] Bulk player assignment (future enhancement)
- [ ] Filtering players by team works from TeamsTable context

## Related Files
- `convex/teams.ts` — MODIFY (include playerCount in list query)
- `src/components/TeamsTable.tsx` — MODIFY (add player count column, view roster action)
- `src/components/PlayerDialog.tsx` — MODIFY (team assignment on create/edit)
- `src/components/PlayersTable.tsx` — MODIFY (teamId filter integration)
- `src/components/TeamRosterDialog.tsx` — NEW (team roster view)

## Notes
- Team-roster assignment is a core workflow for tournament organizers
- Start with simple dialog-based roster view, enhance to full detail page later
- The team selector in create/edit dialogs should show team name + tournament context
- Consider adding a "players per team" limit check based on tournament settings
- Future: drag-and-drop players between teams in tournament detail
