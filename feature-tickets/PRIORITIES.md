# Feature Priorities — Tournament Tracker

> **Living document.** Use this to track current priorities. Add new tickets as they arise and
> move items between statuses. When an item ships, move it to the "Done" section or reference
> the feature ticket in `complete/`.

---

## Status Legend

| Marker | Meaning |
|--------|---------|
| 🔴 P0 | Blocking / must do now |
| 🟡 P1 | High value, do next |
| 🟢 P2 | Nice to have / polish |
| ⚪ P3 | Backlog / deferred |

---

## Current Priorities

### 🟢 P2 — Expand E2E coverage

Existing specs: `auth`, `navigation`, `player-details`, `schedule-autogeneration`, `seasons`,
`setup-wizard`, `tournaments`, `teams`, `players`.

**Covered:**
- [x] Tournaments CRUD (create / edit / delete)
- [x] Teams page (listing, search, filters) + create-flow scaffold
- [x] Players page (listing, search, filters, stats view toggle)
- [x] Season schedule generation + bracket dialog visibility

**Still missing:**
- [ ] Fields management
- [ ] Games management
- [ ] Player stats page
- [ ] Bracket view

**Why:** Largest regression-safety gap. Use the `qa-test-to-playwright` / `qa-e2e-playwright` skills.

---

### ⚪ P3 — Process / cleanup

- [ ] Keep `PRIORITIES.md` up to date as tickets ship
- [ ] Triage any remaining scenarios in `Enhancments/ideas.md`

---

## Done

| Item | Status |
|------|--------|
| Feature tickets 01–23 + 25 | ✅ Implemented (`complete/`) |
| Feature 20: Season Schedule & Standings | ✅ Implemented — moved to `complete/` 2026-09-24 |
| Feature 21: Schedule Auto-Generation | ✅ Implemented — duplicate `TODO/21` removed 2026-09-24 |
| Feature 23: Setup Wizard auto-roster | ✅ Implemented — moved to `complete/` 2026-09-24 |
| `schedule-autogeneration` branch merge | ✅ Merged into `main` (PR #11) |
| Homepage dashboard upgrade | ✅ Implemented 2026-08-06 (`src/routes/index.tsx`) |
| Debug: seasons page stub | ✅ Closed 2026-08-05 (`debug/`) |
| Debug: wizard add-existing-players | ✅ Closed 2026-08-05 (`debug/`) |
| Backlog: memoization / callbacks / auth toasts | ✅ Verified — tickets in `complete/backlog/` |
| Wizard submit redirect (ideas.md 404) | ✅ Implemented — `SetupWizard.tsx` navigates to `/seasons/$id` |

---

## How to use this doc

- **Add a priority:** add a row/section with a status marker and a short "why".
- **Remove / ship:** move the item to the **Done** table (or delete it) once merged/verified.
- **Re-prioritize:** edit the status marker (🔴/🟡/🟢/⚪) and reorder the sections.
- **Reference tickets:** link to `feature-tickets/complete/*.md` or `feature-tickets/debug/*.md`
  for full context instead of duplicating detail here.
