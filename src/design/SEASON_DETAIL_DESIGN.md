# Season Detail Page Design

## Overview

The season detail page at `/seasons/$id` serves as the post-wizard landing page and provides a read-only overview of a season with its linked teams and tournament. Admins can edit season metadata via a dialog.

## Wireframe

```
+------------------------------------------------------------------+
| [← Back to Seasons]                                              |
|                                                                  |
| Spring 2025 Season                              [✏️ Edit]        |
| [active] [Baseball]                                               |
|                                                                  |
| +-------------+  +-------------+  +-------------+                |
| | Details     |  | Teams       |  | Tournament  |                |
| | Name: Spring|  | [icon]  3   |  | [icon] Spring|               |
| | Sport: Baseb|  | Teams       |  | Championship |               |
| | Dates: Mar..|  |             |  +-------------+                |
| | Description:|  +-------------+                                  |
| | ...         |                                                  |
| +-------------+                                                  |
|                                                                  |
| [Overview (2)] [Schedule] [Standings]                            |
|                                                                  |
| +-----------+  +-----------+  +-----------+                      |
| | Eagles    |  | Hawks     |  | ...       |                      |
| | Portland  |  | Salem     |  |           |                      |
| | [active]  |  | [active]  |  |           |                      |
| +-----------+  +-----------+  +-----------+                      |
+------------------------------------------------------------------+
```

## Section Breakdown

### Header Row
- **Back button**: Ghost button with ArrowLeft icon, navigates to `/seasonspage`
- **Title**: Season name in `text-3xl font-bold truncate`
- **Badge row**: Status badge (amber/emerald/purple based on status) + Sport badge (secondary variant)
- **Edit button**: Icon button (pencil) visible only for admins, opens SeasonDialog

### Info Cards (responsive grid: 1-col mobile, 3-col desktop)
1. **Details card**: name, sport, date range (formatDateRange), description (line-clamp-3)
2. **Teams card**: Users icon + team count number + label
3. **Tournament card**: Trophy icon + linked tournament name (link button) or "No tournament configured"

### Tabs
- **Overview** (default): Team cards grid (1/2/3 col responsive)
  - Each team card: team name (truncate), city/location, status badge
  - Empty state: "No teams added yet."
  - Loading state: Skeleton rows
- **Schedule** (disabled): Placeholder message
- **Standings** (disabled): Placeholder message

### SeasonDialog
- Edit-only dialog for season fields: name, sport, dates, status, description
- Pattern matches TournamentDialog with simpler scope
- Uses `api.seasons.update` mutation with toast feedback

## Technical Implementation

### Route
- `src/routes/seasons/$id/index.tsx` — uses `createFileRoute` with path `/seasons/$id/`

### Data Dependencies
- `useSeasonById(id)` — returns `Doc<"seasons"> | undefined | null` (includes `teamCount`)
- `useSeasonTeams(id)` — returns `{ teams: Doc<"teams">[], isLoading: boolean }`
- `api.tournaments.getBySeasonId` — returns `Doc<"tournaments"> | null`

### Components Used
- shadcn: Badge, Button, Card, Skeleton, Tabs
- Custom: SeasonDialog
- Icons: ArrowLeft, Edit, Trophy, Users (lucide-react)

### State Management
- `editDialogOpen: boolean` — controls SeasonDialog visibility
- `isAdmin` from `useAuth()` — controls edit button visibility

### Responsive Behavior
- `grid-cols-1 md:grid-cols-3` for info cards
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for team cards
- `py-8` vertical padding on all viewports

## Edge Cases Handled
- Season not found: 404-style message with back button
- Loading: Skeleton placeholders for all sections
- No teams: "No teams added yet." empty state
- No tournament: "No tournament configured" message
- Long text: truncate/line-clamp on name, description, team names
- Admin vs spectator: Edit button hidden for non-admins

## Future Enhancements
- Schedule tab: Regular season games from seasonGames table
- Standings tab: W/L records computed from seasonGames
- Team detail navigation: Click team card → team detail page
- View Season link on tournament detail page
- Season status badge hover/tooltip with description
