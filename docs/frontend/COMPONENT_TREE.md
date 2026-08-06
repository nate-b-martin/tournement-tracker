# Component Tree

## Component Hierarchy

```
RootDocument (__root.tsx)
├── ConvexClerkProvider
│   └── AuthErrorBoundary (class-based error boundary)
│       └── Header (sidebar navigation + auth widget)
│       └── TooltipProvider
│       │   └── Route Content (varies by route)
│       └── Toaster (Sonner toast notifications)
│       └── TanStackDevtools
│           └── TanStackRouterDevtoolsPanel
```

## Route-Level Components

### Homepage (`/` — `src/routes/index.tsx`)
```
App
├── Card (Team Count) ── useQuery(api.teams.count)
├── Card (Player Count) ── useQuery(api.players.count)
└── Card (Tournament Count) ── useQuery(api.tournaments.count)
```

### Dashboard (`/dashboard` — `src/routes/dashboard/index.tsx`)
```
DashboardPageComponent
└── ProtectedRoute (requireAdmin=false)
    ├── Spectator Banner (shown when !isAdmin)
    ├── Stat Cards (Team/Player/Tournament counts)
    ├── PlayersTable
    │   ├── View Toggle (Contact / Stats)
    │   ├── DataTable (with search, filters, sort, pagination)
    │   │   └── PaginationControls
    │   ├── PlayerDialog (create/edit)
    │   ├── PlayerGameStatsDialog
    │   └── ConfirmDelete
    └── TournamentTable
        └── DataTable
```

### Players Page (`/playerspage` — `src/routes/playerspage/index.tsx`)
```
PlayersPageComponent
├── Heading "Players"
└── PlayersTable (same as dashboard but standalone)
```

### Teams Page (`/teamspage` — `src/routes/teamspage/index.tsx`)
```
TeamsPageComponent
├── Heading "Teams"
└── TeamsTable
    ├── DataTable (with status filter chips, sort)
    └── TeamDialog (create/edit)
    └── ConfirmDelete
```

### Tournaments Page (`/tournamentspage` — `src/routes/tournamentspage/index.tsx`)
```
TournamentsPage
├── Heading + "New Tournament" button (admin only)
├── Spectator Banner (for signed-in spectators)
├── TournamentTable
│   └── DataTable (with edit/delete actions)
├── TournamentDialog (create/edit with full form)
└── ConfirmDelete
```

### Tournament Detail (`/tournaments/$id` — `src/routes/tournaments/$id/index.tsx`)
```
TournamentDetailPage
├── Header (name, sport badge, status badge, team count)
├── Detail Cards (Details, Game Settings, Registration)
├── Tabs
│   ├── Teams Tab
│   │   ├── "Add Team" button (admin)
│   │   ├── TeamCard[] (grid)
│   │   └── TeamDialog
│   │   └── ConfirmDelete
│   ├── Games Tab
│   │   └── GamesTable
│   │       └── DataTable
│   │       └── GameStatsSheet (per-game stats dialog)
│   │       └── GameDialog (create/edit)
│   │       └── ConfirmDelete
│   ├── Bracket Tab
│   │   └── BracketView
│   │       ├── SingleElimination
│   │       ├── DoubleElimination
│   │       └── RoundRobin
│   ├── Standings Tab
│   │   └── StandingsView (computed from games)
│   └── Fields Tab
│       └── FieldsList
│           ├── FieldCard[]
│           └── FieldDialog (create/edit)
│           └── ConfirmDelete
```

### Seasons Page (`/seasonspage` — `src/routes/seasonspage/index.tsx`)
```
SeasonsPage
├── Heading "Seasons" + "New Season" button (admin)
└── DataTable (with search, status/sport filters, pagination)
│   ├── SeasonDialog (create/edit)
│   └── ConfirmDelete
```

### Season Detail (`/seasons/$id` — `src/routes/seasons/$id/index.tsx`)
```
SeasonDetailPage
├── Header (name, status badge, sport badge, edit button)
├── Detail Cards (Details, Teams, Tournament)
├── Tabs
│   ├── Overview Tab
│   │   └── TeamCard[] (team name + city + status)
│   ├── Schedule Tab
│   │   └── SeasonScheduleView
│   │       ├── DataTable (Date, Home Team, Away Team, Score, Location, Status)
│   │       ├── SeasonGameDialog (create/edit)
│   │       └── ConfirmDelete
│   └── Standings Tab
│       └── SeasonStandingsView (computed W/L/T from completed seasonGames)
│           └── Table (#, Team, GP, W, L, T, Win %, PF, PA, +/-)
```

### Games Page (`/gamespage` — `src/routes/gamespage/index.tsx`)
```
GamesPageComponent
├── Heading "Games"
└── GamesTable
    ├── DataTable (with status filter chips, round sort)
    └── GameStatsSheet
    └── GameDialog
    └── ConfirmDelete
```

## Shared Component Categories

### DataTable (`src/components/DataTable/`)
```
DataTable<T> (generic, typed)
├── Toolbar
│   ├── Search Input
│   ├── Filter Chips (clickable status toggles)
│   └── Action Buttons
├── Table
│   ├── Header Row (clickable sort headers)
│   └── Body Rows
│       └── ActionsCell (edit/delete buttons, admin-gated)
└── PaginationControls
    ├── Page size selector
    ├── Previous / Next buttons
    └── "Page X of Y" display
```

### Dialogs (CRUD patterns)

Each entity has a create/edit dialog following the same pattern:

