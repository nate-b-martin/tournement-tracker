# TanStack Tournament Tracker - Agent Guidelines

## Build Commands
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run test` - Run all tests with Vitest
- `npm run test <path>` - Run single test file (e.g., `npm run test src/components/Button.test.tsx`)
- `npm run test:watch` - Run tests in watch mode (not yet configured, would be `vitest watch`)
- `npm run lint` - Run Biome linter
- `npm run format` - Format code with Biome
- `npm run check` - Run Biome format + lint

## Code Style

### Formatting & Linting
- Use Biome for formatting (tab indentation, double quotes)
- Run `npm run check` before committing to ensure code passes format + lint
- Never disable lint rules without explicit justification
- Biome organizes imports automatically per configuration

### Import Organization
Order imports as follows:
1. External libraries (React, TanStack, etc.)
2. Internal modules using `@/*` path aliases
3. Relative imports

### Naming Conventions
- **Components**: PascalCase.tsx (e.g., `TeamTable.tsx`, `TournamentCard.tsx`)
- **Utilities/Hooks**: camelCase.ts (e.g., `useTeams.ts`, `formatDate.ts`)
- **Routes**: Follow TanStack Router file-based routing in `src/routes/`
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE for config values, PascalCase for class-like constants

### TypeScript
- Strict mode enabled - always type functions and variables
- Avoid `any` types - use proper typing or `unknown` with type guards
- Use interfaces for object shapes, types for unions/primitives
- Export types alongside components when used externally

### React Components
- Use functional components with hooks
- Component props should be typed with interfaces
- Destructure props and name them descriptively
- Keep components focused - single responsibility principle

### Error Handling
- Use try/catch with proper error types
- Create custom error classes for domain-specific errors
- Log errors appropriately (console.error in non-production)
- Return user-friendly error messages in UI components

### Convex Patterns
- Follow schema patterns in `convex/schema.ts`
- Use `v` validator builder for schema definitions
- Document indices clearly on tables (e.g., `.index("by_userId", ["userId"])`)
- Indices on frequently-queried fields prevent full table scans
- Every document has automatic system fields `_id` and `_creationTime`
- Query functions: use `.withIndex()` for filtered queries, `.collect()` to fetch all
- Mutations must validate auth with `ctx.auth.getUserIdentity()`
- Return types: use `v.union()` to allow null/empty results in queries
- Keep handlers simple; move complex logic to utility functions
- Reference https://docs.convex.dev/database/schema for full validator API

### Documentation & Research
- Use Context7 MCP server when needing library documentation or API references
- Call `context7_resolve-library-id` first to get the correct library ID, then `context7_query-docs` for specific queries
- Use codesearch for programming examples and implementation patterns
- Use websearch for current information beyond knowledge cutoff

## Design System

### shadcn/ui Components
- Use shadcn components for UI elements: `bunx shadcn@latest add <component>`
- Common components: Button, Card, Table, Badge, Dialog, DropdownMenu, Input, Form
- Run `npm run format` after adding new components
- Components use `cn()` utility from `@/lib/utils` for class merging

### TailwindCSS
- Use utility classes consistently - check existing patterns first
- Common patterns:
  - Container: `max-w-7xl mx-auto px-6`
  - Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
  - Cards: `bg-white dark:bg-slate-800 rounded-xl shadow-sm`
- Prefer semantic class names over arbitrary values
- Use `tw-animate-css` for animations

### Accessibility
- Always add `type="button"` to button elements not in forms
- Include aria-labels for icon-only buttons
- Ensure sufficient color contrast
- Keyboard navigation support for interactive elements

## Design Documents

### Following Design Specs
- **Homepage**: See `src/design/HOMEPAGE_DESIGN.md` for route `/` implementation specs
- **Future Routes**: Create design docs in `src/design/<ROUTE_NAME>_DESIGN.md` before implementing
- Design docs contain wireframes, component breakdowns, and implementation priorities
- Check `src/design/` for relevant specs before working on any route

### Design Doc Structure
When creating new design docs, include:
1. Overview section with goals
2. ASCII wireframe sketch
3. Section breakdown with component details
4. Technical implementation notes (shadcn components, Tailwind classes)
5. Responsive behavior guide
6. Implementation phases/priorities

## Project Structure

### Routes
- `src/routes/` - TanStack Router file-based routing
- Use `createFileRoute` for route components
- Follow naming: `index.tsx` for `/`, `teams.tsx` for `/teams`

### Components
- `src/components/` - Shared React components
- `src/components/ui/` - shadcn UI components
- Organize by feature when appropriate

### Database
- `convex/schema.ts` - Convex database schema
- `convex/` - Convex function files

## Authentication & Authorization

### Clerk + Convex Integration
- Clerk handles user authentication, Convex stores user profiles and roles
- Authentication flow: Clerk JWT → Convex auth.config.ts → stored in `userProfiles` table
- Use `useAuth()` hook from `src/hooks/useAuth.ts` to get user + profile + role
- First user created auto-promotes to `admin` role; subsequent users default to `spectator`
- Roles: `admin` (full access), `organizer` (tournament management), `player` (team/player data), `spectator` (read-only)

### Role-Based Access Control (RBAC)
- Client-side: Use `ProtectedRoute` wrapper component with `requireAdmin` prop
- Server-side: Always validate `ctx.auth.getUserIdentity()` in Convex mutations
- Profile creation is automatic on first sign-in via `useAuth()` hook
- Query user role with `getCurrentUser` (returns full profile with role)

### Common Auth Patterns
```typescript
// Client: Check role
const { isAdmin, isOrganizer, profile } = useAuth();
if (!isAdmin) return <AccessDenied />;

// Server: Validate in mutations
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Unauthorized");
```

## Convex Database Best Practices

### Queries & Mutations
- Use `useQuery` for reading data (real-time updates)
- Use `useMutation` for writes (call with `.catch()` for errors)
- Index frequently-queried fields to avoid table scans
- Example index: `.index("by_userId", ["userId"])` on `userProfiles` for quick lookups by Clerk ID

### Common Patterns
- Foreign key relationships: Use `v.id("tableName")` for type-safe references
- Timestamps: Store as milliseconds (JS `Date.now()`)
- Optional fields: Use `v.optional(v.string())` in schema
- Status fields: Use `v.union(v.literal("..."), ...)` for enums

### Pitfalls to Avoid
- Don't fetch all documents without filtering—use `.withIndex()` for performance
- `useQuery` suspends components; wrap with `<Suspense>` if needed
- Convex auto-syncs data; don't maintain local state that contradicts server truth

## Environment Setup

### Required .env.local Variables
```
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_JWT_ISSUER_DOMAIN=https://your-domain.clerk.accounts.com
```

### Local Development
- Run Convex dev server: `npx convex dev` (concurrent with `npm run dev`)
- Automatically manages local schema and data
- Seeding: Add test data in `convex/seed.ts` and run `npx convex seed`

## Testing with Convex

### Unit Testing
- Mock Convex API with `src/mocks/` directory
- Mock hooks: `useMockPlayers`, `useMockTeams` for isolated component tests
- Use `@convex-dev/react-query` test utilities for integration tests

### Integration Testing
- Use real Convex test database or mocked responses
- Test RBAC by simulating different user roles in `useAuth()` hook
- Vitest + React Testing Library for component tests

## Feature Development Workflow

1. **Planning**: Check `feature-tickets/` for related tickets and dependencies
2. **Design**: Create design doc in `src/design/<FEATURE>_DESIGN.md` if adding new routes
3. **Implementation**: Follow order in AGENTS.md (code style → components → Convex functions)
4. **Testing**: Run `npm run test` for affected features, `npm run check` for formatting
5. **Verification**: Ensure new features respect RBAC (test as different roles)

## Development Workflow

1. Check relevant design doc in `src/design/` before implementing
2. Run `npm run check` to verify formatting/linting
3. Run `npm run test` for affected files
4. Build with `npm run build` before submitting PRs

## Notes

- Single-admin, self-hosted system - first user auto-promotes to admin
- Team management is primary feature - prioritize in UI
- Docker-ready - keep dependencies minimal
- Convex development requires concurrent `npx convex dev` terminal
- Always validate auth server-side; client-side checks are UX only
