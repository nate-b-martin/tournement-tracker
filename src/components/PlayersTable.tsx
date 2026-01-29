/**
 * Players Table Component
 *
 * This component displays a table of players with their team information.
 * Currently uses mock data for development.
 *
 * @fileoverview Table component for displaying player data
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  usePlayers,
  type PlayerListOptions,
  type PlayerWithTeam,
} from "@/hooks/usePlayers";
import { useMockPlayers } from "@/mocks/hooks";

interface PlayersTableProps {
  /** Optional initial options for the players query */
  initialOptions?: PlayerListOptions;
}

/**
 * Players table component with pagination, sorting, and filtering support
 *
 * @example
 * ```typescript
 * function PlayersPage() {
 *   return (
 *     <PlayersTable
 *       initialOptions={{
 *         pagination: { pageIndex: 0, pageSize: 10 },
 *         sorting: { field: "lastName", direction: "asc" }
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export function PlayersTable({ initialOptions }: PlayersTableProps) {
  const { players, totalCount, isLoading, currentOptions } =
    usePlayers(initialOptions);

  if (isLoading) {
    return <div className="p-4">Loading players...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="text-sm text-gray-600">
        Showing {players.length} of {totalCount} players
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table className="text-table-default">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Jersey</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Captain</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player: PlayerWithTeam) => (
              <TableRow key={player._id}>
                <TableCell className="font-medium">
                  {player.firstName} {player.lastName}
                </TableCell>
                <TableCell>{player.jerseyNumber || "-"}</TableCell>
                <TableCell>{player.team?.name || "No Team"}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      player.status === "active"
                        ? "bg-green-100 text-green-800"
                        : player.status === "injured"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {player.status}
                  </span>
                </TableCell>
                <TableCell>{player.isCaptain ? "Yes" : ""}</TableCell>
                <TableCell>{player.email || "-"}</TableCell>
                <TableCell>{player.phone || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Empty state */}
      {players.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No players found matching the current filters.
        </div>
      )}

      {/* Debug info - can be removed in production */}
      <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-50 rounded">
        <div>Mock data debug info:</div>
        <div>Current page: {currentOptions.pagination?.pageIndex || 0}</div>
        <div>Page size: {currentOptions.pagination?.pageSize || 10}</div>
        <div>
          Sorting: {currentOptions.sorting?.field}{" "}
          {currentOptions.sorting?.direction}
        </div>
        <div>Search: {currentOptions.filtering?.search || "none"}</div>
      </div>
    </div>
  );
}
