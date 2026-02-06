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
- Document indices clearly on tables
- Reference https://docs.convex.dev/database/types for built-in types
- Every document has automatic system fields `_id` and `_creationTime`
- Use `.index()` for query performance on frequently queried fields

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

## Development Workflow

1. Check relevant design doc in `src/design/` before implementing
2. Run `npm run check` to verify formatting/linting
3. Run `npm run test` for affected files
4. Build with `npm run build` before submitting PRs

## Notes
- Single-admin, self-hosted system - no multi-user auth complexity
- Team management is primary feature - prioritize in UI
- Docker-ready - keep dependencies minimal
