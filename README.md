# TanStack Tournament Tracker

A real-time tournament management system for American sports (starting with softball), built with React 19, TanStack Router, Convex (serverless backend), and Convex Auth.

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

### Installation & Setup

1. **Install dependencies:**
```bash
bun install
```

2. **Set up environment variables** in `.env.local`:
```
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_CONVEX_SITE_URL=http://localhost:3000

# Seeded admin credentials (set by ticket 07; used by E2E auth flow)
SITE_ADMIN_EMAIL=nate.martinb@gmail
SITE_ADMIN_PASSWORD=!TimCPw 2486$
```

(Run `bunx convex init` and `` to generate these automatically)

3. **Start development with both servers running concurrently:**
```bash
# Terminal 1: Start Convex backend
bunx convex dev

# Terminal 2: Start dev server (port 3000)
bun run dev
```

**Note:** The Convex dev server must be running alongside `bun run dev` for the application to work.

## Self-Hosted Docker Deployment

The containerized stack uses no `convex.cloud` and no Clerk: Convex runs as a
self-hosted container with **SQLite** persisted in a named volume, and the
frontend is a local production image. The complete walkthrough lives in the
[Docker guide](docs/DOCKER_GUIDE.md); `.env.example` documents every variable
used by both the Docker and local-dev workflows.

### Bootstrap

Bring the whole containerized stack up and wire the Convex CLI to it in a single command:

```bash
./scripts/docker-up.sh
```

