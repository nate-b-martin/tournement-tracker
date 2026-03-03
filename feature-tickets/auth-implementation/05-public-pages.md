# Phase 5: Public Pages - Conditional Admin UI

## Overview
Update public-facing pages (Players, Teams, Tournaments) to hide edit/delete actions for non-admin users while maintaining full read access. Add visual indicators to clarify view-only mode.

## Current State
- Public pages show all data without authentication
- Edit/delete buttons visible to all users
- No indication of user's permission level
- No way to conditionally render admin-only features

## Implementation Steps

### Step 5.1: Update Players Page
Modify `src/routes/playerspage/index.tsx`:

```typescript
import { useAuth } from "../../hooks/useAuth";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Eye } from "lucide-react";

export const Route = createFileRoute("/playerspage/")({
  component: PlayersPage,
});

function PlayersPage() {
  const { isAdmin, isSignedIn } = useAuth();
  const players = useQuery(api.players.list);
  
  // Add admin-only actions to DataTable
  const actions = isAdmin ? {
    canEdit: true,
    canDelete: true,
    onEdit: (player) => { /* ... */ },
    onDelete: (player) => { /* ... */ },
  } : undefined;
  
  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Players</h1>
          <p className="text-muted-foreground">
            Manage tournament participants
          </p>
        </div>
        
        {/* Admin-only add button */}
        {isAdmin && (
          <Button onClick={() => setShowAddModal(true)}>
            + Add Player
          </Button>
        )}
      </div>
      
      {/* View-only indicator for signed-in non-admins */}
      {isSignedIn && !isAdmin && (
        <Alert className="mb-4 bg-gray-800 border-gray-700">
          <Eye className="h-4 w-4" />
          <AlertTitle>View Only Mode</AlertTitle>
          <AlertDescription>
            You can view player information but cannot make changes.
            Contact an admin to add or edit players.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Data table with conditional actions */}
      <DataTable
        data={players}
        columns={playerColumns}
        actions={actions}
      />
    </div>
  );
}
```

### Step 5.2: Update Teams Page
Modify `src/routes/teamspage/index.tsx`:

```typescript
import { useAuth } from "../../hooks/useAuth";

export const Route = createFileRoute("/teamspage/")({
  component: TeamsPage,
});

function TeamsPage() {
  const { isAdmin, isSignedIn } = useAuth();
  const teams = useQuery(api.teams.list);
  
  // Define columns with conditional actions
  const columns = useMemo(() => [
    { header: "Team Name", accessorKey: "name" },
    { header: "Coach", accessorKey: "coachName" },
    { header: "Status", accessorKey: "status" },
    // Actions column only for admins
    ...(isAdmin ? [{
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleEdit(row.original)}
          >
            Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => handleDelete(row.original)}
          >
            Delete
          </Button>
        </div>
      ),
    }] : []),
  ], [isAdmin]);
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Teams</h1>
        {isAdmin && (
          <Button onClick={() => setShowAddModal(true)}>
            + Add Team
          </Button>
        )}
      </div>
      
      {isSignedIn && !isAdmin && (
        <Alert className="mb-4" variant="info">
          <Eye className="h-4 w-4" />
          <AlertDescription>
            View-only access. Contact an admin to manage teams.
          </AlertDescription>
        </Alert>
      )}
      
      <DataTable data={teams} columns={columns} />
    </div>
  );
}
```

### Step 5.3: Update Tournaments Page
Modify `src/routes/tournamentspage/index.tsx`:

```typescript
import { useAuth } from "../../hooks/useAuth";

export const Route = createFileRoute("/tournamentspage/")({
  component: TournamentsPage,
});

function TournamentsPage() {
  const { isAdmin, isSignedIn } = useAuth();
  const tournaments = useQuery(api.tournaments.list);
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tournaments</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Manage your tournaments" 
              : "Browse upcoming tournaments"
            }
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreateModal(true)}>
            + Create Tournament
          </Button>
        )}
      </div>
      
      {/* Grid of tournament cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tournaments?.map((tournament) => (
          <TournamentCard
            key={tournament._id}
            tournament={tournament}
            isAdmin={isAdmin}
            onEdit={isAdmin ? handleEdit : undefined}
            onDelete={isAdmin ? handleDelete : undefined}
          />
        ))}
      </div>
      
      {isSignedIn && !isAdmin && (
        <div className="mt-6 p-4 bg-gray-800 rounded-lg text-center">
          <Eye className="h-5 w-5 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-400">
            View-only mode. Sign in as an admin to create tournaments.
          </p>
        </div>
      )}
    </div>
  );
}

// Tournament card component with conditional actions
function TournamentCard({ tournament, isAdmin, onEdit, onDelete }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{tournament.name}</CardTitle>
        <CardDescription>{tournament.sport}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Status: {tournament.status}</p>
        <p>Teams: {tournament.currentTeamCount}/{tournament.maxTeams}</p>
      </CardContent>
      {isAdmin && (
        <CardFooter className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit?.(tournament)}>
            Manage
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete?.(tournament)}>
            Delete
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
```

