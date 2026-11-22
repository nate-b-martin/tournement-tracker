# Feature: Simplify Actions Column Construction

## Overview
Refactor the actions column logic to be more readable, type-safe, and maintainable by extracting it into a cleaner pattern.

## Current Issue
The current implementation:
- Uses a type assertion (`as ColumnDef<T>`) which bypasses TypeScript safety
- Mixes conditional logic with JSX construction inline
- Creates the actions column object inside the conditional spread
- Harder to read and maintain

Current code:
```typescript
const allColumns = actions?.canEdit || actions?.canDelete ? [
  ...columns,
  {
    header: "Actions",
    field: "actions",
    sortable: false,
    cell: (item: T) => (
      // JSX here
    ),
  } as ColumnDef<T>, // Type assertion needed
] : columns;
```

## Implementation Steps

### Step 1: Create Actions Column Builder Function
Create a helper function to build the actions column:

```typescript
const buildActionsColumn = <T extends { _id: string }>(
  actions: DataTableProps<T>['actions']
): ColumnDef<T> | null => {
  if (!actions?.canEdit && !actions?.canDelete) {
    return null;
  }

  return {
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
  };
};
```

### Step 2: Use Helper with Array Concatenation
```typescript
const actionsColumn = buildActionsColumn(actions);
const allColumns = actionsColumn ? [...columns, actionsColumn] : columns;
```

### Step 3: Alternative - Inline with Type Safety
If you prefer keeping it inline, structure it cleanly:

```typescript
const allColumns = useMemo(() => {
  const shouldShowActions = actions?.canEdit || actions?.canDelete;
  
  if (!shouldShowActions) {
    return columns;
  }

  const actionsColumn: ColumnDef<T> = {
    header: "Actions",
    field: "actions",
    sortable: false,
    cell: (item: T) => (
      <div className="flex gap-2">
        {actions?.canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => actions.onEdit?.(item)}
          >
            Edit
          </Button>
        )}
        {actions?.canDelete && (
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
  };

  return [...columns, actionsColumn];
}, [columns, actions]);
```

### Step 4: Optional - Extract to Separate Component
For even better separation of concerns:

```typescript
// ActionsCell.tsx
interface ActionsCellProps<T> {
  item: T;
  actions: {
    canEdit?: boolean;
    canDelete?: boolean;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
  };
}

function ActionsCell<T>({ item, actions }: ActionsCellProps<T>) {
  return (
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
  );
}
```

Then use it in DataTable:
```typescript
const actionsColumn: ColumnDef<T> = {
  header: "Actions",
  field: "actions",
  sortable: false,
  cell: (item) => <ActionsCell item={item} actions={actions} />,
};
```

## Acceptance Criteria
- [ ] No type assertions (`as ColumnDef<T>`) needed
- [ ] Actions column logic is separated from rendering logic
- [ ] Code is more readable and maintainable
- [ ] TypeScript compiles without errors
- [ ] Edit/Delete buttons still appear when actions are enabled
- [ ] Click handlers still work correctly

## Testing Considerations
- Test with only canEdit enabled
- Test with only canDelete enabled
- Test with both enabled
- Test with neither enabled (no actions column)
- Verify TypeScript types are correct

## Related Files
- `src/components/DataTable/DataTable.tsx`
- `src/components/DataTable/types.ts`
- Potentially new file: `src/components/DataTable/ActionsCell.tsx`

## Helpful Resources

### TypeScript Patterns
- [TypeScript Generics Guide](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [Type Guards and Type Assertions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

### React Component Composition
- [Thinking in React](https://react.dev/learn/thinking-in-react)
- [Component Composition Patterns](https://react.dev/learn/passing-data-to-the-component)

## Notes
- Extracting to a separate component is optional but recommended for larger codebases
- Keep the cell render function simple - avoid complex logic inline
- Focus on type safety and readability, not premature optimization
