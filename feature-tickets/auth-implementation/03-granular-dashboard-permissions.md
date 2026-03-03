# Phase 3 Update: Granular Dashboard Permissions

## Overview
Allow signed-in non-admin users to view the dashboard while restricting edit/delete actions to admins only.

## Current State
- Phase 3 route protection implemented
- `/dashboard` is fully protected - only admins can access
- `ProtectedRoute` with `requireAdmin={true}` blocks all non-admins

## Problem
Currently, non-admin users cannot access the dashboard at all. However, they should be able to view the dashboard data (stats, tables) but be restricted from edit/delete actions.

## Implementation Steps

### Step 1: Update Dashboard Route Protection
Modify `src/routes/dashboard/index.tsx` to allow signed-in users (not just admins):

```typescript
<ProtectedRoute requireAdmin={false}>
  {/* Dashboard content */}
</ProtectedRoute>
```

### Step 2: Add isAdmin Prop to PlayersTable
Modify `src/components/PlayersTable.tsx`:

```typescript
interface PlayersTableProps {
  initialOptions?: PlayerListOptions;
  isAdmin?: boolean;  // NEW PROP
}

// Update actions prop to use isAdmin:
actions={{
  canEdit: isAdmin ?? false,
  canDelete: isAdmin ?? false,
  onEdit: handleEdit,
  onDelete: handleDelete,
}}
```

### Step 3: Pass isAdmin from Dashboard to PlayersTable
Modify `src/routes/dashboard/index.tsx`:

```typescript
import { useAuth } from "@/hooks/useAuth";

function DashboardPageComponent() {
  const { isAdmin } = useAuth();
  
  return (
    <ProtectedRoute requireAdmin={false}>
      {/* ... existing stats cards ... */}
      
      <PlayersTable 
        isAdmin={isAdmin}
        initialOptions={{...}}
      />
    </ProtectedRoute>
  );
}
```

### Step 4: (Optional) Add Visual Indicator for Non-Admins
Add a subtle banner or badge for non-admin users:

```tsx
{!isAdmin && (
  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
    <p className="text-sm text-yellow-600">
      Viewing as spectator. Contact an admin to make changes.
    </p>
  </div>
)}
```

## User Experience

| User State | Dashboard Access | Edit/Delete |
|------------|-----------------|-------------|
| Signed out | Blocked (Auth Required) | N/A |
| Signed in (non-admin) | Viewable | Disabled/Hidden |
| Signed in (admin) | Full access | Enabled |

## Acceptance Criteria
- [ ] Signed-out users see "Authentication Required" on dashboard
- [ ] Signed-in non-admins can view dashboard content
- [ ] Edit/Delete buttons are hidden or disabled for non-admins
- [ ] Admin users see full dashboard with working action buttons
- [ ] No console errors when rendering as non-admin

## Related Files
- `src/routes/dashboard/index.tsx` - MODIFY - Update protection and pass isAdmin
- `src/components/PlayersTable.tsx` - MODIFY - Add isAdmin prop
- `src/components/ProtectedRoute.tsx` - Already supports `requireAdmin={false}`

## Notes
- This aligns with Phase 5 (Public Pages) which also handles conditional admin UI
- Consider creating a reusable pattern for other tables that may need this
- Could extend PlayersTable to accept a more flexible `permissions` object for future roles (organizer, player, etc.)
