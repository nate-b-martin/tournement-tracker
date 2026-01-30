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
import { PaginationControls } from "./PaginationControls";

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
  const {
    players,
    totalCount,
    isLoading,
    setPagination,
    setSorting,
    setFiltering,
    currentOptions,
  } = usePlayers(initialOptions);

  const currentPage = currentOptions.pagination?.pageIndex || 0;
  const pageSize = currentOptions.pagination?.pageSize || 10;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = currentPage * pageSize + 1;
  const endIndex = Math.min((currentPage + 1) * pageSize, totalCount);
  const hasNextPage = (currentPage + 1) * pageSize < totalCount;
  const hasPreviousPage = currentPage > 0;

  if (isLoading) {
    return <div className="p-4">Loading players...</div>;
  }

  return (
    <div className="space-y-4 mt-3 max-h-1/2">
      {/* Summary */}
      <div className="text-sm text-gray-600 mb-4">
        <span>
          Showing {startIndex}---{endIndex} of {totalCount} players
        </span>
        {totalPages > 1 && (
          <span className="ml-4 text-gray-500">
            (Page {currentPage + 1} of {totalPages})
          </span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border max-h-full overflow-y-auto">
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

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalCount={totalCount}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        onPageChange={(page) => setPagination({ pageIndex: page, pageSize })}
        onPageSizeChange={(size) =>
          setPagination({ pageIndex: 0, pageSize: size })
        }
      />

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
