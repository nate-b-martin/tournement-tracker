# Feature 25: Player Details Page

## Overview

Add a dedicated player details page at `/players/$id` that displays comprehensive player information including team assignment and all their stats per sport. Accessible from the players page (clicking player names) and any table that lists players (e.g., PlayersTable, TeamsTable, Season roster views).

## Prerequisites

- [x] Feature 21 — Schedule Auto-Generation (season data generation)
- [x] Feature 22 — Quality Seed Data for MVP Testing (player stats data now available)
- [x] Feature 23 — MVP Implementation Complete (hooks, queries, components)
- [x] Feature 24 — UI/UX and Custom Hooks Complete (existing hooks available)

## Related Components

### Existing Components to Leverage

1. **Route Pattern**: `src/routes/players/$id/index.tsx` (follows same pattern as seasons/$id/)

2. **Design Pattern**: Adapt `SEASON_DETAIL_DESIGN.md` for player context:
   - Header with back button, player name, status badges
   - Info cards (player details, team, sport summary)
   - Tabs (Overview/Stats/Games)

3. **Data Hooks**:
   - `usePlayerById()` - Core player data with team
   - `useGameStatsByPlayer()` - Per-game stats with game data
   - `useTeamById()` if needed for cross-reference

4. **UI Components**:
   - `PlayerGameStatsDialog` → re-use in Stats tab
   - `TeamCard` → player-team display
   - `PlayerDialog` → optional for editing (admin only)
   - `DataTable` → any tabular data

5. **Existing Player Components**:
   - `PlayersTable.tsx` - existing table with click handlers needed
   - `PlayerGameStatsDialog.tsx` - per-game stats display
   - `PlayerDialog.tsx` - player edit/create dialog

## Implementation Steps

### Step 1: Create Design Documentation

Create `src/design/PLAYER_DETAILS_DESIGN.md` with:
- Wireframe of player detail page
- Header row (back button, player name, badges)
- Info cards (player profile, team card, sport summary)
- Tabs (Overview with player info, Stats with per-game stats, Games with schedule)
- Implementation notes following season detail pattern

### Step 2: Create Player Details Component

Create `src/components/PlayerDetails.tsx`:

```typescript
interface PlayerDetailsProps {
  playerId: Id<"players">;
  onEdit?: () => void; // admin callback
}
```

Key behaviors:
- Use `usePlayerById(playerId)` for main data
- Use `useGameStatsByPlayer(playerId)` for stats
- Follow loading/empty/error states from season detail pattern
- Show edit button for admins
- Render stats tab using embedded/adapted PlayerGameStatsDialog

### Step 3: Create Route

Create `src/routes/players/$id/index.tsx`:
- Uses `createFileRoute` with path `/players/$id/`
- Optimistic hydration: route loads immediately, component fetches data
- Admin/RBAC: edit button hidden for non-admins
- Back navigation link to `/playerspage`

### Step 4: Update PlayersTable

Modify `src/components/PlayersTable.tsx`:

**Stats View (existing):**
- Make player name clickable (currently uses PlayerGameStatsDialog)
- Update to use new route when clicked

**Contact Info View (add):**
- Make player names clickable
- Navigate to `/players/${player._id}`
- Pass current view context (tableView) if needed

### Step 5: Update TeamsTable

Modify `src/components/TeamsTable.tsx`:
- Make team names/captain links go to `/players/$id`
- Consider adding "View Players" button for quick access

### Step 6: Feature Flags/Edge Cases

**Data availability:**
- Player with no team: Show "No Team" status
- Player with no stats: Show "No game stats recorded"
- Any null data fallback: graceful degradation

**RBAC:**
- Spectators only see read-only information
- Players can see their own profile
- Admin can edit via optional Edit dialog

**Responsive:**
- Mobile: Stack cards vertically
- Tablet: 2-3 column grid for stats

## Data Flow

**Convex Backend (existing):**
- `api.players.getById` - player with joined team
- `api.gameStats.getByPlayer` - per-game stats with game data

**React Hooks (existing):**
- `usePlayerById(id)` - returns PlayerWithTeam or null/undefined
- `useGameStatsByPlayer(id)` - returns GameStatWithGame[] or undefined

**Component Dependencies:**
- PlayerDetails uses `usePlayerById` + `useGameStatsByPlayer`
- PlayerGameStatsDialog reused in Stats tab
- PlayerDialog for editing (admin only)

## User Flow Options

**Entry Points:**

1. **Players Page Table**:
   - Click player name in Contact Info view (existing)
   - Click player name in Individual Stats view (existing, may need update)

2. **Teams Page / Roster Views**:
   - Click team captain name
   - Click "View” button if added to TeamsTable
   - Team roster dialog (TeamRosterDialog) → could link to details

3. **Search/Filter Results**:
   - Click player name from search results

**Navigation Behavior:**
- Preserve any search/filter context from listing page
- Details page doesn't modify URL search params
- Edit buttons only visible to admins

## Technical Implementation

### State Management
- Use `useState` for dialog visibility (PlayerDialog)
- Loading states: true → data → null → error
- Admin state from `useAuth()`

### UI Pattern (from SEASON_DETAIL_DESIGN.md adapted)

1. **Header**:
   - Back button → `/playerspage`
   - Player name in `text-3xl font-bold truncate`
   - Badges: Status (active/inactive/injured), Sport/Type
   - Edit button (pencil) admin only

