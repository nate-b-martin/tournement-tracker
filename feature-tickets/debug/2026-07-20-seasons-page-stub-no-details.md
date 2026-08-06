---
created: 2026-07-20
source: qa-playwright-workflow-explorer
sourceTicket: feature-tickets/Enhancments/ideas.md (line 17)
priority: P1
status: closed
resolved: 2026-08-05
---

# Debug: Seasons Page — Stub shows no season details

## Scenario Attempted

```gherkin
Scenario: Seasons page
Given user is on Seasons page
Then user can see all season details
```

## Action Plan

| # | Type | Detail |
|---|------|--------|
| 1 | Role | Authenticated as admin (default) |
| 2 | Navigate | `/seasonspage` |
| 3 | Assert | heading "Seasons" is visible |
| 4 | Assert | paragraph "Browse and manage seasons" is visible |
| 5 | Assert | season listing entries are visible (table/cards of seasons) |

## Failure Evidence

### Source Code — Route Stub

`src/routes/seasonspage/index.tsx` (line 1-14):
```tsx
function SeasonsPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Seasons</h1>
      <p className="text-muted-foreground mt-1">Browse and manage seasons</p>
    </div>
  );
}
```

The page is a stub — only renders a heading and sub-heading. No data fetching, no table/card listing, no links to season detail pages.

### Matching Documentation in ideas.md

This exact issue is already documented in `feature-tickets/Enhancments/ideas.md` (line 17-22):
```
Scenario: Seasons page
Given user is on Seasons page
Then user can see all season details

Actual outcome: Only see text " Seasons " header and paragraph "Browse and mange seasons"
no other details on page
```

### Available Infrastructure (ready to use)

| Resource | Status |
|----------|--------|
| `useSeasons()` hook | ✅ Fully implemented with pagination/sorting/filtering |
| `api.seasons.list` query | ✅ Paginated, sorted, filterable query |
| `api.seasons.count` query | ✅ Total count available |
| `SeasonDetailPage` at `/seasons/$id` | ✅ Fully implemented with tabs, info cards |
| `SeasonDialog` component | ✅ Create/edit modal |
| `Navigation.seasonsLink` locator | ✅ Already navigates to `/seasonspage` |
| Seed data for seasons | ❌ Missing — no seasons seeded in `convex/seed.ts` |

## Investigation Notes

### What Works
- [x] Route `/seasonspage/` resolves correctly (SSR renders route match)
- [x] Auth wrapper renders (page is behind Convex/Clerk provider)
- [x] Navigation link "Seasons" exists in sidebar

### What Fails
- [ ] Step 3: No season data is fetched or displayed on the page
- [ ] Expected: Table or card listing showing all seasons with names, sports, statuses, dates
- [ ] Actual: Only static heading + paragraph rendered

## Suspected Root Causes

- [ ] **Missing feature**: The seasons listing page was never implemented beyond a stub placeholder
- [x] **Data dependency**: Even if implemented, no seed data exists for seasons

## Next Steps

1. [ ] Implement the Seasons listing page at `/seasonspage/`:
   - Import and use `useSeasons()` hook
   - Display seasons in a table (matching `SeasonDetailPage` design patterns)
   - Each row links to `/seasons/$id`
   - Add empty state when no seasons exist ("No seasons created yet" with CTA)
   - Add loading skeleton state
2. [ ] Add seasons seed data to `convex/seed.ts`
3. [ ] Update `clearAllData` mutation to include seasons/seasonTeams/seasonGames
4. [ ] Write Playwright E2E tests for the seasons listing page
5. [ ] Run `npm run check` and `npx playwright test`

## Resolution

Resolved 2026-08-05. `src/routes/seasonspage/index.tsx` now renders `<SeasonsTable />`, a fully
implemented data table (search, filters, pagination) with rows linking to `/seasons/$id` detail
pages. E2E coverage exists in `tests/e2e/seasons.spec.ts`. Verified in code and marked closed.

## Implementation Reference

The `useSeasons()` hook provides:
```typescript
const { seasons, totalCount, isLoading, setPagination, setSorting, setFiltering } = useSeasons();
// seasons: SeasonWithMeta[]  (Doc<"seasons">[])
// totalCount: number
// isLoading: boolean
```

Example seed data needed in `convex/seed.ts`:
```typescript
await ctx.db.insert("seasons", {
  name: "Spring 2026",
  sport: "Soccer",
  startDate: Date.parse("2026-03-01"),
  endDate: Date.parse("2026-06-30"),
  status: "active",
  organizerId: adminIdentity.subject,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
```
