# MVP Roadmap — Tournament Tracker

## Overview
Phased implementation plan. All core features (CRUD, tournaments, games, brackets, fields, stats) are now complete. New tickets added for Season/Setup Wizard feature set.

## Current Status

```
Auth System            ████████████████████████████████ 100%
Convex Schema          ████████████████████████████████ 100%
Homepage               ████████░░░░░░░░░░░░░░░░░░░░░░░  30% (basic stats cards)
Dashboard              ████████████████████████████████ 100%
Players Page           ████████████████████████████████ 100% (full CRUD)
Teams Page             ████████████████████████████████ 100% (full CRUD)
Tournaments Page       ████████████████████████████████ 100%
Games                  ████████████████████████████████ 100%
Fields                 ████████████████████████████████ 100%
Brackets               ████████████████████████████████ 100%
Game Stats             ████████████████████████████████ 100%
Player-Team Assignment ████████████████████████████████ 100%
Unit Tests             ██████████████████████░░░░░░░░░  65% (core components tested)
E2E Tests              ██████████░░░░░░░░░░░░░░░░░░░░░  25% (auth + navigation scaffold)
Seasons                ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0% (new)
Setup Wizard           ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0% (new)
```

## Remaining Work

| Priority | Ticket               | Effort  | Description |
|----------|----------------------|---------|-------------|
| 🔴 P1    | `14-schema-season-foundation.md` | Medium  | Seasons, seasonTeams, seasonGames schema + seasonId on tournaments |
| 🔴 P1    | `15-season-convex-functions.md`  | Large   | CRUD Convex functions for seasons, seasonTeams, seasonGames |
| 🔴 P1    | `16-season-hooks.md`             | Small   | useSeasons, useSeasonTeams React hooks |
| 🔴 P1    | `17-setup-wizard-dialog.md`      | X-Large | 5-step multi-season dialog (teams → rosters → season → tournament → review) |
| 🔴 P1    | `18-dashboard-wizard-integration.md` | Small | Wizard launch buttons on Dashboard + Homepage, Seasons nav link |
| 🔴 P1    | `19-season-detail-page.md`       | Medium  | /seasons/$id route with season info + teams list + edit dialog |
| 🔴 P1    | Backlog tickets (3)              | Low     | Memoization, callback stabilization, auth toast notifications |

### Dependency Graph

```
14 (Schema Foundation)
  └─► 15 (Convex Functions)
        ├─► 16 (React Hooks)
        │     └─► 19 (Season Detail Page)
        └─► 17 (Setup Wizard Dialog)
              └─► 18 (Dashboard Integration)
```

## Notes

- Tickets 14–19 are the new Season + Setup Wizard feature set
- All previous MVP feature tickets are in `complete/`, `complete/auth/`, `complete/backlog/`
- `vite.config.ts` excludes `tanstackStart()` plugin during Vitest runs (`process.env.VITEST`) to fix React hooks CJS/ESM interop issue
- Seasons use `planning` → `active` → `complete` status lifecycle
- Setup Wizard uses multi-step dialog (not full-page route)
- Post-wizard redirects to `/seasons/$id` (Ticket 19)
