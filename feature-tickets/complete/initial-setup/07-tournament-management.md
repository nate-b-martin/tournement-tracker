# Feature: Tournament Management UI

## Overview
Build the full tournament management experience — a tournament listing page with table view, create/delete functionality, and navigation integration. This is the core feature of a tournament tracker. Currently the tournament route is a placeholder and the hook is empty.

## Current State
- `src/routes/tournamentspage/index.tsx` — renders `<div>Hello "/tournamentspage/"!</div>`
- `src/hooks/useTournaments.ts` — completely empty file
- `convex/tournaments.ts` — only has `count` query; no `list`, `getById`, `create`, `update`, `remove`
- No TournamentTable component exists
- Header/Sidebar navigation has no Tournaments link
- Design mockup at `src/design/ui-design-03-tournaments.png` shows planned card-based layout
- Design doc at `src/design/TABLES_DESIGN.md` discusses tournament table specs

## Prerequisites
- [ ] Ticket `06-crud-mutations.md` — tournament create/update/remove/list/getById mutations must exist

## Implementation Steps

### Step 1: Create `useTournaments` Hook (`src/hooks/useTournaments.ts`)

```typescript
import { useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

export type TournamentWithMeta = Doc<"tournaments">;

export interface TournamentListOptions {
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  sorting?: {
    field: string;
    direction: "asc" | "desc";
  };
  filtering?: {
    search?: string;
    status?: string[];
    sport?: string;
  };
}

export function useTournaments(initialOptions?: TournamentListOptions) {
  const [currentOptions, setCurrentOptions] = useState<TournamentListOptions>(
    initialOptions || {
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: { field: "name", direction: "asc" },
    },
  );

  const result = useQuery(api.tournaments.list, currentOptions);
  const count = useQuery(api.tournaments.count);
  const isLoading = result === undefined || count === undefined;

  const setPagination = useCallback(
    (pagination: { pageIndex: number; pageSize: number }) => {
      setCurrentOptions((prev) => ({ ...prev, pagination }));
    },
    [],
  );

  const setSorting = useCallback(
    (sorting: { field: string; direction: "asc" | "desc" }) => {
      setCurrentOptions((prev) => ({ ...prev, sorting }));
    },
    [],
  );

  const setFiltering = useCallback(
    (filtering?: TournamentListOptions["filtering"]) => {
      setCurrentOptions((prev) => ({
        ...prev,
        filtering,
        pagination: { pageIndex: 0, pageSize: prev.pagination?.pageSize || 10 },
      }));
    },
    [],
  );

  return {
    tournaments: result?.data || [],
    totalCount: result?.totalCount || count || 0,
    isLoading,
    setPagination,
    setSorting,
    setFiltering,
    currentOptions,
  };
}

export function useTournamentById(id: string | undefined) {
  return useQuery(api.tournaments.getById, id ? { id: id as any } : "skip");
}

export function useTournamentCount() {
  return useQuery(api.tournaments.count);
}
```

### Step 2: Create TournamentTable Component (`src/components/TournamentTable.tsx`)

