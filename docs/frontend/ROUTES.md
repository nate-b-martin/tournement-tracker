# Routes

## Route Table

| Path | File | Component | Auth Required | Admin Only | Data Dependencies |
|------|------|-----------|---------------|------------|-------------------|
| `/` | `src/routes/index.tsx` | `App` | No | No | `teams.count`, `players.count`, `tournaments.count` |
| `/dashboard` | `src/routes/dashboard/index.tsx` | `DashboardPageComponent` | Yes | No (`requireAdmin=false`) | `teams.count`, `players.count`, `tournaments.count`, `useAuth()` |
| `/playerspage` | `src/routes/playerspage/index.tsx` | `PlayersPageComponent` | No | No | `useAuth()` (for admin flag) |
| `/teamspage` | `src/routes/teamspage/index.tsx` | `TeamsPageComponent` | No | No | `useAuth()` |
| `/tournamentspage` | `src/routes/tournamentspage/index.tsx` | `TournamentsPage` | No | No | `useAuth()`, mutations for CRUD |
| `/tournaments/$id` | `src/routes/tournaments/$id/index.tsx` | `TournamentDetailPage` | No | No | `tournaments.getById`, `teams.list`, `games.getByTournament`, `fields.listByTournament` |
| `/seasonspage` | `src/routes/seasonspage/index.tsx` | `SeasonsPage` | No | No | `useAuth()`, `seasons.list` |
| `/seasons/$id` | `src/routes/seasons/$id/index.tsx` | `SeasonDetailPage` | No | No | `seasons.getById`, `seasonTeams.listBySeason`, `seasonGames.listBySeason`, `tournaments.getBySeasonId` |
| `/gamespage` | `src/routes/gamespage/index.tsx` | `GamesPageComponent` | No | No | `useAuth()` |
| `/mcp` | `src/routes/mcp.ts` | MCP server handler | No | No | (server-side endpoint) |

## Root Layout

**File**: [`src/routes/__root.tsx`](../src/routes/__root.tsx)

Wraps all pages with:
- `ConvexClerkProvider` — Clerk + Convex auth bridge
- `AuthErrorBoundary` — Graceful auth error handling
- `Header` — Sidebar navigation + auth widget
- `TanStackRouterDevtoolsPanel` — Dev tools (development only)
- `Toaster` — Toast notifications (Sonner)

## Navigation Sidebar

**File**: [`src/components/Header.tsx`](../src/components/Header.tsx)

Slide-out sidebar with links:
- Home (`/`)
- Dashboard (`/dashboard`)
- Players (`/playerspage`)
- Teams (`/teamspage`)
- Seasons (`/seasonspage`)
- Tournaments (`/tournamentspage`)
- Games (`/gamespage`)

Includes `AuthWidget` at the bottom for sign-in/sign-out.

## Route Protection

**File**: [`src/components/ProtectedRoute.tsx`](../src/components/ProtectedRoute.tsx)

```tsx
<ProtectedRoute requireAdmin={true}>
  <AdminOnlyContent />
</ProtectedRoute>
```

- Checks `isLoading`, `isSignedIn`, `isAdmin` from `useAuth()`
- Shows spinner while loading
- Shows `AccessDeniedMessage` when not signed in or not admin
- Accepts optional `fallback` prop for custom messages

## Data Fetching Pattern

Each route page uses custom hooks from `src/hooks/` to fetch data:

```tsx
// Example: /teamspage
function TeamsPageComponent() {
  const { isAdmin } = useAuth();
  return (
    <TeamsTable
      isAdmin={isAdmin}
      initialOptions={{
        sorting: { field: "name", direction: "asc" },
      }}
    />
  );
}
```

See [DATA_FETCHING.md](DATA_FETCHING.md) for the full hook pattern.
