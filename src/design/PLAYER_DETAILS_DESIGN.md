# Player Details Page Design

## Overview

The player details page at `/players/$id` displays comprehensive player information including team assignment, player stats per sport, and game context. This page serves as the primary interface for viewing player details from both the players table and teams table navigation.

## Wireframe

```
+------------------------------------------------------------------+
| [← Back to Players]                                              |
|                                                                  |
| Emma Wilson #23 [bat] [active]             [✏️ Edit]                |
| [Baseball team]                                                 |
|                                                                  |
| +-------------+  +-------------+  +-------------+                |
| | Profile     |  | Team        |  | Stats       |                |
| | Name: Emma  |  | Broncos     |  | Games: 35   |                |
| | Sport: Baseb|  | Captain: Yes|  | AVG: .274   |                |
| | #23         |  |            |  | HR: 8       |                |
| | Contact     |  |            |  | RBI: 45     |                |
| +-------------+  +-------------+  +-------------+                |
|                                                                  |
| [Overview] [Game Stats] [Games]                                 |
|                                                                  |
| +-----------+                                                +
| | First: Emma|                                                |
| | Last: Wilson|                                                |
| | Email: emma@...|                                            |
| | Phone: (555)|...|                                            |
| +-----------+                                                |
+------------------------------------------------------------------+
```

## Section Breakdown

### Header Row
- **Back button**: Ghost button with ArrowLeft icon, navigates to `/playerspage`
- **Title**: Player name and # in `text-3xl font-bold truncate`, with icon
- **Badge row**: Status badge (color-coded based on status), Sport badge (secondary variant)
- **Edit button**: Icon button (pencil) visible only for admins, opens PlayerDialog

### Info Cards (responsive grid: 1-col mobile, 3-col desktop)
1. **Profile card**: full name, jersey #, position, email, phone (truncated)
2. **Team card**: team name with link, captain status (Yes/No), organization
3. **Stats card**: games played, batting average, home runs, RBIs, other relevant stats

### Tabs
- **Overview** (default): Player profile details, contact information
- **Game Stats** (tab + embedded PlayerGameStatsDialog): per-game stats table
- **Games** (optional): game schedule/context if needed

### PlayerDialog
- Edit-only dialog for player fields: firstName, lastName, jerseyNumber, position, email, phone, status
- Uses `api.players.update` mutation with toast feedback
- Pattern matches existing PlayerDialog component

## Technical Implementation

### Route
- `src/routes/players/$id/index.tsx` — uses `createFileRoute` with path `/players/$id/`

### Data Dependencies
- `usePlayerById(id)` — returns `PlayerWithTeam` or null/undefined (includes joined team)
- `useGameStatsByPlayer(id)` — returns `GameStatWithGame[]` or undefined (includes game data)
- `useAuth()` — provides admin status and RBAC controls

### Components Used
- shadcn: Badge, Button, Card, Skeleton, Tabs
- Custom: PlayerDetails, PlayerGameStatsDialog (embedded), PlayerDialog
- Icons: ArrowLeft, Edit, User, Phone, Mail, Baseball (lucide-react)
- Spinner: For loading states

### State Management
- `editDialogOpen: boolean` — controls PlayerDialog visibility
- `isAdmin` from `useAuth()` — controls edit button visibility
- Loading states for both player data and stats data

### Responsive Behavior
- `grid-cols-1 md:grid-cols-3` for info cards
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for stat cards
- `py-8` vertical padding on all viewports

## Edge Cases Handled
- Player not found: 404-style message with back button
- Loading: Skeleton placeholders for all sections
- Player with no team: "No Team" display in team card
- Player with no stats: "No game stats recorded" empty state
- Long text: truncate/line-clamp on name, email, description
- Admin vs spectator: Edit button hidden for non-admins
- Data fallback: Graceful degradation for missing optional fields

## Future Enhancements
- Add quick stats overview for multi-sport players
- Player comparison tool
- Seasonal stats views (by season)
- Advanced statistics (batting splits, etc.)
- Edit games stats for players
- Player health/injury tracking

## Feature Flags
- `adminOnlyEdit` - Controls visibility of edit functionality
- `enableGameStatsTab` - Can be disabled if not needed
- `showContactInfo` - Can be hidden for certain roles

## Acceptance Criteria

### Core Features
- [ ] Route `/players/$id/` renders player details page
- [ ] Navigation: accessible from players page via name click
- [ ] Navigation: accessible from teams page via captain link
- [ ] Header: back button, player name, status/sport badges
- [ ] Info cards: player profile, team info, stats summary
- [ ] Tabs: Overview (default), Game Stats, (optional) Games
- [ ] Stats tab: displays per-game stats (reuses PlayerGameStatsDialog)
- [ ] Edit dialog: accessible only to admins
- [ ] Loading states: skeleton placeholders for all sections
- [ ] Error states: not found message with back button
- [ ] RBAC: admin vs spectator visibility (edit controls only)

### Data Display
- [ ] Player name and contact info displayed
- [ ] Team assignment shown with link
- [ ] All per-sport stats aggregated and displayed
- [ ] Games listed chronologically with round/season context
- [ ] Loading skeleton for each data section
- [ ] Empty state when no stats recorded

### Navigation
- [ ] Back to `/playerspage` from header
- [ ] Clickable from PlayersTable contact view
- [ ] Clickable from PlayersTable stats view
- [ ] Accessible from TeamsTable if implemented
- [ ] Preserve any context from listing page

## Technical Notes

- Follows same patterns as `SEASON_DETAIL_DESIGN.md` but adapted for player context
- Reuses existing `PlayerGameStatsDialog` component embedded in Game Stats tab
- Uses similar RBAC patterns as season detail page
- Loading and error states match existing app patterns
- Responsive grid layouts match design system standards

Base directory for this skill: /home/nmartin/Documents/Projects/TanStack/tournement-tracker/.opencode/skills/feature-ticket-workflow
Relative paths in this skill (e.g., scripts/, references/) are relative to this base directory.