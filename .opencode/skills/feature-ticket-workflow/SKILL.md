---
name: feature-ticket-workflow
description: Generic feature ticket executor - ingest any ticket from feature-tickets/ and drive it to completion step by step
metadata:
  audience: developers
  stack: react-typescript-convex-shadcn
---

## Usage

Load this skill and describe which ticket to execute in the task prompt:

```
Load the feature-ticket-workflow skill.

Complete the feature described in feature-tickets/07-tournament-management.md
```

The skill will:
1. Read and parse the ticket
2. Check prerequisites
3. Load relevant sub-skills
4. Generate a task plan
5. Execute each implementation step
6. Write necessary tests (unit, API, or UI)
7. Validate against acceptance criteria
8. Run `npm run check && npm run test && npm run build`

---

## Phase 1 — Ticket Ingestion

### Step 1.1: Read the ticket

Read the feature ticket from `feature-tickets/<ticket-file>.md`. Extract these sections:

### Step 1.2: Parse key sections

From the ticket, identify:

| Section | How to use |
|---------|------------|
| **Prerequisites** | Check each prerequisite. If any are not met, flag to user and stop. Prerequisites reference other ticket numbers — check if those files exist. |
| **Implementation Steps** | Generate a `todowrite` with one item per numbered step. Add sub-items for each file listed in Related Files. |
| **Related Files** | Files to create (NEW) or modify (MODIFY). Keep this list visible throughout. |
| **Acceptance Criteria** | Use as the final checklist before marking the ticket complete. |
| **Edge Cases** | Keep these in mind during implementation — verify they're handled. |

### Step 1.3: Load relevant sub-skills

Match keywords in the ticket to skills:

```
Contains "mutation" / "Convex" / "query" / "schema"
  → load convex-backend + crud-operations

Contains "dialog" / "form" / "create" / "edit" / "delete"
  → load crud-operations

Contains "component" / "route" / "page" / "navigation"
  → load frontend-engineer

Contains "bracket" / "scoring" / "standings" / "seed" / "round"
  → load tournament-domain

Contains "empty" / "loading" / "skeleton" / "dark"
  → load ui-enhancements

Contains "test" / "spec" / "mock"
  → load testing-patterns

Contains "e2e" / "playwright" / "browser"
  → load qa-e2e-playwright + qa-test-to-playwright
```

Load the matched skill by reading its `SKILL.md` file from `.opencode/skills/<name>/SKILL.md`.

Always load `frontend-engineer` for code style conventions.

### Step 1.4: Mark todo items

Use `todowrite` to create a structured todo list:

```markdown
- [ ] Step 1: <description> — in_progress
- [ ] Step 2: <description> — pending
- [ ] Write tests for <entity> — pending
- [ ] Validation: acceptance criteria — pending
- [ ] Build check: npm run check + test + build — pending
```

Only one item should be `in_progress` at a time.

---

## Phase 2 — Implementation Order

Within each step, follow this order:

### 2.1 Read before you write

Every file listed in "Related Files" or referenced in "Implementation Steps" must be read before editing it. Use the `Read` tool. If a NEW file would replace an existing one, read the existing one first.

Check neighboring files for conventions:
- For a new `convex/*.ts` function, read `convex/players.ts` first
- For a new `src/components/*.tsx`, read `src/components/TeamsTable.tsx` first
- For a new `src/hooks/*.ts`, read `src/hooks/useTeams.ts` first

### 2.2 Backend first, frontend second

Inside each step that creates/modifies files:

```
1. Convex functions (*.ts in convex/) — queries and mutations
2. Hooks (src/hooks/*.ts) — data fetching wrappers
3. Components (src/components/*.tsx) — UI components
4. Routes (src/routes/*.tsx) — route wiring
5. Other files (Header.tsx, seed.ts, etc.)
```

### 2.3 Follow existing patterns

When creating a new file, mirror the closest existing file:

| New file | Mirror |
|----------|--------|
| `convex/<entity>.ts` (mutation) | `convex/teams.ts` (create/update/remove pattern) |
| `convex/<entity>.ts` (query) | `convex/players.ts` (list/getById/search pattern) |
| `src/hooks/use<Entity>.ts` | `src/hooks/useTeams.ts` (useCallback + useState pattern) |
| `src/components/<Entity>Table.tsx` | `src/components/TeamsTable.tsx` (DataTable + column defs) |
| `src/components/<Entity>Dialog.tsx` | Pattern from crud-operations skill (useMutation + toast) |
| `src/routes/<entity>page/index.tsx` | `src/routes/teamspage/index.tsx` (useAuth + DataTable) |

### 2.4 Validate after each file

After writing or editing any file, run:

```
npm run check
```

Fix any Biome errors before moving on.

---

