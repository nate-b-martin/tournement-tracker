# Feature: Memoize Derived Values in DataTable

## Overview
Optimize the DataTable component by memoizing expensive computations that are recalculated on every render, specifically pagination values and the columns array.

## Current Issue
The following values are recomputed on every render, even when their dependencies haven't changed:
- `totalPages` calculation
- `startIndex` calculation  
- `endIndex` calculation
- `hasNextPage` / `hasPreviousPage` booleans
- `allColumns` array (especially when actions are present)

## Implementation Steps

### Step 1: Identify Dependencies
The pagination calculations depend on:
- `totalCount`
- `pagination.pageIndex`
- `pagination.pageSize`

The `allColumns` depends on:
- `columns`
- `actions.canEdit`
- `actions.canDelete`

### Step 2: Add useMemo for Pagination Values
```typescript
const paginationInfo = useMemo(() => {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = totalCount === 0 ? 0 : currentPage * pageSize + 1;
  const endIndex = Math.min((currentPage + 1) * pageSize, totalCount);
  const hasNextPage = (currentPage + 1) * pageSize < totalCount;
  const hasPreviousPage = currentPage > 0;
  
  return {
    totalPages,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage
  };
}, [totalCount, currentPage, pageSize]);
```

### Step 3: Add useMemo for allColumns
```typescript
const allColumns = useMemo(() => {
  if (!actions?.canEdit && !actions?.canDelete) {
    return columns;
  }
  
  return [
    ...columns,
    {
      header: "Actions",
      field: "actions",
      sortable: false,
      cell: (item: T) => (
        <div className="flex gap-2">
          {actions.canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.onEdit?.(item)}
            >
              Edit
            </Button>
          )}
          {actions.canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.onDelete?.(item)}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];
}, [columns, actions]);
```

### Step 4: Destructure from useMemo Results
Update component to use `paginationInfo.totalPages`, `paginationInfo.startIndex`, etc.

## Acceptance Criteria
- [ ] All pagination calculations use `useMemo`
- [ ] `allColumns` construction uses `useMemo`
- [ ] Component still functions correctly with sorting, pagination, and actions
- [ ] No console errors or warnings
- [ ] Tests pass if they exist

## Testing Considerations
- Verify pagination updates when `totalCount` changes
- Verify columns update when `actions` prop changes
- Ensure re-renders don't cause unnecessary recomputations (React DevTools Profiler)

## Related Files
- `src/components/DataTable/DataTable.tsx`
- `src/components/DataTable/types.ts` (if type changes needed)

## Helpful Resources

### React Documentation
- [React useMemo Hook](https://react.dev/reference/react/useMemo)
- [React.memo](https://react.dev/reference/react/memo)
- [React Optimization Guide](https://react.dev/learn/thinking-in-react)

### Performance Patterns
- [Kent C. Dodds - Memoization](https://kentcdodds.com/blog/fix-the-slow-render-before-you-fix-the-re-render)
- [React Performance Optimization](https://www.patterns.dev/posts/react-memo)

### TanStack Table (for reference)
- [TanStack Table React Guide](https://tanstack.com/table/latest/docs/guide/introduction)

## Notes
- Only memoize if the computation is expensive or the dependency array is stable
- Avoid premature optimization - profile first to confirm these are actual bottlenecks
- The `allColumns` memo is especially important as it includes JSX elements
