# Feature: Create and Edit Flows with Dialogs

## Overview
Build dialog-based create and edit forms for players, teams, and tournaments. Wire up the stub `handleEdit`/`handleDelete`/`handleCreate` callbacks to actual mutations. This is the feature that makes the app interactive rather than read-only.

## Current State
- PlayersTable has `handleEdit` and `handleDelete` as empty stubs (`// TODO: Implement edit player flow`)
- TeamsTable has `handleEdit` and `handleDelete` as empty stubs (`// TODO: Implement edit team flow`)
- No "Add Player", "Add Team", or "Create Tournament" buttons anywhere
- Convex mutations exist (from ticket 06) but are not called from the UI
- No shadcn Dialog, Form, or Input components installed yet
- No form validation patterns established

## Prerequisites
- [ ] Ticket `06-crud-mutations.md` — all mutations must be deployed
- [ ] shadcn Dialog, Input, Label, Form components must be added

## Implementation Steps

### Step 1: Install Required shadcn Components

```bash
bunx shadcn@latest add dialog
bunx shadcn@latest add input
bunx shadcn@latest add label
bunx shadcn@latest add form
bunx shadcn@latest add select
bunx shadcn@latest add textarea
```

### Step 2: Create Player Dialog (`src/components/PlayerDialog.tsx`)

```typescript
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Player = Doc<"players"> & { team?: Doc<"teams"> | null };

interface PlayerDialogProps {
  mode: "create" | "edit";
  player?: Player;  // Provided in edit mode
  teamId?: Id<"teams">;  // Pre-selected team in create mode
  teams: Array<{ _id: Id<"teams">; name: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PlayerDialog({
  mode,
  player,
  teamId,
  teams,
  open,
  onOpenChange,
  onSuccess,
}: PlayerDialogProps) {
  const createPlayer = useMutation(api.players.create);
  const updatePlayer = useMutation(api.players.update);

  const [firstName, setFirstName] = useState(player?.firstName || "");
  const [lastName, setLastName] = useState(player?.lastName || "");
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | "">(
    player?.teamId || teamId || "",
  );
  const [jerseyNumber, setJerseyNumber] = useState(
    player?.jerseyNumber?.toString() || "",
  );
  const [email, setEmail] = useState(player?.email || "");
  const [phone, setPhone] = useState(player?.phone || "");
  const [status, setStatus] = useState(player?.status || "active");
  const [isCaptain, setIsCaptain] = useState(player?.isCaptain || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFirstName(player?.firstName || "");
    setLastName(player?.lastName || "");
    setSelectedTeamId(player?.teamId || teamId || "");
    setJerseyNumber(player?.jerseyNumber?.toString() || "");
    setEmail(player?.email || "");
    setPhone(player?.phone || "");
    setStatus(player?.status || "active");
    setIsCaptain(player?.isCaptain || false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }
    if (!selectedTeamId) {
      toast.error("Please select a team");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createPlayer({
          teamId: selectedTeamId as Id<"teams">,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          isCaptain,
          status: status as "active" | "inactive" | "injured",
        });
        toast.success("Player created successfully");
      } else if (player) {
        await updatePlayer({
          id: player._id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          isCaptain,
          status: status as "active" | "inactive" | "injured",
        });
        toast.success("Player updated successfully");
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(mode === "create" ? "Failed to create player" : "Failed to update player");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Player" : "Edit Player"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new player to a team"
              : "Update player information"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team">Team *</Label>
            <Select
              value={selectedTeamId.toString()}
              onValueChange={(val) => setSelectedTeamId(val as Id<"teams">)}
              disabled={!!teamId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team._id} value={team._id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jerseyNumber">Jersey #</Label>
              <Input
                id="jerseyNumber"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
                placeholder="42"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="injured">Injured</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="555-0123"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isCaptain"
              checked={isCaptain}
              onChange={(e) => setIsCaptain(e.target.checked)}
              className="h-4 w-4 rounded border-gray-600"
            />
            <Label htmlFor="isCaptain" className="text-sm font-normal">
              Team Captain
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Create Player"
                  : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Step 3: Create Team Dialog (`src/components/TeamDialog.tsx`)

Similar pattern to PlayerDialog with fields:
- name (required), coachName (required), coachEmail (required), coachPhone (required)
- description, city, homeField, organization, teamAgeGroup (optional)
- status (active/inactive/suspended)
- tournamentId (select from active tournaments)

### Step 4: Create Tournament Dialog (`src/components/TournamentDialog.tsx`)

Similar pattern with fields:
- name (required), sport (required), location (optional)
- startDate, endDate, registrationDeadline (date pickers)
- maxTeams, minTeams, fieldsAvailable, gameDuration, breakBetweenGames (number inputs)
- bracketType (single/double_elimination/round_robin select)
- seedingType (random/manual/ranking select)
- status (draft/registration_open/registration_closed/active/complete select)
- gameFormatRules (textarea, optional)

### Step 5: Wire Dialogs into Tables and Routes

**PlayersTable (`src/components/PlayersTable.tsx`):**

```typescript
// Add state
const [dialogOpen, setDialogOpen] = useState(false);
const [editingPlayer, setEditingPlayer] = useState<PlayerWithTeam | undefined>();
const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

// Wire handleEdit
const handleEdit = (player: PlayerWithTeam) => {
  setEditingPlayer(player);
  setDialogMode("edit");
  setDialogOpen(true);
};

// Wire handleDelete with confirmation
const handleDelete = async (player: PlayerWithTeam) => {
  if (!window.confirm(`Delete ${player.firstName} ${player.lastName}?`)) return;
  try {
    await deletePlayer({ id: player._id });
    toast.success("Player deleted");
  } catch {
    toast.error("Failed to delete player");
  }
};

