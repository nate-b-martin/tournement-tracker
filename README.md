# TanStack Tournament Tracker

A real-time tournament management system for American sports (starting with softball), built with React 19, TanStack Router, Convex (serverless backend), and Clerk (authentication).

## Project Status

| Area | Status | Notes |
|------|--------|-------|
| Homepage (`/`) | ✅ Built | Stat cards for teams, players, tournaments |
| Dashboard (`/dashboard`) | ✅ Built | Protected route with stat cards + PlayersTable |
| Players (`/playerspage`) | ✅ Built | Full page with Contact Info & Stats views |
| Teams (`/teamspage`) | ✅ Built | Full page with sortable/filterable table |
| Tournaments (`/tournamentspage`) | 🟡 Stub | Renders placeholder text only |
| MCP Server (`/mcp`) | ✅ Built | Model Context Protocol endpoint |
| Convex Queries | ✅ Built | teams, players, playerStats, userProfiles |
| Convex Mutations (Domain) | 🔴 Missing | No create/update/delete for teams, players, tournaments |
| CRUD Forms/Dialogs | 🔴 Missing | Edit/Delete buttons are `console.log()` no-ops |
| E2E Tests | ✅ Built | Playwright auth + navigation tests |
| Unit Tests | 🟡 Partial | DataTable, PaginationControls, usePagination |
| Dark Mode Toggle | 🔴 Missing | `next-themes` installed, no toggle UI |
| Bracket Generation | 🔴 Missing | Tournament plan defined, not implemented |
| Seed Data | ✅ Built | Softball-specific 4 teams, 32 players, 2 games |

## Getting Started

### Prerequisites
- Node.js 18+ (or Bun)
- Convex account
- Clerk account

### Installation & Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables** in `.env.local`:
```
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_JWT_ISSUER_DOMAIN=https://your-domain.clerk.accounts.com
```

(Run `npx convex init` and `npx clerk init` to generate these automatically)

3. **Start development with both servers running concurrently:**
```bash
# Terminal 1: Start Convex backend
npx convex dev

# Terminal 2: Start dev server (port 3000)
npm run dev
```

**Note:** The Convex dev server must be running alongside `npm run dev` for the application to work.

### Seed Data

Populate the database with test data for development:

```bash
npx convex seed
```

This creates a sample tournament ("Summer Softball Classic 2026") with 2 fields, 4 teams, 32 players, and 2 games with game stats.

To clear all data:
```bash
# Run the clearAllData mutation via the Convex dashboard
npx convex dashboard
```

## Building For Production

```bash
npm run build
```

## Testing

### Unit Tests (Vitest + React Testing Library)

```bash
npm run test              # Run all tests
npm run test <file>       # Run single test file
npm run test:watch        # Run tests in watch mode
```

Tests are in `tests/unit/` and cover:
- DataTable rendering, sorting, filtering, pagination
- PaginationControls navigation and page size
- usePagination hook math

### E2E Tests (Playwright)

```bash
npx playwright test            # Run all E2E tests (headless)
npx playwright test --ui       # Run E2E with UI debug mode
npx playwright test --debug    # Run with Playwright inspector
```

E2E tests are in `tests/e2e/` and cover:
- Authentication flow (unauthenticated redirect, sign-in, access denied)
- Navigation behavior (menu open/close, sign-in visibility)
- Protected route access control

Requires running the dev server. Tests use Clerk test credentials via `auth.ts` fixture and `global-setup.ts` storage state persistence.

## Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting. Always run before committing:

```bash
npm run check     # Format + lint check
npm run format    # Format code
npm run lint      # Lint check only
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling with [shadcn/ui](https://ui.shadcn.com/) components.

### Adding shadcn Components

```bash
npx shadcn@latest add <component-name>
```

Run `npm run format` after adding components.

Common components: Button, Card, Table, Badge, Dialog, DropdownMenu, Input, Form

## MCP Server

The project includes an MCP (Model Context Protocol) server endpoint at `/mcp`, enabling external AI tools and agents to interact with the application programmatically (currently implements a todo/planning tool). This is experimental infrastructure for AI-assisted development.

## Project Architecture

### Key Technologies
- **Frontend**: React 19, TanStack Router (file-based routing), TanStack Query
- **Backend**: Convex (serverless database + backend)
- **Auth**: Clerk (authentication) + Convex (role storage)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Tables**: Custom DataTable component with search, filter chips, sort, pagination
- **Icons**: Lucide React
- **Toasts**: Sonner
- **Testing**: Vitest + React Testing Library (unit), Playwright (E2E)
- **Formatting**: Biome (tab indentation, double quotes)
- **Build**: Vite v7 + TypeScript strict mode
- **Hosting**: Netlify (`netlify.toml`)

### Database & Authentication

**Convex** stores the database schema and backend functions in `convex/`:
- `schema.ts` — 7 data models (tournaments, teams, players, games, fields, gameStats, userProfiles)
- `teams.ts`, `players.ts`, `playerStats.ts`, `tournaments.ts` — Query functions
- `userProfiles.ts` — User roles and profile mutations
- `seed.ts` — Development seed data
- `auth.config.ts` — Clerk JWT configuration

**Clerk** handles user authentication. On first sign-in:
- User is automatically promoted to `admin` role
- Subsequent users default to `spectator` role
- Roles: `admin` (full access), `organizer` (tournament management), `player` (team/player data), `spectator` (read-only)

### Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `src/routes/index.tsx` | Homepage with stat cards |
| `/dashboard` | `src/routes/dashboard/index.tsx` | Protected admin dashboard |
| `/playerspage` | `src/routes/playerspage/index.tsx` | Players table with Contact Info & Stats views |
| `/teamspage` | `src/routes/teamspage/index.tsx` | Teams table with filtering |
| `/tournamentspage` | `src/routes/tournamentspage/index.tsx` | Stub — not yet implemented |
| `/mcp` | `src/routes/mcp.ts` | MCP server endpoint |

### File Structure

```
src/
  routes/           - TanStack Router file-based routing
  components/       - React components (ui/, DataTable/, feature/)
  hooks/            - Custom hooks (useAuth, useTeams, usePlayers, etc.)
  design/           - Design docs for routes
  integrations/     - Convex & Clerk provider setup
  mocks/            - Mock data for development/testing
  utils/            - Utility functions (cn, etc.)

convex/
  schema.ts         - Database schema (7 tables)
  teams.ts          - Teams queries + (future) mutations
  players.ts        - Players queries (list, getById, search) + joins
  playerStats.ts    - Aggregated player stats queries
  tournaments.ts    - Tournaments query (count only)
  userProfiles.ts   - User profile queries + mutations
  seed.ts           - Development seed data
  auth.config.ts    - Clerk JWT configuration

tests/
  unit/             - Vitest + React Testing Library tests
  e2e/              - Playwright E2E tests with page objects

feature-tickets/    - Development tickets organized by feature
```

### Known Gaps & Next Up

1. **No mutation CRUD** — Create/update/delete mutations for teams, players, tournaments, games, fields, and gameStats are not implemented. Edit/Delete buttons are `console.log()` stubs.
2. **Tournaments page is a stub** — `/tournamentspage` needs a full implementation including tournament listing, creation wizard, and bracket visualization.
3. **Missing detail views** — No individual team/player/tournament detail pages or routes.
4. **No indexes on 5 of 7 tables** — `teams`, `players`, `games`, `fields`, `gameStats` perform full table scans. Add `.index()` definitions for queried fields.
5. **No dark mode toggle** — `next-themes` is installed but no theme switcher UI exists.
6. **Tournaments missing from nav** — The sidebar has no link to `/tournamentspage`.
7. **Empty state needs improvement** — The DataTable shows headers + pagination even when empty; ticket `05-optimize-empty-state.md` covers this.

## Open Feature Tickets

Open tickets in `feature-tickets/`:
- `04-combine-pagination-logic.md` — Consolidate pagination into a hook (usePagination already exists)
- `05-optimize-empty-state.md` — Improve empty state positioning in DataTable

Backlog in `feature-tickets/backlog/`:
- `01-memoize-derived-values.md`
- `02-stabilize-callbacks.md`
- `03-auth-toast-notifications.md`

## Development Guidelines

For detailed code style, patterns, authentication/authorization, database best practices, and development workflow, see [AGENTS.md](AGENTS.md).

**Key principles:**
- Check `src/design/` for design docs before implementing routes
- Use `npm run check` before committing (format + lint)
- Always validate auth server-side in Convex mutations
- Run `npx convex dev` concurrently with `npm run dev`

## Resources

- **[AGENTS.md](AGENTS.md)** — Comprehensive development guidelines
- **[TOURNAMENT_PLAN.md](TOURNAMENT_PLAN.md)** — Project roadmap and feature planning
- **[feature-tickets/](feature-tickets/)** — Development tickets organized by feature
- **[src/design/](src/design/)** — Route design specifications
- **Convex Docs** — https://docs.convex.dev
- **TanStack Router** — https://tanstack.com/router
- **Clerk Docs** — https://clerk.com/docs
- **shadcn/ui** — https://ui.shadcn.com