### Step 5.4: Update Homepage Stats
Modify `src/routes/index.tsx` to show admin prompts:

```typescript
function HomePage() {
  const { isAdmin, isSignedIn } = useAuth();
  
  return (
    <div className="p-6">
      {/* Existing stats cards */}
      <StatsSection />
      
      {/* Admin quick actions */}
      {isAdmin && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Admin Quick Actions</h2>
          <div className="flex gap-4">
            <Button asChild>
              <Link to="/dashboard">Open Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/playerspage">Manage Players</Link>
            </Button>
          </div>
        </div>
      )}
      
      {/* Non-admin sign-in prompt */}
      {!isSignedIn && (
        <div className="mt-8 p-6 bg-gray-800 rounded-lg text-center">
          <h3 className="text-lg font-semibold mb-2">Tournament Administrator?</h3>
          <p className="text-gray-400 mb-4">
            Sign in to manage tournaments, teams, and players.
          </p>
          <SignInButton mode="modal">
            <Button>Sign In</Button>
          </SignInButton>
        </div>
      )}
    </div>
  );
}
```

### Step 5.5: Create Reusable ViewOnlyAlert Component
Create `src/components/ViewOnlyAlert.tsx` for consistent messaging:

```typescript
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Eye } from "lucide-react";

interface ViewOnlyAlertProps {
  resourceName: string;
}

export function ViewOnlyAlert({ resourceName }: ViewOnlyAlertProps) {
  return (
    <Alert className="mb-4 bg-gray-800/50 border-gray-700">
      <Eye className="h-4 w-4 text-gray-400" />
      <AlertTitle className="text-gray-200">View Only Mode</AlertTitle>
      <AlertDescription className="text-gray-400">
        You can view {resourceName} but cannot make changes. 
        Contact an admin if you need to add or edit {resourceName}.
      </AlertDescription>
    </Alert>
  );
}
```

## Acceptance Criteria
- [ ] `src/routes/playerspage/index.tsx` hides edit/delete for non-admins
- [ ] `src/routes/teamspage/index.tsx` hides admin actions for non-admins
- [ ] `src/routes/tournamentspage/index.tsx` hides admin actions for non-admins
- [ ] View-only alert shown for signed-in non-admins on each page
- [ ] Admin buttons (Add, Edit, Delete) only visible to admins
- [ ] Homepage shows admin quick actions for admins
- [ ] Homepage shows sign-in prompt for unauthenticated users
- [ ] All pages remain publicly accessible (no auth required to view)
- [ ] UI is clear about why actions are unavailable
- [ ] No broken layouts when admin buttons are hidden
- [ ] Consistent messaging across all pages

## Testing Considerations
- Test all three pages as unauthenticated user (no alerts shown)
- Test as signed-in non-admin (view-only alerts shown)
- Test as admin (all actions visible)
- Verify actions work correctly when visible
- Check responsive layout with/without action buttons
- Test empty states for all permission levels
- Verify no console errors when conditionally rendering

## Related Files
- `src/routes/playerspage/index.tsx` - MODIFY
- `src/routes/teamspage/index.tsx` - MODIFY  
- `src/routes/tournamentspage/index.tsx` - MODIFY
- `src/routes/index.tsx` - MODIFY - Admin prompts
- `src/components/ViewOnlyAlert.tsx` - NEW - Reusable alert
- `src/hooks/useAuth.ts` - Dependency
- `src/components/ui/alert.tsx` - Alert component

## Helpful Resources

### Conditional Rendering
- [React Conditional Rendering](https://react.dev/learn/conditional-rendering)
- [Truthy/Falsy in JavaScript](https://developer.mozilla.org/en-US/docs/Glossary/Truthy)

### UX Patterns
- [Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [Empty States](https://www.nngroup.com/articles/empty-state-interface-design/)

## Notes
- Public read access is intentional - encourages tournament discovery
- View-only alerts help users understand their permissions
- Consider subtle visual difference for disabled vs hidden buttons
- Admin quick actions on homepage improve workflow efficiency
- Keep messaging consistent across pages ("View Only Mode")
- Use subtle styling for view-only alerts (don't distract from content)
- Test with screen readers to ensure alerts are announced
- Future: Could show "Request Access" button for non-admins