## Phase 3 — Test Coverage

Before validation, create necessary tests for the new or modified code. The scope and type of testing depends on what the feature changes.

### 3.1 Determine test type & tools

| If the feature touches... | Write these tests | Tools & hand-off |
|---------------------------|-------------------|------------------|
| **Convex queries or mutations** | API-level tests in `tests/api/<entity>.test.ts`. Mock `ctx.auth.getUserIdentity()` to test auth gating. | Vitest CLI (`npm run test`). Read `testing-patterns` skill for Convex mock patterns. |
| **React components or hooks** | Component unit tests in `tests/unit/components/<Component>.test.tsx` or `tests/unit/hooks/<Hook>.test.ts`. | Vitest + React Testing Library. Read `testing-patterns` skill for patterns and mock data from `src/mocks/`. |
| **Data flow (hook → query → component)** | Integration tests wiring mock Convex API responses through hooks into components. | Vitest + `testing-patterns` skill for `vi.mock("convex/react")` patterns. |
| **Routes or pages with auth/navigation** | Playwright E2E tests in `tests/e2e/`. | **Hand off to `qa-test-to-playwright` skill** — it converts scenarios into Playwright specs using MCP browser tools to discover live locators. Use `playwright_browser_*` tools (snapshot, click, type, navigate) for interactive exploration. Validate with `npx playwright test` CLI. |
| **E2E user flows (CRUD, role gates, empty states)** | Playwright E2E tests in `tests/e2e/`. | **Hand off to `qa-test-to-playwright` skill** for structured conversion. Use `qa-e2e-playwright` skill for running/debugging. Available tools: Playwright MCP browser tools for locator discovery and debugging, Playwright CLI (`npx playwright test`, `--headed`, `--debug`) for execution. |

### 3.2 Read existing tests first

Before writing tests, read neighboring test files for patterns:

```
tests/unit/components/DataTable.test.tsx    — DataTable component tests (Vitest + RTL)
tests/unit/components/PaginationControls.test.tsx — pagination tests (Vitest + RTL)
tests/unit/hooks/usePagination.test.ts      — hook tests (Vitest)
tests/e2e/auth.spec.ts                      — Playwright E2E auth tests
tests/e2e/navigation.spec.ts                — Playwright E2E navigation tests
tests/e2e/pages/*.ts                        — Page Object Model examples
tests/api/*.test.ts                         — API-level Convex tests
```

Mirror the closest test file's structure (describe/it blocks, mock setup, assertions, page objects).

### 3.3 Skill hand-off workflow

For tests that warrant their own dedicated workflow, load the relevant skill:

| Test type | Load this skill | What it provides |
|-----------|----------------|------------------|
| **New Playwright E2E test from scratch** | `qa-test-to-playwright` | Gherkin → step map → MCP browser exploration → generated spec + page objects |
| **Run / debug Playwright tests** | `qa-e2e-playwright` | CLI commands, trace viewer, flaky test debugging, page object templates |
| **Component / hook / API unit tests** | `testing-patterns` | Vitest patterns, Convex mocking, auth mocking, coverage checklist |
| **Edge case identification** | `qa-edge-case-analysis` | Boundary states, error conditions, permission scenarios to add as test cases |

### 3.4 Test coverage expectations

