# Tech Stack

## Frontend

| Library | Version | Purpose |
|---------|---------|---------|
| React | ^19.2.0 | UI framework |
| TanStack Router | ^1.132.0 | File-based routing with SSR |
| TanStack React Table | ^8.21.3 | Table/sorting/filtering logic |
| TanStack React Query | (Convex bridge) | Server state management |
| TanStack Start | ^1.132.0 | Meta-framework (SSR, builds) |
| Tailwind CSS | ^4.0.6 | Utility-first styling |
| shadcn/ui | (custom) | Accessible component primitives |
| Lucide React | ^0.544.0 | Icon library |
| Sonner | ^2.0.7 | Toast notifications |
| clsx + tailwind-merge | ^2.1.1 / ^3.0.2 | Class merging (`cn()`) |
| next-themes | ^0.4.6 | Dark mode (installed, toggle not yet implemented) |
| react-hook-form | ^7.81.0 | Form state management |
| zod | 4.1.11 | Schema validation |
| hookform/resolvers | ^5.4.0 | Zod-React Hook Form bridge |
| tw-animate-css | ^1.3.6 | Tailwind animation utilities |

## Backend

| Library | Version | Purpose |
|---------|---------|---------|
| Convex | ^1.27.3 | Serverless database + backend functions |
| Convex React | ^1.27.3 | React bindings (`useQuery`, `useMutation`) |
| Convex React Query | 0.0.0-alpha.11 | TanStack Query bridge |

## Authentication

| Library | Version | Purpose |
|---------|---------|---------|
| @clerk/clerk-react | ^5.49.0 | React auth SDK |
| @clerk/testing | ^1.14.3 | E2E testing auth helpers |
| convex/react-clerk | (Convex) | Clerk ↔ Convex provider bridge |

## Developer Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| TypeScript | ^5.7.2 | Type checking (strict mode) |
| Vite | ^7.1.7 | Bundler and dev server |
| Vitest | ^3.0.5 | Unit test runner |
| @testing-library/react | ^16.2.0 | Component testing |
| @testing-library/dom | ^10.4.0 | DOM query utilities |
| jsdom | ^27.0.0 | DOM environment for tests |
| Playwright | ^1.58.2 | E2E browser testing |
| Biome | 2.2.4 | Linter + formatter (tab indent, double quotes) |
| TanStack Devtools | ^0.7.0 | React devtools panel |

## Infrastructure

| Service | Config File | Purpose |
|---------|-------------|---------|
| Netlify | `netlify.toml` | Production hosting |
| Convex Cloud | `convex/auth.config.ts` | Database and backend hosting |
| Clerk | `.env.local` | Authentication service |

## Project Config Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts |
| `tsconfig.json` | Strict TS, `@/*` alias to `src/` |
| `vite.config.ts` | Vite + Vitest + Tailwind + React + path aliases |
| `biome.json` | Formatter/linter settings |
| `playwright.config.ts` | E2E test config (Chromium, port 3000) |
| `components.json` | shadcn/ui config (new-york, zinc base) |
| `.env.local` | Local env vars (Convex URL, Clerk keys) |
| `netlify.toml` | Netlify build/deploy config |
