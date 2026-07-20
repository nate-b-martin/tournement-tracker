# Feature 16: Season Hooks — useSeasons, useSeasonTeams ✅ Complete

## Overview
Create React hooks for consuming season data on the frontend. Follows the established patterns in `useTournaments.ts` and `useTeams.ts` with pagination, sorting, filtering via `useQuery`.

## Prerequisites
- [x] Ticket 15 — Convex functions for seasons and seasonTeams must be deployed

## Implementation Steps

### Step 1: Create `src/hooks/useSeasons.ts`

Follow the exact pattern from `src/hooks/useTournaments.ts`:

```typescript
export type SeasonWithMeta = Doc<"seasons">;

export interface SeasonListOptions {
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  sorting?: {
    field: string;
    direction: "asc" | "desc";
  };
  filtering?: {
    search?: string;
    status?: string[];
    sport?: string;
  };
}

export function useSeasons(initialOptions?: SeasonListOptions) {
  // State management for pagination, sorting, filtering
  // useQuery for api.seasons.list
  // useQuery for api.seasons.count
  // Returns: { seasons, totalCount, isLoading, setPagination, setSorting, setFiltering, currentOptions }
}
```

Export additional utilities:
- `useSeasonById(id: string | undefined)` — single season query
- `useSeasonCount()` — total season count

### Step 2: Create `src/hooks/useSeasonTeams.ts`

```typescript
export function useSeasonTeams(seasonId: string | undefined) {
  // useQuery for api.seasonTeams.listBySeason
  // Handles "skip" when seasonId is undefined
  // Returns: { teams, isLoading }
}
```

## Acceptance Criteria
- [x] `src/hooks/useSeasons.ts` created with useSeasons, useSeasonById, useSeasonCount
- [x] `src/hooks/useSeasonTeams.ts` created with useSeasonTeams
- [x] useSeasons manages pagination, sorting, filtering state with useCallback
- [x] useSeasons dispatches changes to filters resets page index to 0
- [x] useSeasonTeams uses `"skip"` pattern for undefined seasonId
- [x] All hooks use proper TypeScript types from `../../convex/_generated/dataModel`
- [x] isLoading correctly checks for undefined query results
- [x] Hooks return sensible defaults when data is undefined (empty arrays, 0 count)

## Related Files
- `src/hooks/useSeasons.ts` — NEW
- `src/hooks/useSeasonTeams.ts` — NEW

## Dependency
- Blocked by Ticket 15 (Convex functions must exist)

## Helpful Resources
- Reference: `src/hooks/useTournaments.ts` — exact pattern to follow
- Reference: `src/hooks/useTeams.ts` — team-specific query patterns
- [Convex React useQuery](https://docs.convex.dev/react/react-query#usequery)

## Notes
- Use the `"skip"` pattern (`id ? { id } : "skip"`) for conditional queries
- Keep hooks focused on data fetching — no component logic
- Export types (SeasonWithMeta, SeasonListOptions) for use in components
- Sorting fields should match the Convex seasons table field names