| Dialog | File | Fields |
|--------|------|--------|
| `TournamentDialog` | `src/components/TournamentDialog.tsx` | name, sport, location, dates, teams limits, bracket type, fields, duration, seeding |
| `TeamDialog` | `src/components/TeamDialog.tsx` | name, tournament, coach info, description, city, home field, org, age group |
| `PlayerDialog` | `src/components/PlayerDialog.tsx` | firstName, lastName, team, jersey, email, phone, birthDate, status |
| `GameDialog` | `src/components/GameDialog.tsx` | tournament, round, gameNumber, teams, field, scheduled time |
| `FieldDialog` | `src/components/FieldDialog.tsx` | name, location, status |
| `GameStatsSheet` | `src/components/GameStatsSheet.tsx` | Per-player stat inputs (gamesPlayed, atBats, hits, etc.) |
| `PlayerGameStatsDialog` | `src/components/PlayerGameStatsDialog.tsx` | Historical stats for a player across games |
| `SetupWizard` | `src/components/SetupWizard/SetupWizard.tsx` | Multi-step season setup (5 steps: teams, rosters, season, tournament, review) |
| `SeasonGameDialog` | `src/components/SeasonGameDialog.tsx` | Create/edit season game with home/away teams, date, score, status |
| `ConfirmDelete` | `src/components/ConfirmDelete.tsx` | Generic delete confirmation with item name |

### Bracket Components (`src/components/Bracket/`)

| Component | File | Description |
|-----------|------|-------------|
| `BracketView` | `BracketView.tsx` | Dispatcher — selects renderer by bracketType |
| `SingleElimination` | `SingleElimination.tsx` | Single-elimination bracket tree |
| `DoubleElimination` | `DoubleElimination.tsx` | Double-elimination bracket (winners + losers) |
| `RoundRobin` | `RoundRobin.tsx` | Round-robin standings table |

### UI Components (shadcn — `src/components/ui/`)

```
ui/
├── alert-dialog.tsx    — Delete confirmation dialogs
├── alert.tsx           — Info/error banners (AccessDeniedMessage, spectator notices)
├── badge.tsx           — Status and entity badges
├── button.tsx          — Primary/secondary/outline buttons
├── card.tsx            — Stat cards, detail cards, team cards
├── dialog.tsx          — CRUD form modals
├── form.tsx            — Form wrapper (react-hook-form)
├── input.tsx           — Text/number inputs
├── label.tsx           — Form labels
├── select.tsx          — Dropdown selects (status, team, tournament)
├── separator.tsx       — Visual dividers
├── sonner.tsx          — Toast notification setup
├── table.tsx           — Data table primitives (Table, Th, Td, Tr)
├── tabs.tsx            — Tournament detail tabs
├── textarea.tsx        — Multi-line text input
├── tooltip.tsx         — Hover tooltips
```

## Component Responsibility Summary

| Component | Responsibility | Depends On |
|-----------|---------------|------------|
| `Header` | Sidebar nav, sign-in/sign-out | `useAuth`, `AuthWidget` |
| `ProtectedRoute` | Auth gate for routes | `useAuth` |
| `DataTable` | Generic sortable/filterable/paginated table | `usePagination`, shadcn Table |
| `PaginationControls` | Page nav UI (prev/next, page size, summary) | none |
| `ActionsCell` | Edit/Delete buttons in table rows | admin prop |
| `PlayersTable` | Players data with Contact/Stats view toggle | `usePlayers`, `usePlayerStats`, `DataTable` |
| `TeamsTable` | Teams data | `useTeams`, `DataTable` |
| `GamesTable` | Games data | `useGames`, `DataTable` |
| `TournamentTable` | Tournament data | `useTournaments`, `DataTable` |
| `SeasonScheduleView` | Season games table with search, status filter, CRUD | `useSeasonGames`, `DataTable` |
| `SeasonStandingsView` | Season standings computed from seasonGames | season games + team data |
| `StandingsView` | Tournament standings computed from games | game + team data |
| `BracketView` | Bracket visualization dispatcher | games + bracketType |
| `TeamCard` | Individual team display card | team data |
| `FieldsList` | Field cards list | `useFields` |
| `AuthWidget` | Sign-in button / user avatar | Clerk `useUser`, `useAuth` |
| `AuthErrorBoundary` | Catches auth init errors | class-based error boundary |
| `FeatureSection` | (Unused — homepage placeholder) | none |
| `ConfirmDelete` | Reusable delete confirmation dialog | alert-dialog |
| `SetupWizard` | Multi-step setup dialog (5 steps) | `useReducer`, `useMutation` (teams, players, seasons, tournament, seasonTeams) |
| `SetupWizardProvider` | Reducer-based state management for wizard | `SetupWizardContext`, `WizardStep` |
| `WizardStepper` | Horizontal 5-step progress indicator | `WizardStep` |
| `StepSelectTeams` | Search, multi-select existing teams, create new teams inline | `useQuery(api.teams.list)` |
| `StepManageRosters` | Add/remove players per team with team switcher | wizard state |
| `StepCreateSeason` | Season name, sport, date range, description | wizard state |
| `StepConfigureTournament` | Tournament settings (name, bracket, fields, duration) | wizard state (auto-fills from season) |
| `StepReview` | Summary cards for all entities, "Create All" button | wizard state |

## Data Flow

All data flows through the same pattern:

```
Convex DB → Convex Query (convex/*.ts)
  → Generated API (convex/_generated/api)
    → Custom Hook (src/hooks/use*.ts)
      → React Component (src/components/*.tsx)
```

See [DATA_FETCHING.md](DATA_FETCHING.md) for the detailed pattern.
