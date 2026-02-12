# Feature: Stabilize Callback Functions with useCallback

## Overview
Prevent unnecessary re-renders of child components by memoizing callback functions using React's `useCallback` hook.

## Current Issue
The `handleHeaderClick` function is recreated on every render, which could cause:
- Unnecessary re-renders of table header cells
- Breaking of React's diffing algorithm optimizations
- Memory churn from function creation

## Implementation Steps

### Step 1: Identify Callbacks to Memoize
The following callbacks should be memoized:
1. `handleHeaderClick` - header click handler for sorting
2. `onPageChange` - passed to PaginationControls
3. `onPageSizeChange` - passed to PaginationControls

### Step 2: Add useCallback for handleHeaderClick
```typescript
const handleHeaderClick = useCallback(
  (column: ColumnDef<T>) => {
    if (!column.sortable || !onSort) return;
    onSort(column.field);
  },
  [onSort]
);
```

### Step 3: Create Memoized Pagination Handlers
```typescript
const handlePageChange = useCallback(
  (page: number) => {
    onPaginationChange({ pageIndex: page, pageSize });
  },
  [onPaginationChange, pageSize]
);

const handlePageSizeChange = useCallback(
  (size: number) => {
    onPaginationChange({ pageIndex: 0, pageSize: size });
  },
  [onPaginationChange]
);
```

### Step 4: Update JSX to Use New Handlers
Replace inline arrow functions in JSX:
```typescript
// Before:
onPageChange={(page) => onPaginationChange({ pageIndex: page, pageSize })}
onPageSizeChange={(size) => onPaginationChange({ pageIndex: 0, pageSize: size })}

// After:
onPageChange={handlePageChange}
onPageSizeChange={handlePageSizeChange}
```

## Acceptance Criteria
- [ ] `handleHeaderClick` uses `useCallback`
- [ ] Pagination change handlers use `useCallback`
- [ ] All dependency arrays are correctly specified
- [ ] No console warnings about missing dependencies
- [ ] Sorting still works correctly
- [ ] Pagination controls still function properly

## ESLint Configuration
Make sure your ESLint config includes the React Hooks rules:
```json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

## Testing Considerations
- Verify callbacks maintain referential equality across renders
- Test that sorting and pagination still function correctly
- Check that child components (TableHead, PaginationControls) don't re-render unnecessarily

## Related Files
- `src/components/DataTable/DataTable.tsx`
- `src/components/PaginationControls/PaginationControls.tsx` (verify it accepts memoized callbacks)

## Helpful Resources

### React Documentation
- [React useCallback Hook](https://react.dev/reference/react/useCallback)
- [useCallback vs useMemo](https://react.dev/reference/react/useCallback#how-is-usecallback-related-to-usememo)
- [Optimizing React Renders](https://react.dev/learn/render-and-commit)

### Best Practices
- [When to use useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)
- [A Complete Guide to useCallback](https://blog.logrocket.com/react-usecallback-hook/)

### Anti-patterns to Avoid
- Don't wrap every function in useCallback - only memoize when:
  - The function is passed to a memoized child component
  - The function is used in a dependency array of another hook
  - The function creation is genuinely expensive

## Notes
- Always include the exhaustive-deps lint rule to catch missing dependencies
- If `onPaginationChange` or `onSort` are unstable (defined inline in parent), memoization won't help - consider stabilizing them in the parent component too