```typescript
import { useState } from "react";
import { type TournamentListOptions, useTournaments } from "@/hooks/useTournaments";
import { cn } from "@/lib/utils";
import { DataTable } from "./DataTable/DataTable";
import type { ColumnDef } from "./DataTable/types";
import type { Doc } from "../../convex/_generated/dataModel";

type Tournament = Doc<"tournaments">;

interface TournamentTableProps {
  initialOptions?: TournamentListOptions;
  isAdmin?: boolean;
  onEdit?: (tournament: Tournament) => void;
  onDelete?: (tournament: Tournament) => void;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "border border-slate-500/30 bg-slate-500/15 text-slate-300",
  registration_open: "border border-blue-500/30 bg-blue-500/15 text-blue-300",
  registration_closed: "border border-amber-500/30 bg-amber-500/15 text-amber-300",
  active: "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  complete: "border border-purple-500/30 bg-purple-500/15 text-purple-300",
};

const BRACKET_LABELS: Record<string, string> = {
  single: "Single Elim",
  double_elimination: "Double Elim",
  round_robin: "Round Robin",
};

const tournamentColumns: ColumnDef<Tournament>[] = [
  {
    header: "Name",
    field: "name",
    sortable: true,
    cell: (t) => <span className="font-medium">{t.name}</span>,
  },
  {
    header: "Sport",
    field: "sport",
    sortable: true,
    cell: (t) => <span className="capitalize">{t.sport}</span>,
  },
  {
    header: "Teams",
    field: "currentTeamCount",
    sortable: true,
    cell: (t) => (
      <span>{t.currentTeamCount} / {t.maxTeams}</span>
    ),
  },
  {
    header: "Bracket",
    field: "bracketType",
    sortable: true,
    cell: (t) => <span>{BRACKET_LABELS[t.bracketType] || t.bracketType}</span>,
  },
  {
    header: "Status",
    field: "status",
    sortable: true,
    cell: (t) => (
      <span className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        STATUS_STYLES[t.status] || STATUS_STYLES.draft,
      )}>
        {t.status.replace(/_/g, " ")}
      </span>
    ),
  },
  {
    header: "Location",
    field: "location",
    sortable: true,
    cell: (t) => <span>{t.location || "-"}</span>,
  },
  {
    header: "Start Date",
    field: "startDate",
    sortable: true,
    cell: (t) => (
      <span>{t.startDate ? new Date(t.startDate).toLocaleDateString() : "-"}</span>
    ),
  },
];

export function TournamentTable({
  initialOptions,
  isAdmin,
  onEdit,
  onDelete,
}: TournamentTableProps) {
  const {
    tournaments,
    totalCount,
    isLoading,
    setPagination,
    setSorting,
    setFiltering,
    currentOptions,
  } = useTournaments(initialOptions);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    initialOptions?.filtering?.status?.[0] || "all",
  );

  const STATUS_FILTERS = [
    { value: "all", label: "All Statuses" },
    { value: "draft", label: "Draft" },
    { value: "registration_open", label: "Open" },
    { value: "registration_closed", label: "Closed" },
    { value: "active", label: "Active" },
    { value: "complete", label: "Complete" },
  ];

  const filterBySearch = (list: Tournament[], query: string) => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return list;
    return list.filter(
      (t) =>
        t.name.toLowerCase().includes(trimmed) ||
        t.description?.toLowerCase().includes(trimmed) ||
        t.location?.toLowerCase().includes(trimmed),
    );
  };

  const filteredTournaments = filterBySearch(tournaments, searchQuery);

  const handleSort = (field: string) => {
    const currentSort = currentOptions?.sorting;
    const newDirection =
      currentSort?.field === field && currentSort?.direction === "asc"
        ? "desc"
        : "asc";
    setSorting({ field, direction: newDirection });
  };

  const handlePaginationChange = (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => {
    setPagination(pagination);
  };

  const applyStatusFilter = (status: string) => {
    const filtering: TournamentListOptions["filtering"] =
      status !== "all" ? { status: [status] } : undefined;
    setFiltering(filtering);
    setPagination({ pageIndex: 0, pageSize: currentOptions?.pagination?.pageSize || 10 });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setFiltering(undefined);
    setPagination({ pageIndex: 0, pageSize: currentOptions?.pagination?.pageSize || 10 });
  };

  const toolbarFilters = STATUS_FILTERS.map((f) => ({
    label: f.label,
    active: statusFilter === f.value,
    onClick: () => {
      setStatusFilter(f.value);
      applyStatusFilter(f.value);
    },
  }));

  return (
    <DataTable
      data={filteredTournaments}
      columns={tournamentColumns}
      isLoading={isLoading}
      totalCount={totalCount}
      pagination={currentOptions?.pagination || { pageIndex: 0, pageSize: 10 }}
      onPaginationChange={handlePaginationChange}
      sorting={currentOptions?.sorting}
      onSort={handleSort}
      emptyMessage="No tournaments found"
      itemName="tournaments"
      toolbar={{
        search: {
          value: searchQuery,
          placeholder: "Search tournaments...",
          onChange: (value) => setSearchQuery(value),
        },
        filters: toolbarFilters,
        actions: [
          { label: "Clear filters", variant: "ghost" as const, onClick: clearFilters },
        ],
      }}
      actions={{
        canEdit: isAdmin ?? false,
        canDelete: isAdmin ?? false,
        onEdit: onEdit ? (item: Tournament) => onEdit(item) : undefined,
        onDelete: onDelete ? (item: Tournament) => onDelete(item) : undefined,
      }}
    />
  );
}
```

### Step 3: Wire Up Tournament Page Route (`src/routes/tournamentspage/index.tsx`)

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { TournamentTable } from "@/components/TournamentTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/tournamentspage/")({
  component: TournamentsPage,
});

