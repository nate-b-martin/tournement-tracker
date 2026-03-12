---
name: crud-operations
description: CRUD patterns for TanStack Tournament Tracker - mutations, form dialogs, optimistic updates, toast notifications, edit/delete flows
metadata:
  audience: developers
  stack: react-typescript-convex-shadcn
---

## Architecture Overview

CRUD in this project follows a 3-layer pattern:

1. **Convex mutation** (`convex/*.ts`) — server-side data write with auth validation
2. **React hook** (`src/hooks/*.ts`) — wraps `useMutation` and manages UI state
3. **Component** (`src/components/*.tsx`) — form dialog or inline editor that wires hook to UI

## Convex Mutation Patterns

### Create Mutation
Create the mutation in the appropriate `convex/` file:

```typescript
// convex/teams.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    name: v.string(),
    coachName: v.string(),
    coachEmail: v.string(),
    coachPhone: v.string(),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("suspended"),
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("teams", {
      ...args,
      status: args.status || "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
```

### Update Mutation
```typescript
export const update = mutation({
  args: {
    id: v.id("teams"),
    name: v.optional(v.string()),
    coachName: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("suspended"),
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const { id, ...fields } = args;
    return await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });
  },
});
```

### Delete Mutation
```typescript
export const remove = mutation({
  args: { id: v.id("teams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Optionally: check for dependent records before deleting
    return await ctx.db.delete(args.id);
  },
});
```

## Dialog/Form Components

### shadcn Dialog Pattern for Create/Edit
Use `Dialog`, `DialogContent`, `DialogHeader`, `DialogTrigger` from shadcn:

```typescript
// Example: src/components/TeamDialog.tsx
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface TeamDialogProps {
  mode: "create" | "edit";
  team?: Team; // existing team for edit mode
  tournamentId: Id<"tournaments">;
  onSuccess?: () => void;
}

export function TeamDialog({ mode, team, tournamentId, onSuccess }: TeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(team?.name || "");
  const createTeam = useMutation(api.teams.create);
  const updateTeam = useMutation(api.teams.update);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "create") {
        await createTeam({ tournamentId, name, coachName: "", coachEmail: "", coachPhone: "" });
        toast.success("Team created");
      } else if (team) {
        await updateTeam({ id: team._id, name });
        toast.success("Team updated");
      }
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant={mode === "create" ? "default" : "ghost"}>
          {mode === "create" ? "Add Team" : "Edit"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Team" : "Edit Team"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Team name"
            required
          />
          <Button type="submit">{mode === "create" ? "Create" : "Save"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

## Wiring Edit/Delete to Existing Tables

### TeamsTable Edit Pattern
The current `handleEdit` / `handleDelete` in `src/components/TeamsTable.tsx` are `console.log` stubs. Wire them to dialogs:

```typescript
// In TeamsTable.tsx
import { useState } from "react";
import { TeamDialog } from "./TeamDialog";

// Add state
const [editingTeam, setEditingTeam] = useState<Team | null>(null);

// Replace handleEdit
const handleEdit = (team: Team) => {
  setEditingTeam(team);
};

// Replace handleDelete
const handleDelete = async (team: Team) => {
  try {
    await deleteTeam({ id: team._id });
    toast.success("Team deleted");
  } catch (err) {
    toast.error("Failed to delete team");
  }
};

// In the JSX, add:
{editingTeam && (
  <TeamDialog
    mode="edit"
    team={editingTeam}
    tournamentId={editingTeam.tournamentId}
    onSuccess={() => setEditingTeam(null)}
  />
)}
```

### Delete Confirmation Dialog
Use shadcn `AlertDialog` for destructive actions:

```typescript
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

// In your component:
<AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete the team
        and all associated data.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Toast Notifications

Use Sonner (`toast` from `sonner`) for user feedback:

```typescript
import { toast } from "sonner";

// Success
toast.success("Team created successfully");
toast.success("Changes saved");

// Error
toast.error("Failed to delete team");
toast.error(err instanceof Error ? err.message : "An error occurred");

// Promise (for async operations)
toast.promise(createTeam({ ...args }), {
  loading: "Creating team...",
  success: "Team created!",
  error: "Failed to create team",
});
```

## Key Files to Reference
- `convex/teams.ts` — Existing query patterns (model mutations after these)
- `convex/players.ts` — Existing query patterns with joins
- `src/components/TeamsTable.tsx:174-180` — Edit/Delete stubs to wire up
- `src/components/PlayersTable.tsx:309-315` — Edit/Delete stubs to wire up
- `src/components/DataTable/types.ts` — `DataTableAction` interface
- `src/hooks/useAuth.ts` — Auth hook for permission checks

## Checklist for Adding CRUD to a Table
- [ ] Create Convex mutation(s) in appropriate `convex/*.ts` file
- [ ] Add auth + role validation in the mutation
- [ ] Create form Dialog component
- [ ] Wire Edit/Delete handlers in the table component
- [ ] Add toast.success/toast.error feedback
- [ ] Add AlertDialog for delete confirmation
- [ ] Handle loading states on submit buttons
- [ ] Reset form state on close
