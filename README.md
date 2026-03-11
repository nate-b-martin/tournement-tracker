# TanStack Tournament Tracker

A real-time tournament management system with role-based access control, built with React, TanStack Router, Convex (backend), and Clerk (authentication).

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

## Building For Production

To build this application for production:

```bash
npm run build
```

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
npm run test
```

Run a single test file:
```bash
npm run test src/components/Button.test.tsx
```

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

Add new components with:

```bash
npx shadcn@latest add <component-name>
```

Run `npm run format` after adding components.

Common components: Button, Card, Table, Badge, Dialog, DropdownMenu, Input, Form

## Project Architecture

### Key Technologies
- **Frontend**: React 19, TanStack Router (file-based routing), TanStack Query
- **Backend**: Convex (serverless database + backend)
- **Auth**: Clerk (authentication) + Convex (role storage)
- **Styling**: Tailwind CSS + shadcn/ui
- **Testing**: Vitest + React Testing Library
- **Formatting**: Biome (tab indentation, double quotes)

### Database & Authentication

**Convex** stores the database schema and backend functions in `convex/`:
- `schema.ts` - Data models (tournaments, teams, players, games, etc.)
- `userProfiles.ts` - User roles and profile data
- `auth.config.ts` - Clerk JWT configuration

**Clerk** handles user authentication. On first sign-in:
- User is automatically promoted to `admin` role
- Subsequent users default to `spectator` role
- Roles: `admin` (full access), `organizer` (tournament management), `player` (team/player data), `spectator` (read-only)

### File Structure

```
src/
  routes/           - TanStack Router file-based routing
  components/       - React components (ui/, DataTable/, etc.)
  hooks/            - Custom hooks (useAuth, useTeams, etc.)
  design/           - Design docs for routes (HOMEPAGE_DESIGN.md, etc.)
  integrations/     - Convex & Clerk provider setup
  utils/            - Utility functions
  
convex/
  schema.ts         - Database schema
  *.ts              - Convex functions (queries, mutations)
  
feature-tickets/    - Development tickets organized by feature



## Development Guidelines

For detailed code style, patterns, authentication/authorization, database best practices, and development workflow, see [AGENTS.md](AGENTS.md).

**Key principles:**
- Check `src/design/` for design docs before implementing routes
- Use `npm run check` before committing (format + lint)
- Always validate auth server-side in Convex mutations
- Run `npx convex dev` concurrently with `npm run dev`

## Resources

- **[AGENTS.md](AGENTS.md)** - Comprehensive development guidelines
- **[TOURNAMENT_PLAN.md](TOURNAMENT_PLAN.md)** - Project roadmap and feature planning
- **[feature-tickets/](feature-tickets/)** - Development tickets organized by feature
- **[src/design/](src/design/)** - Route design specifications
- **Convex Docs** - https://docs.convex.dev
- **TanStack Router** - https://tanstack.com/router
- **Clerk Docs** - https://clerk.com/docs
- **shadcn/ui** - https://ui.shadcn.com
