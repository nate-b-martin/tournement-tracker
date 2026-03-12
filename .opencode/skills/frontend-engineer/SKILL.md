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

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run test` - Run all tests with Vitest
- `npm run lint` - Run Biome linter
- `npm run format` - Format code with Biome
- `npm run check` - Run Biome format + lint

## Code Style

### Formatting & Linting
- Use Biome for formatting (tab indentation, double quotes)
- Run `npm run check` before committing
- Biome organizes imports automatically

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
- Run `npm run format` after adding new components
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
2. Run `npm run check` to verify formatting/linting
3. Run `npm run test` for affected files
4. Build with `npm run build` before submitting PRs

## Testing

- Run tests with `npm run test`
- Mock Convex API with `src/mocks/` directory
- Use Vitest + React Testing Library for component tests