The script starts `convex-backend`, `convex-dashboard`, and `frontend` (`docker compose up -d`),
waits for the backend to report healthy, writes `CONVEX_SELF_HOSTED_URL` /
`CONVEX_SELF_HOSTED_ADMIN_KEY` into `.env.local`, pushes the Convex functions, and runs the seed
mutation. It is idempotent — safe to re-run against an already-running stack, and it only ever
rewrites its own two lines in `.env.local`. The manual equivalents are documented below and in the
[Docker guide](docs/DOCKER_GUIDE.md#quick-start).

### One backend at a time

The Docker stack and `bunx convex dev` **both bind port `3210`** and keep separate data stores and
separate Convex env vars. Run one or the other — never both simultaneously:

```bash
docker compose down   # before switching to `bunx convex dev`
# Ctrl-C the dev backend before running `docker compose up`
```

### Backups

The database is the `data` volume mounted at `/convex/data` (SQLite). Stop the
backend first so you do not archive a database mid-write. The volume is named
`<compose-project>_data`; for this repository that is `tournement-tracker_data`
(the compose project takes the directory name). Check with:

```bash
docker volume ls --filter name=_data
```

Back the volume up into a dated tarball in the current directory:

```bash
docker compose down
docker run --rm \
  -v tournement-tracker_data:/data \
  -v "$PWD":/backup \
  alpine tar czf "/backup/convex-backup-$(date +%F).tar.gz" -C /data .
docker compose up -d
```

### Restore

With the stack stopped, replace the volume contents from a backup:

```bash
docker compose down
docker run --rm \
  -v tournement-tracker_data:/data \
  -v "$PWD":/backup \
  alpine sh -c 'find /data -mindepth 1 -delete && tar xzf /backup/convex-backup-YYYY-MM-DD.tar.gz -C /data'
docker compose up -d
```

Keep backups somewhere outside the Docker volume itself; `docker compose down -v` deletes the
volume and every backup stored inside it.

### Upgrades

The compose file currently uses `ghcr.io/get-convex/convex-backend:latest` as a
placeholder. **Pin a concrete tag** before treating a deployment as production:

```yaml
services:
  convex-backend:
    image: ghcr.io/get-convex/convex-backend:v1.xx.x # pin, don't float on latest
  convex-dashboard:
    image: ghcr.io/get-convex/convex-dashboard:v1.xx.x
```

Then, before bumping either tag:

1. Read the self-hosted upgrade notes for the target release — some versions
   require a backend migration: <https://github.com/get-convex/convex-backend/blob/main/self-hosted/README.md>.
2. Back up the `data` volume (above).
3. `docker compose pull && docker compose up -d`.
4. Re-run `./scripts/docker-up.sh` if the CLI wiring or function push needs refreshing.

Changing `INSTANCE_SECRET` is **not** an upgrade step — it invalidates every
previously issued admin key.

### Limitations

- **Single node only.** The self-hosted backend is not horizontally scalable and
  has no built-in HA/failover. Run exactly one `convex-backend` container.
- **FSL license.** Convex is fair-source: each release converts to Apache-2.0
  after roughly two years. Review the license if you redistribute the stack.
- **No support plan.** Self-hosted Convex has no official vendor support
  contract; treat upgrades as manual maintenance.
- **No cloud dependencies.** The Docker deployment does not use `convex.cloud`.
  (Local `bunx convex dev` still uses the current auth setup until
  the Convex Auth migration in Phase 2 lands.)
- **Dashboard exposure.** `convex-dashboard` publishes on `127.0.0.1:6791` only;
  keep it off public interfaces and log in with an admin key.

### Security headers

`netlify.toml` sets the CSP for the Netlify deployment. Its `connect-src` allows
the self-hosted Convex origins (`http://localhost:3210`, `ws://localhost:3210`,
`http://127.0.0.1:3210`, `ws://127.0.0.1:3210`, plus the `:3211` site origins)
and no longer lists `convex.cloud` domains. The Docker frontend serves
via `srvx`, which does not set security headers itself — put it behind a
reverse proxy that injects the same policy if you need strict CSP there.

### Self-Hosted Backend (Docker)

Instead of `bunx convex dev`, the Convex backend can run in Docker with its default **SQLite** storage persisted in a volume. See the [Docker guide](docs/DOCKER_GUIDE.md#convex-backend) for complete details.

```bash
cp docker-compose.env.example .env
# Edit .env and replace INSTANCE_SECRET with a stable random value.
docker compose up -d convex-backend
docker compose up -d convex-dashboard # optional dashboard at http://127.0.0.1:6791
```

- SQLite data persists in the `data` volume (`/convex/data`); no Postgres service is used.
- Log in to the dashboard with an admin key:
  `docker compose exec convex-backend ./generate_admin_key.sh`
- Each run of `generate_admin_key.sh` issues a **new** key, so keep the one you use.
  Previously issued keys keep working across restarts as long as `INSTANCE_NAME` and
  `INSTANCE_SECRET` stay unchanged; changing `INSTANCE_SECRET` invalidates all of them.

> **One backend at a time.** The containerized backend and `bunx convex dev` both bind port `3210` and hold separate data stores. Run one or the other — never both.

### Self-Hosted Frontend (Docker)

The TanStack Start app also ships as a production image that serves server-rendered HTML on port `3000`. See the [Docker guide](docs/DOCKER_GUIDE.md#frontend) for complete details:

```bash
docker compose up -d --build          # backend + frontend
docker compose up -d convex-dashboard # optional
```

Then open <http://localhost:3000>.

- The `frontend` service waits for `convex-backend` to become healthy before starting.
- **Vite `VITE_*` variables are inlined at build time** — the Convex URL must be one the
  *browser* can reach — `http://localhost:3210`, never the compose service name
  `convex-backend:3210`. Change it via `VITE_CONVEX_URL` in `.env`, then rebuild
  (`docker compose build frontend`); a simple restart is NOT enough.
- **SSR `CONVEX_SSR_URL` is read at runtime from `process.env`** — since SSR runs inside the
  container where `localhost` is the container itself, the default `http://convex-backend:3210`
  is correct inside the container. A restart (without rebuild) is enough to change it.
- `bun run start` runs the same server locally without Docker.

### Seed Data

Populate the database with test data for development:

```bash
bunx convex seed
```

This creates a sample tournament ("Summer Softball Classic 2026") with 2 fields, 4 teams, 32 players, and 2 games with game stats.

To clear all data:
```bash
# Run the clearAllData mutation via the Convex dashboard
bunx convex dashboard
```

## Building For Production

```bash
bun run build
```

## Testing

### Unit Tests (Vitest + React Testing Library)

```bash
bun run test              # Run all tests
bun run test <file>       # Run single test file
bun run test:watch        # Run tests in watch mode
```

Tests are in `tests/unit/` and cover:
- DataTable rendering, sorting, filtering, pagination
- PaginationControls navigation and page size
- usePagination hook math

### E2E Tests (Playwright)

```bash
bunx playwright test            # Run all E2E tests (headless)
bunx playwright test --ui       # Run E2E with UI debug mode
bunx playwright test --debug    # Run with Playwright inspector
```

E2E tests are in `tests/e2e/` and cover:
- Authentication flow (unauthenticated redirect, sign-in, access denied)
- Navigation behavior (menu open/close, sign-in visibility)
- Protected route access control

Requires running the dev server. Tests use seeded admin credentials via `.env.local` and `global-setup.ts` storage state persistence.

## Linting & Formatting

This project uses [Vite+](https://viteplus.dev) for its toolchain: [Oxlint](https://oxc.rs) for linting and [Oxfmt](https://oxc.rs) for formatting, both configured in the `fmt` and `lint` blocks of `vite.config.ts`. Always run before committing:

```bash
bun run check     # Format + lint check
bun run format    # Format code
bun run lint      # Lint check only
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling with [shadcn/ui](https://ui.shadcn.com/) components.

### Adding shadcn Components

```bash
bunx shadcn@latest add <component-name>
```

Run `bun run format` after adding components.

Common components: Button, Card, Table, Badge, Dialog, DropdownMenu, Input, Form

## MCP Server

The project includes an MCP (Model Context Protocol) server endpoint at `/mcp`, enabling external AI tools and agents to interact with the application programmatically (currently implements a todo/planning tool). This is experimental infrastructure for AI-assisted development.

## Project Architecture

### Key Technologies
- **Frontend**: React 19, TanStack Router (file-based routing), TanStack Query
- **Backend**: Convex (serverless database + backend)
- **Auth**: Convex Auth + Convex (role storage)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Tables**: Custom DataTable component with search, filter chips, sort, pagination
- **Icons**: Lucide React
- **Toasts**: Sonner
- **Testing**: Vitest 5 + React Testing Library (unit), Playwright (E2E)
- **Linting & formatting**: Oxlint + Oxfmt via Vite+ (tab indentation, double quotes)
- **Build**: Vite 8 + Rolldown + TypeScript strict mode
- **Hosting**: Netlify (`netlify.toml`)

### Database & Authentication

**Convex** stores the database schema and backend functions in `convex/`:
- `schema.ts` — 7 data models (tournaments, teams, players, games, fields, gameStats, userProfiles)
- `teams.ts`, `players.ts`, `playerStats.ts`, `tournaments.ts` — Query functions
- `userProfiles.ts` — User roles and profile mutations
- `seed.ts` — Development seed data
- `auth.config.ts` — Convex Auth JWT configuration

**Convex Auth** handles user authentication via the site origin JWT flow. On first sign-in:
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
  integrations/     - Convex provider setup
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
  auth.config.ts    - Convex Auth JWT configuration

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
- Use `bun run check` before committing (format + lint)
- Always validate auth server-side in Convex mutations
- Run `bunx convex dev` concurrently with `bun run dev`

## Resources

- **[AGENTS.md](AGENTS.md)** — Comprehensive development guidelines
- **[TOURNAMENT_PLAN.md](TOURNAMENT_PLAN.md)** — Project roadmap and feature planning
- **[feature-tickets/](feature-tickets/)** — Development tickets organized by feature
- **[src/design/](src/design/)** — Route design specifications
- **Convex Docs** — https://docs.convex.dev
- **TanStack Router** — https://tanstack.com/router
- **Auth Docs** — https://docs.convex.dev/auth/authz
- **shadcn/ui** — https://ui.shadcn.com