2. **Info Cards** (1-col mobile, 3-col desktop):
   - Player Info: Full name, jersey #, position, contact info, status
   - Team: Linked team name, captain status
   - Sport Summary: Stats overview (games, average, totals)

3. **Tabs**:
   - Overview (default): Player profile, team info
   - Game Stats: Per-game stats table (embedded PlayerGameStatsDialog)
   - Games: Schedule context if needed

### Code Structure

**src/components/PlayerDetails.tsx**
```tsx
export function PlayerDetails() {
  const { id } = useParams({ from: "/players/$id/" });
  const { isAdmin } = useAuth();
  const player = usePlayerById(id);
  const stats = useGameStatsByPlayer(id);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Loading/error/empty states
  // Header with back button, name, badges, edit
  // Info cards
  // Tabs component with Overview/Stats
  // Embedded stats display with PlayerGameStatsDialog
  // Edit dialog for admins
}
```

**src/routes/players/$id/index.tsx**
```tsx
export const Route = createFileRoute("/players/$id/")({
  component: PlayerDetails,
});
```

## Design Ref

**Primary Reference**: `src/design/SEASON_DETAIL_DESIGN.md`
- Header pattern: Back button, title, badges, edit
- Info cards: 3-card grid with icons
- Tabs: Overview/Schedule/Standings → adapted to Overview/Stats
- Skeleton loading placeholders
- Empty states handling
- Responsive grid layouts

## Edge Cases

**Data Edge Cases**:
- Player not found → 404-style message with back button
- Loading → Skeleton placeholders for all sections
- Player with no team → "No Team" display
- Player with no stats → "No game stats recorded"
- Long names → truncate/line-clamp

**Permission Edge Cases**:
- Non-admin visiting edit → button hidden
- Player visiting own profile → read-only
- Spectators → no edit permissions

**Technical Edge Cases**:
- Large number of game stats → scrollable table
- Different sports (softball/baseball) → sport identifier
- Missing sport type → show "Unknown"

## Scalability Considerations

**Future Enhancements**:
- Add sport filter for multi-sport players
- Quick actions (add to team, edit stats)
- Player comparison tool
- Seasonal stats views (by season)
- Advanced statistics (batting splits, etc.)

**Database Index**: gameStats.playerId currently needs index for performance

**Performance**: load stats separately from player data (already done via separate hooks)

## Testing Strategy

**Unit/Integration Tests**:
- PlayerDetails component tests with different data states
- usePlayerById hook integration
- useGameStatsByPlayer hook integration

**E2E Tests**:
- From players page: click player → verify details display
- From teams page: click player → verify details display
- Verify all tabs render correctly
- Verify RBAC (admin can edit, spectator cannot)
- Verify loading/error states

**Commands**:
```bash
npm run check          # Biome lint + format
npm run build          # TypeScript compilation
npm run test components/PlayerDetails.test.tsx  # Unit tests
npm run test:e2e PlayerDetailsPage  # E2E tests
```

## Acceptance Criteria

### Core Features
- [ ] Route `/players/$id/` renders player details page
- [ ] Navigation: accessible from players page via name click
- [ ] Header: back button, player name, status/sport badges
- [ ] Info cards: player profile, team info, stats summary
- [ ] Tabs: Overview (default), Stats, (optional) Games
- [ ] Stats tab: displays per-game stats (reuses PlayerGameStatsDialog)
- [ ] Edit dialog: accessible only to admins
- [ ] Loading states: skeleton placeholders for all sections
- [ ] Error states: not found message with back button
- [ ] RBAC: admin vs spectator visibility

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

## Related Files

### New Files
- `src/design/PLAYER_DETAILS_DESIGN.md` — detailed design doc
- `src/components/PlayerDetails.tsx` — main details component
- `src/routes/players/$id/index.tsx` — player details route

### Modified Files
- `src/components/PlayersTable.tsx` — add name click handlers for contact view
- `src/components/TeamsTable.tsx` — optional: add player links

### Reuse
- `PlayerGameStatsDialog` — embedded in stats tab
- `TeamCard` pattern — for team display
- `PlayerDialog` — for admin editing
- Components from `SEASON_DETAIL_DESIGN.md`

## Implementation Order

1. `src/design/PLAYER_DETAILS_DESIGN.md` — complete design doc first
2. `src/components/PlayerDetails.tsx` — core component with skeleton
3. `src/routes/players/$id/index.tsx` — route definition
4. `src/components/PlayersTable.tsx` — update name click handlers
5. `src/components/TeamsTable.tsx` — optional: add player links
6. Test iteration: run tests, fix bugs, refine UI
7. Final polish: run `npm run check && npm run build`

## Verification Commands

```bash
# Quick test of route structure
npm run test routes/players/$id/

# Component tests for PlayerDetails
npm run test src/components/PlayerDetails.test.tsx

# E2E navigation tests (Playwright)
npm run test:e2e player-details

# Build verification
npm run check && npm run build
```

## Design Reference

Full planning discussion in this document. UI follows patterns established by:
- `SEASON_DETAIL_DESIGN.md` for detailed page structure
- `PlayerGameStatsDialog` for per-game stats display
- `DataTable` for tabular data
- Existing PlayersTable as the primary entry point

## Notes

- Use test player ID from seed (e.g., `player_001` for Emma Wilson)
- Existing `PlayerGameStatsDialog` already handles stats display - reuse it
- Implement edit dialog first as optional (admin-only)
- Start with basic skeleton, then add features incrementally
- Ensure the route system supports nested parameters and back navigation
- Test both players page and teams page navigation paths