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
Seasons                ████████████████████████████████ 100% (full lifecycle)
Setup Wizard           ████████████████████████████████ 100% (5-step dialog)
Unit Tests             ██████████████████████░░░░░░░░░  65% (core components tested)
E2E Tests              ██████████░░░░░░░░░░░░░░░░░░░░░  25% (auth + navigation scaffold)
```

## Remaining Work

| Priority | Ticket               | Effort  | Description |
|----------|----------------------|---------|-------------|
| 🟡 P2    | Backlog tickets (3)  | Low     | Memoization, callback stabilization, auth toast notifications |

## Notes

- Tickets 14–19 (Seasons + Setup Wizard feature set) are all complete
- All feature tickets are in `complete/`, `complete/auth/`, `complete/backlog/`
- `vite.config.ts` excludes `tanstackStart()` plugin during Vitest runs (`process.env.VITEST`) to fix React hooks CJS/ESM interop issue
- Seasons use `planning` → `active` → `complete` status lifecycle
- Setup Wizard uses multi-step dialog (not full-page route)
- Post-wizard redirects to `/seasons/$id`
