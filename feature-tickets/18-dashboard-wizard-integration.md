# Feature 18: Dashboard & Homepage Integration — Wizard Launch Buttons

## Overview
Add "Setup Wizard" entry points on the Dashboard (primary) and Homepage (secondary) so admins can launch the multi-step creation flow. Also add a "Seasons" navigation link to the sidebar.

## Prerequisites
- [ ] Ticket 17 — Setup Wizard component must be built

## Implementation Steps

### Step 1: Add Setup Wizard to Dashboard (`src/routes/dashboard/index.tsx`)

Add a new admin-only card section to the dashboard, positioned after the stat cards and before the data tables:

```typescript
// New "Quick Setup" Card
<Card className="col-span-full">
  <CardHeader>
    <CardTitle>Quick Setup Wizard</CardTitle>
    <CardDescription>
      Create a complete season with teams, players, and tournament in one guided flow.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Button onClick={() => setWizardOpen(true)} size="lg">
      <Wand2 className="mr-2 h-5 w-5" />
      Launch Setup Wizard
    </Button>
  </CardContent>
</Card>
```

Add `Wand2` icon from `lucide-react`.

Add state for wizard dialog:
```typescript
const [wizardOpen, setWizardOpen] = useState(false);
```

Render the wizard component:
```typescript
<SetupWizard open={wizardOpen} onOpenChange={setWizardOpen} />
```

Wrap the Quick Setup card in `{isAdmin && (...)}`.

### Step 2: Add Setup Wizard to Homepage (`src/routes/index.tsx`)

Find the existing "Admin Quick Actions" section and add:
```typescript
<Button onClick={() => setWizardOpen(true)}>
  <Wand2 className="mr-2 h-4 w-4" />
  Setup Wizard
</Button>
```

Add `Wand2` import from `lucide-react`.

Add wizard state and component to homepage.

### Step 3: Add Seasons Link to Sidebar (`src/components/Header.tsx`)

Add a "Seasons" navigation link to the sidebar alongside the existing links (Home, Dashboard, Players, Teams, Tournaments, Games):

```typescript
// In the navigation links array, add:
{ label: "Seasons", href: "/seasonspage" }
```

Create a placeholder route file `src/routes/seasonspage/index.tsx` with a basic seasons listing page (stub that can be enhanced later):
```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/seasonspage/")({
  component: SeasonsPage,
});

function SeasonsPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Seasons</h1>
      <p className="text-muted-foreground mt-1">Browse and manage seasons</p>
    </div>
  );
}
```

### Step 4: Test Wizard Launch Flow
- Verify admin can open wizard from Dashboard
- Verify admin can open wizard from Homepage
- Verify wizard closes cleanly
- Verify spectator does not see wizard buttons

## Acceptance Criteria
- [ ] Dashboard shows "Quick Setup Wizard" card (admin-only) with "Launch Setup Wizard" button
- [ ] Homepage "Admin Quick Actions" includes "Setup Wizard" button (admin-only)
- [ ] Both launch buttons open the SetupWizard dialog
- [ ] SetupWizard component imported and renders correctly from both pages
- [ ] Spectator/non-admin users do not see wizard buttons
- [ ] Sidebar navigation includes "Seasons" link
- [ ] `/seasonspage` route exists with a basic page (can be enhanced later)
- [ ] Wizard dialog can be closed and reopened

## Related Files
- `src/routes/dashboard/index.tsx` — MODIFY (add wizard section)
- `src/routes/index.tsx` — MODIFY (add wizard button to admin quick actions)
- `src/components/Header.tsx` — MODIFY (add Seasons navigation link)
- `src/routes/seasonspage/index.tsx` — NEW (basic seasons listing page)

## Dependency
- Blocked by Ticket 17 (Setup Wizard component)

## Notes
- Import `SetupWizard` from `@/components/SetupWizard`
- Import `Wand2` icon from `lucide-react`
- Keep the Quick Setup card concise — it's a call-to-action, not a form
- The seasons page route will be enhanced with a full SeasonsTable in a future ticket
