# Feature: Consolidate Pagination Logic with Custom Hook

## Overview
Extract pagination-related calculations into a reusable custom hook for better code organization, reusability, and readability. This is a code structure improvement, not a performance optimization.

## Current Issue
Pagination values are computed individually throughout the component:
```typescript
const currentPage = pagination.pageIndex;
const pageSize = pagination.pageSize;
const totalPages = Math.ceil(totalCount / pageSize) || 1;
const startIndex = totalCount === 0 ? 0 : currentPage * pageSize + 1;
const endIndex = Math.min((currentPage + 1) * pageSize, totalCount);
const hasNextPage = (currentPage + 1) * pageSize < totalCount;
const hasPreviousPage = currentPage > 0;
```

This approach:
- Scatters related logic across the component
- Makes it harder to see all pagination state at once
- Can't be reused in other components
- Duplicate logic if pagination is needed elsewhere

## Implementation Steps

### Step 1: Create Pagination Hook
Create a custom hook to compute all pagination values:

```typescript
// src/hooks/usePagination.ts
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  itemCount: number;
}

export function usePagination(
  totalCount: number,
  pageIndex: number,
  pageSize: number
): PaginationState {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
  const endIndex = Math.min((pageIndex + 1) * pageSize, totalCount);
  const hasNextPage = endIndex < totalCount;
  const hasPreviousPage = pageIndex > 0;

  return {
    currentPage: pageIndex,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
    itemCount: totalCount,
  };
}
```

### Step 2: Use the Hook in DataTable
Replace individual variable declarations:

```typescript
// Before:
const currentPage = pagination.pageIndex;
const pageSize = pagination.pageSize;
const totalPages = Math.ceil(totalCount / pageSize) || 1;
// ... more calculations

// After:
const paginationState = usePagination(
  totalCount,
  pagination.pageIndex,
  pagination.pageSize
);
```

### Step 3: Update JSX to Use Hook Results
```typescript
// Before:
<span>Showing {startIndex}—{endIndex} of {totalCount}</span>
<PaginationControls
  currentPage={currentPage}
  totalPages={totalPages}
  // ...
/>

// After:
<span>Showing {paginationState.startIndex}—{paginationState.endIndex} of {totalCount}</span>
<PaginationControls
  currentPage={paginationState.currentPage}
  totalPages={paginationState.totalPages}
  // ...
/>
```

## Acceptance Criteria
- [ ] Pagination logic extracted to reusable `usePagination` hook
- [ ] Hook properly typed with TypeScript interface
- [ ] DataTable uses the new hook instead of inline calculations
- [ ] All pagination features still work correctly
- [ ] Edge cases handled (empty data, single page, last page)
- [ ] Code is more readable and organized

## Edge Cases to Handle
- Empty data set (`totalCount === 0`)
- Single page of data
- Last page with partial results
- Page size larger than total count
- Zero or negative page size (should be validated)

## Testing Considerations
- Test with various page sizes (10, 25, 50, 100)
- Test with data counts: 0, 1, exact multiples of page size, non-multiples
- Test navigation to last page
- Test edge cases around page boundaries
- Verify hook can be used in other components

## Related Files
- `src/components/DataTable/DataTable.tsx`
- New file: `src/hooks/usePagination.ts`
- `src/components/PaginationControls/PaginationControls.tsx`

## Helpful Resources

### Custom Hooks
- [Building Your Own Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Rules of Hooks](https://react.dev/warnings/invalid-hook-call-warning)

### Pagination Patterns
- [TanStack Table Pagination](https://tanstack.com/table/latest/docs/guide/pagination)
- [Cursor vs Offset Pagination](https://www.moesif.com/blog/technical/api-development/cursor-based-pagination-vs-offset-based-pagination/)

## Notes
- This is a code organization improvement, not a performance optimization
- The hook intentionally does NOT use useMemo - these are cheap calculations
- Extracting to a separate hook file makes the logic reusable across components
- Consider adding validation/normalization for edge cases (negative page numbers, etc.)
- The `Math.max(1, ...)` ensures totalPages is at least 1, which is better UX than showing "Page 1 of 0"