- **Happy path**: At least one test per public function/component verifying the primary success case.
- **Error states**: Test that auth failures, missing data, and invalid inputs produce the expected error.
- **Edge cases**: Empty data, loading states, boundary values (per the ticket's Edge Cases section).
- **No coverage regression**: Existing tests must still pass after adding new tests.
- **For UI tests**: Verify with both `playwright_browser_snapshot` (interactive exploration) and `npx playwright test` (automated run).

### 3.5 Register in todo list

Add test items to the `todowrite` after implementation steps:

```markdown
- [ ] Write unit tests for <entity> — pending
- [ ] Write E2E tests for <entity> — pending (hand off to qa-test-to-playwright)
```

---

## Phase 4 — Common Patterns Quick Reference

### Convex Mutation

```typescript
export const create = mutation({
  args: {
    // required: v.string(), v.id("table"), v.number()
    // optional: v.optional(v.string()), v.optional(v.id("table"))
    // enums: v.union(v.literal("a"), v.literal("b"))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("tableName", {
      ...args,
      // default values for optional fields
      status: args.status ?? "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
```

### Convex Query (paginated)

```typescript
export const list = query({
  args: {
    pagination: v.optional(v.object({
      pageIndex: v.number(),
      pageSize: v.number(),
    })),
    sorting: v.optional(v.object({
      field: v.string(),
      direction: v.union(v.literal("asc"), v.literal("desc")),
    })),
    filtering: v.optional(v.object({
      // entity-specific filters
    })),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db.query("tableName").collect();

    // Apply filters
    if (args.filtering?.someField) {
      items = items.filter((item) => /* condition */);
    }

    // Apply sorting
    if (args.sorting) {
      items.sort((a, b) => { /* ... */ });
    }

    const totalCount = items.length;

    // Apply pagination
    if (args.pagination) {
      const { pageIndex, pageSize } = args.pagination;
      items = items.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
    }

    return { data: items, totalCount };
  },
});
```

### React Hook

```typescript
export function useEntity(initialOptions?: Options) {
  const [currentOptions, setCurrentOptions] = useState<Options>(
    initialOptions || {
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: { field: "name", direction: "asc" },
    },
  );

  const result = useQuery(api.entity.list, currentOptions);
  const isLoading = result === undefined;

  const setPagination = useCallback(
    (pagination: { pageIndex: number; pageSize: number }) => {
      setCurrentOptions((prev) => ({ ...prev, pagination }));
    },
    [],
  );

  const setSorting = useCallback(
    (sorting: { field: string; direction: "asc" | "desc" }) => {
      setCurrentOptions((prev) => ({ ...prev, sorting }));
    },
    [],
  );

  const setFiltering = useCallback(
    (filtering?: Options["filtering"]) => {
      setCurrentOptions((prev) => ({
        ...prev,
        filtering,
        pagination: { pageIndex: 0, pageSize: prev.pagination?.pageSize || 10 },
      }));
    },
    [],
  );

  return {
    data: result?.data || [],
    totalCount: result?.totalCount || 0,
    isLoading,
    setPagination,
    setSorting,
    setFiltering,
    currentOptions,
  };
}
```

### DataTable Column Definition

```typescript
const columns: ColumnDef<EntityType>[] = [
  {
    header: "Name",
    field: "name",
    sortable: true,
    cell: (item) => <span className="font-medium">{item.name}</span>,
  },
  {
    header: "Status",
    field: "status",
    sortable: true,
    cell: (item) => (
      <span className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        item.status === "active" && "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
        item.status === "inactive" && "border border-slate-500/30 bg-slate-500/15 text-slate-300",
      )}>
        {item.status}
      </span>
    ),
  },
];
```

### shadcn Dialog Form

```typescript
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{mode === "create" ? "Create" : "Edit"} Entity</DialogTitle>
    </DialogHeader>
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* form fields */}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

---

## Phase 5 — Validation

### 5.1 Test Coverage Check

Before the acceptance criteria checklist, confirm tests were created per Phase 3 guidelines:
- All happy-path scenarios have tests
- Error states and edge cases are covered
- Existing test suite still passes

### 5.2 Acceptance Criteria Checklist

After implementing all steps, walk through every acceptance criterion from the ticket. Mark each as done or note what's missing.

For each criterion that says "visible only for admins":
- Check that `isAdmin` prop is passed from the route
- Check that the conditionally rendered element uses `isAdmin ?? false`

For each criterion about data display:
- Verify the Convex query returns the correct shape
- Verify the hook transforms the data correctly
- Verify the component renders it

### 5.3 Build Validation

Run these in order. Stop and fix if any fail:

```bash
npm run check    # Biome format + lint
npm run test     # Unit tests
npm run build    # Production build (TS typecheck included)
```

### 5.4 Edge Case Verification

Check the ticket's "Edge Cases" section and verify each one:
- Empty state renders (no data scenario)
- Loading state shows (while query is pending)
- Error state (mutation failure, network error)
- Admin vs non-admin differences (if applicable)
- Boundary values (empty strings, long strings, missing optionals)

---

## Phase 6 — Completion

### 6.1 Report

When done, provide a summary:

```markdown
**Ticket: <name>** ✅ Complete

**Files changed:**
- `convex/<entity>.ts` — added create/update/remove mutations
- `src/hooks/use<Entity>.ts` — created hook
- `src/components/<Entity>Table.tsx` — created table component
- `src/routes/<entity>page/index.tsx` — wired route

**Validation:**
- `npm run check` — ✅ passed
- `npm run test` — ✅ passed
- `npm run build` — ✅ passed

**Acceptance criteria:** 8/8 verified ✅
```

### 6.2 Update todo list

Mark all items completed. If anything was deferred, create a follow-up note.

---

## Notes

- This skill is a workflow orchestrator — it drives the process but delegates technical patterns to sub-skills
- If a prerequisite ticket is not done but is minor, ask the user whether to do it first or proceed
- When in doubt about a pattern, read the actual codebase file rather than guessing
- Run `npm run check` early and often — fix Biome issues immediately
- Never commit unless explicitly asked by the user
- The `_generated` Convex directory auto-updates on `npx convex deploy` — run this after adding new Convex functions
