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

### 🟡 P1 — Homepage dashboard upgrade (~30% complete)

`src/routes/index.tsx` is currently just 3 static count cards + an "Open Dashboard" link.

**Ideas:**
- [ ] Navigation cards linking to Teams / Players / Tournaments / Seasons pages
- [ ] Recent tournaments and seasons list
- [ ] Role-aware quick actions (admin vs spectator)
- [ ] Empty/loading states
- [ ] Responsive grid layout

**Why:** Matches the flagged gap in `MVP_ROADMAP.md`; high visible value; reuses existing hooks.

---

### 🟢 P2 — Expand E2E coverage (~25% complete)

Only 6 spec files exist today: `auth`, `navigation`, `player-details`, `schedule-autogeneration`, `seasons`, `setup-wizard`.

**Missing CRUD flows to cover:**
- [ ] Tournaments CRUD (create / edit / delete)
- [ ] Teams CRUD
- [ ] Players CRUD + status filtering
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
