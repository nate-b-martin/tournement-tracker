# TanStack Tournament Tracker - Agent Guidelines

## Build Commands
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run test` - Run all tests with Vitest
- `npm run test <path>` - Run single test file
- `npm run lint` - Run Biome linter
- `npm run format` - Format code with Biome
- `npm run check` - Run Biome format + lint

## Code Style
- Use Biome for formatting (tab indentation, double quotes)
- Import organization: external libraries first, then internal modules
- TypeScript strict mode enabled - always type functions and variables
- Use `@/*` path aliases for internal imports
- Component files: PascalCase.tsx, utility files: camelCase.ts
- Use React functional components with hooks
- Error handling: try/catch with proper error types
- Follow Convex schema patterns in convex/schema.ts
- Use shadcn components: `bunx shadcn@latest add <component>`
- Always add `type="button"` to button elements not in forms
- Avoid `any` types - use proper typing instead