// Add "Add Player" button in toolbar or above the table
const handleAddPlayer = () => {
  setEditingPlayer(undefined);
  setDialogMode("create");
  setDialogOpen(true);
};

// Render dialog
<PlayerDialog
  mode={dialogMode}
  player={editingPlayer}
  teamId={currentOptions?.filtering?.teamId}
  teams={teams}
  open={dialogOpen}
  onOpenChange={setDialogOpen}
/>
```

**Page-level routes** should also get "Add" buttons:

For the Players page:
```typescript
{isAdmin && (
  <Button onClick={() => setShowAddDialog(true)}>
    <Plus className="mr-2 h-4 w-4" />
    Add Player
  </Button>
)}
```

### Step 6: Delete Confirmation Pattern

Create a reusable delete confirmation pattern using a shadcn AlertDialog:

```typescript
// src/components/ConfirmDelete.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDeleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmDelete({
  open,
  onOpenChange,
  itemName,
  onConfirm,
  isLoading,
}: ConfirmDeleteProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {itemName}. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

Install AlertDialog: `bunx shadcn@latest add alert-dialog`

### Step 7: Connect Team Delete with Player Unlinking

Before deleting a team, either:
- Unlink all players from the team (set their teamId to null/empty)
- Or prevent deletion if players are assigned (safer, with appropriate message)

```typescript
export const remove = mutation({
  args: { id: v.id("teams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Unlink all players on this team
    const players = await ctx.db
      .query("players")
      .collect();

    const teamPlayers = players.filter((p) => p.teamId === args.id);
    for (const player of teamPlayers) {
      await ctx.db.patch(player._id, { teamId: undefined });
    }

    await ctx.db.delete(args.id);
  },
});
```

## Acceptance Criteria
- [ ] Player create dialog opens with form fields, validates required fields
- [ ] Player edit dialog pre-populates with existing player data
- [ ] Player delete shows confirmation dialog
- [ ] Team create dialog works with team fields
- [ ] Team edit dialog pre-populates data
- [ ] Tournament create dialog works with all tournament fields
- [ ] Tournament edit dialog pre-populates data
- [ ] All dialogs use shadcn Dialog component for consistency
- [ ] All create/delete operations show toast notifications on success/error
- [ ] Delete confirmation uses AlertDialog (not browser confirm)
- [ ] Tables refresh data after create/edit/delete operations
- [ ] "Add Player/Team/Tournament" buttons visible only for admins
- [ ] Edit/Delete buttons in tables work for admins
- [ ] Forms reset on dialog close
- [ ] Loading state on submit button (disabled + "Saving...")

## Edge Cases
- Double-submit prevention (disable button during submission)
- Form reset when switching between create and edit modes
- Required field validation (firstName, lastName for players; name, coachName, coachEmail for teams; name, sport for tournaments)
- Network errors during submission (toast error, keep form open)
- Dialog close while submitting (should prevent or handle gracefully)
- Editing a player that was deleted by another admin (Convex returns null — show error toast)
- Very long field values (input maxLength or proper overflow)
- Phone number formatting (store as string, don't validate format)
- Email format validation (basic regex on client side)
- Date fields for tournaments (use native date input or shadcn date picker)
- Team status change should not affect players

## Testing Considerations
- Test create dialog opens and renders all fields
- Test create with minimum required fields only
- Test create with all fields filled
- Test create with missing required field (should show validation error)
- Test edit dialog pre-fills correctly
- Test edit changes are saved and reflected in table
- Test delete with confirmation
- Test cancel on delete dialog (should not delete)
- Test network error handling
- Test form reset after close/reopen
- Test admin-only visibility of buttons
- Test double-submit prevention

## Related Files
- `src/components/PlayerDialog.tsx` — NEW
- `src/components/TeamDialog.tsx` — NEW
- `src/components/TournamentDialog.tsx` — NEW
- `src/components/ConfirmDelete.tsx` — NEW
- `src/components/PlayersTable.tsx` — MODIFY (wire edit/delete/create)
- `src/components/TeamsTable.tsx` — MODIFY (wire edit/delete/create)
- `src/components/TournamentTable.tsx` — MODIFY (wire edit/delete/create)
- `src/routes/playerspage/index.tsx` — MODIFY (add "Add Player" button)
- `src/routes/teamspage/index.tsx` — MODIFY (add "Add Team" button)
- `src/routes/tournamentspage/index.tsx` — MODIFY (add "Create Tournament" button)
- `convex/teams.ts` — MODIFY (cascade delete players on team delete)

## Helpful Resources

### shadcn Dialog
- [shadcn Dialog Component](https://ui.shadcn.com/docs/components/dialog)
- [shadcn Form Component](https://ui.shadcn.com/docs/components/form)
- [shadcn Alert Dialog](https://ui.shadcn.com/docs/components/alert-dialog)

### Convex Mutations
- [Convex useMutation Hook](https://docs.convex.dev/react/mutations)
- [Convex Error Handling](https://docs.convex.dev/functions/error-handling)

### Toast Notifications
- [Sonner Toast](https://sonner.emilkowal.ski/getting-started)

## Notes
- Use Controlled forms (not shadcn Form) initially for simplicity — switch to Form when validation complexity grows
- Team dropdown in PlayerDialog should list all teams for selection flexibility
- Tournament dialog should include status field to create in "draft" mode immediately
- Date fields in tournament dialog: use `<input type="date">` and convert to/from milliseconds
- Consider extracting a reusable `FormField` pattern if many forms share similar layout
- The `handleDelete` for teams should handle cascading to players
- Always call `resetForm()` when dialog transitions between create/edit modes or opens/closes
- Build dialogs in this order: Player → Team → Tournament (increasing complexity)
