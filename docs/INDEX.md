# TanStack Tournament Tracker — Documentation Hub

Real-time tournament management system for American sports (starting with softball). Built with React 19, TanStack Router, Convex, and Clerk.

---

## For Developers

### Architecture & Tech Stack

- [System Architecture](architecture/OVERVIEW.md) — Layer diagram, data flow, component interaction
- [Tech Stack](architecture/TECH_STACK.md) — Every dependency with purpose and version

### Backend (Convex)

- [Database Schema](backend/SCHEMA.md) — ER diagram, 7 tables, field references, relationships, index status
- [Queries & Mutations](backend/QUERIES_MUTATIONS.md) — Every `convex/` function with args, return types, auth requirements
- [Real-Time Updates](backend/REAL_TIME.md) — Convex subscriptions, live data flow, loading states
- [Seed Data](backend/SEED_DATA.md) — What `npx convex seed` creates

### Frontend

- [Routes](frontend/ROUTES.md) — Route table with path, file, component, auth, data dependencies
- [Data Fetching Pattern](frontend/DATA_FETCHING.md) — Consistent hook pattern: `useQuery` → Convex → component
- [Component Tree](frontend/COMPONENT_TREE.md) — Component hierarchy and responsibilities
- [Design System](frontend/DESIGN_SYSTEM.md) — shadcn/ui components, Tailwind patterns, theme tokens

### Authentication & Authorization

- [Auth Flow & RBAC](auth/RBAC.md) — Permission matrix, role definitions, first-user-admin rule

### Testing

- [Testing Overview](testing/OVERVIEW.md) — Strategy: unit vs E2E, how to run, directory layout

### Development

- [Setup Guide](development/SETUP.md) — Prerequisites, env vars, running locally
- [Development Workflow](development/WORKFLOW.md) — Ticket lifecycle, design doc process, commands
- [Feature Tickets](../feature-tickets/MVP_ROADMAP.md) — Active tickets and backlog

### Deployment

- [Netlify Deployment](deployment/NETLIFY.md) — Build settings, production deploy, CI/CD
- [Environment Variables](deployment/ENVIRONMENT.md) — All env vars, where to get them, safety rules

### Source References

| File | Description |
|------|-------------|
| [AGENTS.md](../AGENTS.md) | Agent development guidelines (code style, conventions) |
| [README.md](../README.md) | Project overview, status, getting started |
| [TOURNAMENT_PLAN.md](../TOURNAMENT_PLAN.md) | Feature roadmap and tournament specifications |
| [TABLES_DESIGN.md](../src/design/TABLES_DESIGN.md) | DataTable implementation design |

---

## For End Users

- [Quickstart Guide](user-guide/QUICKSTART.md) — Sign up, first login, role discovery
- [User Flows](user-guide/USER_FLOWS.md) — Step-by-step walkthroughs for Admin, Organizer, Player, Spectator
- [Roles & Permissions](user-guide/ROLES_AND_PERMISSIONS.md) — What each role can do in the UI
- [Tournament Lifecycle](user-guide/TOURNAMENT_LIFECYCLE.md) — Draft → Registration → Active → Complete
- [Navigation Guide](user-guide/NAVIGATION.md) — Sidebar menu, routes map, mobile layout
- [Glossary](user-guide/GLOSSARY.md) — Bracket types, seeding, scoring terms

---

## Key Links

- **App Home**: [`/`](http://localhost:3000)
- **Dashboard**: [`/dashboard`](http://localhost:3000/dashboard)
- **Players**: [`/playerspage`](http://localhost:3000/playerspage)
- **Teams**: [`/teamspage`](http://localhost:3000/teamspage)
- **Tournaments**: [`/tournamentspage`](http://localhost:3000/tournamentspage)
- **Games**: [`/gamespage`](http://localhost:3000/gamespage)
- **Tournament Detail**: `/tournaments/<id>`
