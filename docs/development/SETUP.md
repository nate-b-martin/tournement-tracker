# Development Setup

## Prerequisites

- **Node.js** 18+ (or Bun)
- **Convex account** — [sign up](https://convex.dev)
- **Clerk account** — [sign up](https://clerk.com)

## Environment Variables

Create `.env.local` in the project root:

```env
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_JWT_ISSUER_DOMAIN=https://your-domain.clerk.accounts.com
```

You can generate these automatically:

```bash
npx convex init     # Creates VITE_CONVEX_URL
npx clerk init      # Creates Clerk keys + JWT issuer
```

## Running Locally

The project requires two concurrent servers:

```bash
# Terminal 1: Convex backend
npx convex dev
```

```bash
# Terminal 2: Vite dev server (port 3000)
npm run dev
```

**Important**: Both must be running simultaneously. The app will not work without the Convex dev server running.

## Seed Data

Populate the database with test data:

```bash
npx convex seed
```

This creates:
- 1 tournament ("Summer Softball Classic 2026")
- 2 fields
- 4 teams (Warriors, Eagles, Titans, Legends)
- 32 players (8 per team)
- 2 games (1 completed, 1 scheduled)
- Player stats for the completed game

Clear all data via the Convex dashboard:

```bash
npx convex dashboard
# Run the clearAllData mutation manually
```

## Production Build

```bash
npm run build
```

Output goes to `dist/client/`. Deploy via Netlify (see `netlify.toml`).

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Build for production |
| `npm run test` | Run all unit tests |
| `npm run test <path>` | Run a specific test file |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run Playwright E2E tests (headless) |
| `npm run check` | Format + lint check (Biome) |
| `npm run format` | Format code (Biome) |
| `npm run lint` | Lint check only (Biome) |
| `npx convex dev` | Start Convex dev server |
| `npx convex seed` | Seed database with test data |
| `npx convex dashboard` | Open Convex dashboard |

## Project Structure

```
src/
  routes/           TanStack Router file-based routing
  components/       React components (ui/, DataTable/, feature/)
  hooks/            Custom hooks (useAuth, useTeams, usePlayers, etc.)
  design/           Design docs for routes (TABLES_DESIGN.md)
  integrations/     Convex & Clerk provider setup
  mocks/            Mock data for development/testing

convex/
  schema.ts         Database schema (7 tables)
  teams.ts          Teams queries + CRUD mutations
  players.ts        Players queries (list, getById, search) + joins
  playerStats.ts    Aggregated player stats queries
  tournaments.ts    Tournament queries + CRUD mutations
  games.ts          Game queries + CRUD mutations
  fields.ts         Field queries + CRUD mutations
  gameStats.ts      Game stats queries + upsert
  userProfiles.ts   User profile queries + role mutations
  seed.ts           Development seed data
  auth.config.ts    Clerk JWT configuration

tests/
  unit/             Vitest + React Testing Library tests
  e2e/              Playwright E2E tests with page objects
```

## Convex Development

- Schema changes in `convex/schema.ts` auto-sync when `convex dev` is running
- Functions in `convex/*.ts` auto-deploy on save
- The `_generated/` directory is auto-generated — do not edit manually
- Every mutation should validate auth with `ctx.auth.getUserIdentity()`
- Use `.withIndex()` for filtered queries on indexed fields

## Adding shadcn/ui Components

```bash
bunx shadcn@latest add <component-name>
```

Then run `npm run format` to organize imports.

## Testing

### Unit Tests
```bash
npm run test              # All tests
npm run test tests/unit/components/DataTable.test.tsx  # Single file
```

### E2E Tests
```bash
npm run test:e2e              # Headless
npm run test:e2e:ui           # UI debug mode
npm run test:e2e:headed       # Visible browser
```

E2E tests require the dev server running. They use Clerk test credentials from `.env.local`:

```
CLERK_TEST_EMAIL=test-user@example.com
CLERK_TEST_PASSWORD=password
```

> Note: The global setup (`tests/e2e/global-setup.ts`) reads `CLERK_TEST_EMAIL` and `CLERK_TEST_PASSWORD`, not `CLERK_EMAIL` or `ADMIN_CLERK_EMAIL`. Missing these will cause all E2E tests to skip at the global setup step.

## Need Help?

Check `feature-tickets/` for active development tickets and the [MVP roadmap](../feature-tickets/MVP_ROADMAP.md).
