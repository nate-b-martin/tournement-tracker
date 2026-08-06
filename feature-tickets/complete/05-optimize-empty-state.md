# Feature: Optimize Empty State Positioning and Rendering

## Overview
Improve the user experience by showing the empty state before (or instead of) the table when no data is available, reducing visual clutter and improving perceived performance.

## Current Issue
The current implementation renders:
1. Table container with headers (even when empty)
2. Summary text showing "Showing 0-0 of 0 items"
3. Pagination controls (likely disabled)
4. Empty state message below everything

```typescript
// Current structure:
<div className="container grid space-y-4 mt-3 max-h-1/2">
  {/* Summary - shows "0-0 of 0" */}
  {/* Table - renders with headers but no rows */}
  {/* PaginationControls - appears even when no data */}
  {/* Empty state - at the bottom */}
</div>
```

This is poor UX because:
- Users see a table with headers before seeing the empty message
- Pagination controls are confusing when there's no data
- Summary shows "0—0 of 0" which looks broken

## Implementation Steps

### Step 1: Early Return Pattern
Show empty state instead of table when data is empty:

```typescript
if (isLoading) {
  return <div className="p-4">Loading {itemName}...</div>;
}

if (data.length === 0) {
  return (
    <div className="container grid space-y-4 mt-3">
      <div className="text-center py-12 text-gray-500">
        <div className="text-lg mb-2">{emptyMessage}</div>
        {actions?.canCreate && (
          <Button onClick={actions.onCreate}>
            Create {itemName}
          </Button>
        )}
      </div>
      {debugInfo && <DebugInfo info={debugInfo} />}
    </div>
  );
}
```

### Step 2: Conditional Rendering Pattern
If you prefer keeping the structure but hiding elements:

```typescript
return (
  <div className="container grid space-y-4 mt-3 max-h-1/2">
    {/* Only show summary if we have data */}
    {data.length > 0 && (
      <div className="text-sm text-gray-600 mb-4">
        <span>
          Showing {startIndex}—{endIndex} of {totalCount} {itemName}
        </span>
        {totalPages > 1 && (
          <span className="ml-4 text-gray-500">
            (Page {currentPage + 1} of {totalPages})
          </span>
        )}
      </div>
    )}

    {/* Empty state replaces table when no data */}
    {data.length === 0 ? (
      <div className="text-center py-12 text-gray-500 border rounded-md">
        <div className="text-lg mb-2">{emptyMessage}</div>
        {actions?.canCreate && (
          <Button variant="default" onClick={actions.onCreate}>
            Create {itemName}
          </Button>
        )}
      </div>
    ) : (
      <div className="rounded-md border max-h-full overflow-y-auto">
        <Table className="text-table-default">
          {/* ... table content ... */}
        </Table>
      </div>
    )}

    {/* Only show pagination if we have data */}
    {data.length > 0 && (
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalCount={totalCount}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    )}

    {debugInfo && <DebugInfo info={debugInfo} />}
  </div>
);
```

### Step 3: Enhanced Empty State Component
Create a reusable EmptyState component:

```typescript
// src/components/EmptyState/EmptyState.tsx
import { Button } from "@/components/ui/button";
import { PackageX } from "lucide-react"; // or any icon

interface EmptyStateProps {
  title?: string;
  description?: string;
  itemName?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  title = "No items found",
  description,
  itemName,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-gray-50/50">
      <PackageX className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        {itemName ? `No ${itemName} found` : title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 mb-4 max-w-sm text-center">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

Usage:
```typescript
{data.length === 0 ? (
  <EmptyState
    itemName={itemName}
    action={
      actions?.canCreate
        ? { label: `Create ${itemName}`, onClick: actions.onCreate }
        : undefined
    }
  />
) : (
  <Table>...</Table>
)}
```

## Acceptance Criteria
- [ ] Empty state is the primary visible element when no data exists
- [ ] Table headers don't appear when data is empty
- [ ] Summary showing "0—0 of 0" is hidden when empty
- [ ] Pagination controls are hidden when no data
- [ ] Empty state message is clear and actionable
- [ ] Optional: Add create button to empty state if `actions.canCreate` is true
- [ ] Debug info still appears when empty state is shown

## UX Considerations
- Empty state should be visually prominent and centered
- Consider adding an icon to make it more visually appealing
- If there's a "create" action, surface it in the empty state
- Keep the same container/wrapper so spacing remains consistent

## Testing Considerations
- Test with empty data array
- Test with null/undefined data
- Test loading state followed by empty state
- Test empty state to data state transition
- Verify debug info appears in empty state

## Related Files
- `src/components/DataTable/DataTable.tsx`
- Potentially new file: `src/components/EmptyState/EmptyState.tsx`
- `src/components/ui/button.tsx`

## Helpful Resources

### UX Patterns
- [Empty State Patterns](https://www.nngroup.com/articles/empty-state/)
- [Material Design Empty States](https://m3.material.io/components/empty-states/overview)
- [When to Show Empty States](https://blog.logrocket.com/designing-empty-states-react/)

### React Conditional Rendering
- [Conditional Rendering](https://react.dev/learn/conditional-rendering)
- [Guard Clauses](https://javascript.info/function-basics#return-value)

## Notes
- Consider the user's journey - what do they want to do when they see empty state?
- If there's a create action, make it prominent in the empty state
- Keep empty state styling consistent with your design system
- Test accessibility - empty state should be readable by screen readers
