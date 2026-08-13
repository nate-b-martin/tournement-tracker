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

### 🟡 P1 — Close & verify the two "open" debug tickets

Both are effectively **already implemented in code** but still marked `status: open` in `feature-tickets/debug/`.

| Ticket | Code status | Action |
|--------|-------------|--------|
| `2026-07-20-seasons-page-stub-no-details.md` | `seasonspage/index.tsx` now renders `<SeasonsTable />` | ✅ Closed 2026-08-05 |
| `2026-07-20-wizard-add-existing-players-not-implemented.md` | `StepManageRosters.tsx:98` wires `api.players.search` | ✅ Closed 2026-08-05 |

**Why:** Quick win — closes open loops with minimal effort.

---

### 🟡 P1 — Merge `schedule-autogeneration` branch into `main`

The current branch contains feature work (season detail page, player details, schedule generation)
that is **ahead of `main`** and not yet merged/PR'd.

**Why:** Locks in tickets 20/21/22/25 that currently only exist on this branch.

**Checklist:**
- [ ] Rebase/merge `main` into `schedule-autogeneration`
- [ ] Run `npm run check && npm run test && npm run build`
- [ ] Open PR, get review, merge

---

### 🟢 P2 — Expand E2E coverage (~40% complete)

Existing specs: `auth`, `navigation`, `player-details`, `schedule-autogeneration`, `seasons`, `setup-wizard`. Added: `tournaments`, `teams`, `players`.

**Covered:**
- [x] Tournaments CRUD (create / edit / delete)
- [x] Teams page (listing, search, filters) + create-flow scaffold
- [x] Players page (listing, search, filters, stats view toggle)

**Still missing:**
- [ ] Fields management
- [ ] Games management
- [ ] Player stats page
- [ ] Bracket view

**Why:** Largest regression-safety gap. Use the `qa-test-to-playwright` / `qa-e2e-playwright` skills.

---

### 🟢 P2 — Backlog performance tickets (verification)

The 3 backlog tickets appear implemented in code (`DataTable.tsx` has memoized values/callbacks,
`ProtectedRoute.tsx` has sonner toasts). Verify and close:
- [ ] `complete/backlog/01-memoize-derived-values.md`
- [ ] `complete/backlog/02-stabilize-callbacks.md`
- [ ] `complete/backlog/03-auth-toast-notifications.md`

---

### ⚪ P3 — Process / cleanup

- [ ] Commit the uncommitted ticket reorg (deletions of `TODO/21,22`, untracked `complete/21,22`)
- [ ] Keep `PRIORITIES.md` up to date as tickets ship

---

## Done

| Item | Status |
|------|--------|
| Feature tickets 01–22 + 25 | ✅ Implemented (`complete/`) |
| Homepage dashboard upgrade | ✅ Implemented 2026-08-06 (`src/routes/index.tsx`) |
| Debug: seasons page stub | ✅ Closed 2026-08-05 (`debug/`) |
| Debug: wizard add-existing-players | ✅ Closed 2026-08-05 (`debug/`) |
| Backlog: memoization / callbacks / auth toasts | ✅ Implemented in code |

---

## How to use this doc

- **Add a priority:** add a row/section with a status marker and a short "why".
- **Remove / ship:** move the item to the **Done** table (or delete it) once merged/verified.
- **Re-prioritize:** edit the status marker (🔴/🟡/🟢/⚪) and reorder the sections.
- **Reference tickets:** link to `feature-tickets/complete/*.md` or `feature-tickets/debug/*.md`
  for full context instead of duplicating detail here.
