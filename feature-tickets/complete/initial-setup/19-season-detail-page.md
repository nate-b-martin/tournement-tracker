# Feature 19: Season Detail Page — Basic Route at `/seasons/$id`

## Overview
Create a basic season detail page that serves as the post-wizard landing page. Shows season information, linked teams, and provides navigation to the tournament detail page. This is the user's destination after completing the Setup Wizard.

## Prerequisites
- [ ] Ticket 15 — Season Convex functions must be deployed
- [ ] Ticket 16 — useSeasons and useSeasonTeams hooks must be available

## Implementation Steps

### Step 1: Create Route File `src/routes/seasons/$id/index.tsx`

```typescript
import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Trophy, Users, Calendar, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useSeasonById } from "@/hooks/useSeasons";
import { useSeasonTeams } from "@/hooks/useSeasonTeams";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/seasons/$id/")({
  component: SeasonDetailPage,
});
```

### Step 2: Page Layout

**Header section:**
- Back button to `/seasonspage`
- Season name as page title
- Status badge (Planning / Active / Complete)
- Sport badge
- Admin edit button (pencil icon, opens season edit dialog — future)

**Info Cards (responsive grid):**
- **Details card**: name, sport, date range, description
- **Teams card**: team count with icon
- **Tournament card**: link to tournament (if tournament exists), otherwise "No tournament configured" message

**Teams List:**
- List of teams in the season with basic info
- Each team shows: name, player count, status
- Click navigates to team detail page (future) or highlights

**Tabs** (for future enhancement):
- Overview (default, shows teams + info)
- Schedule (future: regular season games)
- Standings (future: computed W/L from seasonGames)

### Step 3: Create Season Edit Dialog (Basic)

Create `src/components/SeasonDialog.tsx` following the `TournamentDialog` pattern:
- Edit mode for season name, sport, dates, description, status
- Create mode is handled by the Setup Wizard, but standalone edit is useful

### Step 4: Wire Navigation

Ensure the season detail page is accessible from:
- Post-wizard redirect (Ticket 17)
- Seasons listing page (`/seasonspage` — Ticket 18 placeholder)
- "View Season" link on tournament detail page (future enhancement)

## Acceptance Criteria
- [ ] `/seasons/$id` route renders with season data from `useSeasonById`
- [ ] Page shows: season name, status badge, sport badge, date range, description
- [ ] Teams in the season are listed with names
- [ ] Tournament link shown if tournament exists (navigates to `/tournaments/$id`)
- [ ] "No tournament configured" shown if no linked tournament
- [ ] Loading state during data fetch (skeleton)
- [ ] Error state if season not found (404-style message)
- [ ] Back button navigates to `/seasonspage`
- [ ] Admin sees edit button (opens SeasonDialog)
- [ ] SeasonDialog can edit season fields and status
- [ ] Responsive layout (works on mobile)

## Edge Cases
- Season with no teams (empty state: "No teams added yet")
- Season with no linked tournament (show link to create tournament or message)
- Deleted season (show 404 / "Season not found")
- Very long season name or descriptions (truncation)
- Season with many teams (20+) — scrollable list
- Admin vs spectator view (spectator sees read-only, no edit button)

## Testing Considerations
- Test route navigates correctly from wizard redirect
- Test all season status badges render with correct colors
- Test teams list renders correctly
- Test tournament link works when tournament exists
- Test empty states for no teams / no tournament
- Test SeasonDialog edit flow
- Test responsive behavior at mobile widths

## Related Files
- `src/routes/seasons/$id/index.tsx` — NEW (main route component)
- `src/components/SeasonDialog.tsx` — NEW (edit dialog, follows TournamentDialog pattern)
- `src/hooks/useSeasons.ts` — DEPENDS ON (for useSeasonById)
- `src/hooks/useSeasonTeams.ts` — DEPENDS ON (for listing teams)

## Dependency
- Blocked by Ticket 15 (Convex functions)
- Blocked by Ticket 16 (Season hooks)

## UI Patterns
- Follow the existing tournament detail page (`src/routes/tournaments/$id/index.tsx`) for layout patterns
- Same header style: back button, title, badges
- Same card layout: responsive grid of info cards
- Same status badge styling from `src/components/TournamentTable.tsx`
- Use `Skeleton` component for loading states (already in `src/components/ui/skeleton.tsx`)

## Status Badge Colors
```typescript
const SEASON_STATUS_STYLES: Record<string, string> = {
  planning: "border border-amber-500/30 bg-amber-500/15 text-amber-300",
  active: "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  complete: "border border-purple-500/30 bg-purple-500/15 text-purple-300",
};
```

## Notes
- The season detail page is intentionally minimal at first — it's the landing page after wizard completion
- Future enhancements: regular season schedule/standings tabs, game entry, stats
- The SeasonDialog should be a simpler version of TournamentDialog scoped to season fields only
- `useSeasonById` from Ticket 16 accepts an `Id<"seasons">` string and returns `Doc<"seasons"> | undefined`
- `useSeasonTeams` from Ticket 16 returns teams with their full `Doc<"teams">` data
