---
name: frontend-engineer
description: Frontend engineering standards and workflows for TanStack Tournament Tracker - React, TypeScript, TanStack Router, Convex, shadcn/ui, TailwindCSS
metadata:
  audience: developers
  stack: react-typescript-tanstack-convex
---

## Project Overview

TanStack Tournament Tracker is a React + TypeScript application using TanStack Router for routing, Convex for the backend database, shadcn/ui for components, and TailwindCSS for styling.

## Build Commands

- `bun run dev` - Start dev server on port 3000 (`vp dev`)
- `bun run build` - Build for production (`vp build`)
- `bun run test` - Run all unit tests (`vp test run`, Vitest 5)
- `bun run lint` - Lint with Oxlint (`vp lint`)
- `bun run format` - Format with Oxfmt (`vp fmt`)
- `bun run check` - Format + lint check (`vp check`)

## Code Style

### Formatting & Linting
- Oxfmt formats and Oxlint lints, both configured in `vite.config.ts` (tab indentation, double quotes, 80-column width)
- Run `bun run check` before committing
- Imports are sorted automatically

### Import Organization
Order imports as follows:
1. External libraries (React, TanStack, etc.)
2. Internal modules using `@/*` path aliases
3. Relative imports

### Naming Conventions
- **Components**: PascalCase.tsx (e.g., `TeamTable.tsx`)
- **Utilities/Hooks**: camelCase.ts (e.g., `useTeams.ts`)
- **Routes**: Follow TanStack Router file-based routing in `src/routes/`
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE for config values, PascalCase for class-like constants

### TypeScript
- Strict mode enabled - always type functions and variables
- Avoid `any` types - use proper typing or `unknown` with type guards
- Use interfaces for object shapes, types for unions/primitives

### React Components
- Use functional components with hooks
- Component props should be typed with interfaces
- Destructure props and name them descriptively

### Error Handling
- Use try/catch with proper error types
- Create custom error classes for domain-specific errors

## Design System

### shadcn/ui Components
- Use shadcn components for UI elements: `bunx shadcn@latest add <component>`
- Common components: Button, Card, Table, Badge, Dialog, DropdownMenu, Input, Form
- Run `bun run format` after adding new components
- Use `cn()` utility from `@/lib/utils` for class merging

### TailwindCSS
- Use utility classes consistently - check existing patterns first
- Common patterns:
  - Container: `max-w-7xl mx-auto px-6`
  - Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
  - Cards: `bg-white dark:bg-slate-800 rounded-xl shadow-sm`

### Accessibility
- Always add `type="button"` to button elements not in forms
- Include aria-labels for icon-only buttons

## Routes & Components

### Routes
- `src/routes/` - TanStack Router file-based routing
- Use `createFileRoute` for route components
- Follow naming: `index.tsx` for `/`, `teams.tsx` for `/teams`

### Components
- `src/components/` - Shared React components
- `src/components/ui/` - shadcn UI components

## Database (Convex)

### Queries & Mutations
- Use `useQuery` for reading data (real-time updates)
- Use `useMutation` for writes (call with `.catch()` for errors)
- Index frequently-queried fields to avoid table scans

### Common Patterns
- Foreign key relationships: Use `v.id("tableName")` for type-safe references
- Timestamps: Store as milliseconds (JS `Date.now()`)
- Optional fields: Use `v.optional(v.string())`
- Status fields: Use `v.union(v.literal("..."), ...)` for enums

### Schema Location
- Schema defined in `convex/schema.ts`
- Convex functions in `convex/` directory

## Authentication & Authorization

### Clerk + Convex Integration
- Clerk handles user authentication
- Use `useAuth()` hook from `src/hooks/useAuth.ts` to get user + profile + role

### Roles
- `admin` - full access
- `organizer` - tournament management
- `player` - team/player data
- `spectator` - read-only

### Client-Side Checks
```typescript
const { isAdmin, isOrganizer, profile } = useAuth();
if (!isAdmin) return <AccessDenied />;
```

## Feature Development Workflow

1. Check relevant design doc in `src/design/` before implementing
2. Run `bun run check` to verify formatting/linting
3. Run `bun run test` for affected files
4. Build with `bun run build` before submitting PRs

## Testing

- Run tests with `bun run test`
- Mock Convex API with `src/mocks/` directory
- Use Vitest + React Testing Library for component tests
