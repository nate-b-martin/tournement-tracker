/**
 * Players Table Component
 *
 * This component displays a table of players with their team information.
 * Currently uses mock data for development.
 *
 * @fileoverview Table component for displaying player data
 */

import {
  type PlayerListOptions,
  type PlayerWithTeam,
  usePlayers,
} from "@/hooks/usePlayers";
import { DataTable } from "./DataTable/DataTable";
import type { ColumnDef } from "./DataTable/types";

interface PlayersTableProps {
  /** Optional initial options for the players query */
  initialOptions?: PlayerListOptions;
}

//  Column definitions for the players table
const playerColumns: ColumnDef<PlayerWithTeam>[] = [
  {
    header: "Name",
    field: "lastName",
    sortable: true,
    cell: (player) => (
      <span className="font-medium">
        {player.firstName} {player.lastName}
      </span>
    ),
  },
  {
    header: "Jersey",
    field: "jerseyNumber",
    sortable: true,
    cell: (player) => <span>{player.jerseyNumber || "-"}</span>,
  },
  {
    header: "Team",
    field: "teamId",
    sortable: true,
    cell: (player) => <span>{player.team?.name || "No Team"}</span>,
  },
  {
    header: "Status",
    field: "status",
    sortable: true,
    cell: (player) => <span className="capitalize">{player.status}</span>,
  },
  {
    header: "Captain",
    field: "isCaptain",
    sortable: true,
    cell: (player) => <span>{player.isCaptain ? "Yes" : ""}</span>,
  },
  {
    header: "Email",
    field: "email",
    sortable: true,
    cell: (player) => <span>{player.email || "-"}</span>,
  },
  {
    header: "Phone",
    field: "phone",
    sortable: true,
    cell: (player) => <span>{player.phone || "-"}</span>,
  },
];

export function PlayersTable({ initialOptions }: PlayersTableProps) {
  const {
    players,
    totalCount,
    isLoading,
    setPagination,
    setSorting,
    currentOptions,
  } = usePlayers(initialOptions);

  const handleSort = (field: string) => {
    if (!initialOptions?.sorting) return;
    const currentSort = initialOptions.sorting;
    const newDirection =
      currentSort.field === field && currentSort.direction === "asc"
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

  const handleEdit = (player: PlayerWithTeam) => {
    console.log("Editing player:", player);
  };

  const handleDelete = (player: PlayerWithTeam) => {
    console.log("Deleting player:", player);
  };

  return (
    <DataTable
      data={players}
      columns={playerColumns}
      isLoading={isLoading}
      totalCount={totalCount}
      pagination={currentOptions?.pagination || { pageIndex: 0, pageSize: 10 }}
      onPaginationChange={handlePaginationChange}
      sorting={initialOptions?.sorting}
      onSort={handleSort}
      emptyMessage="No players found"
      itemName="players"
      actions={{
        canEdit: true,
        canDelete: true,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }}
    />
  );
}