function TournamentsPage() {
  const { isAdmin, isSignedIn, isSpectator } = useAuth();

  const handleEdit = (tournament: any) => {
    // TODO: Will be wired in ticket 08-create-edit-flows
  };

  const handleDelete = (tournament: any) => {
    // TODO: Will be wired in ticket 08-create-edit-flows
  };

  const handleCreate = () => {
    // TODO: Will be wired in ticket 08-create-edit-flows
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tournaments</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? "Create and manage your tournaments"
              : "Browse upcoming and active tournaments"}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Tournament
          </Button>
        )}
      </div>

      {isSignedIn && isSpectator && (
        <div className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
          Viewing as spectator. Contact an admin to make changes to tournaments.
        </div>
      )}

      <TournamentTable
        initialOptions={{
          sorting: { field: "name", direction: "asc" },
          pagination: { pageIndex: 0, pageSize: 10 },
        }}
        isAdmin={isAdmin}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
```

### Step 4: Add Tournament Link to Navigation (`src/components/Header.tsx`)

Find the existing navigation links array and add a Tournaments link:

```typescript
// After the Teams link, add:
{ label: "Tournaments", href: "/tournamentspage" }
```

The sidebar navigation currently has: Home, Dashboard, Players, Teams.

### Step 5: Update Dashboard to Include Tournament Overview

Add a tournament summary section or tournament table to the dashboard to make it a true command center.

## Acceptance Criteria
- [ ] `/tournamentspage` renders a full data table with tournament data
- [ ] Tournament table shows columns: Name, Sport, Teams (current/max), Bracket, Status, Location, Start Date
- [ ] Status badges have unique colors for each status (draft, registration_open, registration_closed, active, complete)
- [ ] Sortable columns work for all displayed fields
- [ ] Search filters across name, description, location
- [ ] Status filter chips toggle between All/Draft/Open/Closed/Active/Complete
- [ ] Pagination works with selectable page sizes (10, 25, 50)
- [ ] Edit/Delete buttons visible only for admins (stubs ready for ticket 08)
- [ ] "New Tournament" button visible only for admins
- [ ] Sidebar navigation includes Tournaments link
- [ ] Dashboard shows tournament overview
- [ ] Loading state shows spinner
- [ ] Empty state shows "No tournaments found"
- [ ] Spectator banner shown for non-admin signed-in users
- [ ] Public users can browse tournaments without authentication

## Edge Cases
- Zero tournaments in the database (empty state)
- Single tournament (minimal pagination)
- Tournament with no location or start date (show "-" placeholder)
- Long tournament names (truncation/ellipsis)
- Status values with underscores (display as human-readable: "registration_open" → "Registration Open", "double_elimination" → "Double Elim")
- Admin vs spectator view differences

## Testing Considerations
- Test tournament table renders with seed data
- Test all status filter combinations
- Test search functionality
- Test pagination with various page sizes
- Test admin-only button visibility
- Test spectator alert visibility
- Verify navigation link is highlighted on active route
- Test tournament creation flow (when wired in ticket 08)

## Related Files
- `src/hooks/useTournaments.ts` — NEW (was empty)
- `src/components/TournamentTable.tsx` — NEW
- `src/routes/tournamentspage/index.tsx` — REWRITE (was placeholder)
- `src/components/Header.tsx` — MODIFY (add Tournaments link)
- `src/routes/dashboard/index.tsx` — MODIFY (add tournament overview)
- `convex/tournaments.ts` — DEPENDS ON (must have list, getById, count)
- `src/design/TABLES_DESIGN.md` — Reference for column specs

## Helpful Resources

### Data Tables
- [Existing DataTable component patterns](vscode://file/src/components/DataTable/DataTable.tsx)
- [TanStack Table Column Defs](https://tanstack.com/table/latest/docs/guide/column-defs)

### Design
- `src/design/ui-design-03-tournaments.png` — Tournament page mockup
- `src/design/TABLES_DESIGN.md` — Table column specs

## Notes
- Tournament status uses snake_case from the schema — display with `.replace(/_/g, " ")` for readability
- Bracket type labels should be user-friendly: "single" → "Single Elim", "double_elimination" → "Double Elim", "round_robin" → "Round Robin"
- Date fields are stored as milliseconds — convert with `new Date().toLocaleDateString()`
- The `currentTeamCount / maxTeams` column shows registration capacity at a glance
- Consider adding a "quick actions" dropdown per row for admin workflows (Edit, Manage Teams, Start Tournament, etc.)
- Future enhancement: clicking a tournament name should navigate to tournament detail page (ticket 10)
