/**
 * Mock Player Hooks - React hooks for development using mock data
 *
 * These hooks provide the same interface as the real Convex hooks
 * but use static mock data instead of database queries.
 * Perfect for development when you don't have a live database connection.
 *
 * @fileoverview Mock player data hooks for development
 */

import { useMemo, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type {
	PlayerListOptions,
	PlayerListResult,
	PlayerWithTeam,
} from "../../hooks/usePlayers";
import {
	getActiveMockPlayers,
	getMockPlayerById,
	getMockPlayersWithTeams,
	searchMockPlayers,
} from "../data/mockPlayers";

/**
 * Mock hook to get the total count of all players
 *
 * @returns {number} Total player count (instant return for mock)
 *
 * @example
 * ```typescript
 * const playerCount = useMockPlayerCount();
 * return <div>Total players: {playerCount}</div>;
 * ```
 */
export function useMockPlayerCount(): number {
	// For mock data, return immediately (no loading state)
	return getActiveMockPlayers().length;
}

/**
 * Mock hook to fetch a specific player by ID with associated team data
 *
 * @param id - The player ID to fetch
 * @returns {PlayerWithTeam | null} Player with team data, or null if not found
 *
 * @example
 * ```typescript
 * const player = useMockPlayerById("player_1");
 * if (!player) return <div>Player not found</div>;
 * return <div>{player.firstName} {player.team?.name}</div>;
 * ```
 */
export function useMockPlayerById(
	id: Id<"players"> | undefined,
): PlayerWithTeam | null {
	return useMemo(() => {
		if (!id) return null;
		return getMockPlayerById(id);
	}, [id]);
}

/**
 * Mock hook to search players by text query
 *
 * Searches across first name, last name, and email fields.
 *
 * @param searchQuery - The search term to find players by
 * @returns {PlayerWithTeam[]} Array of matching players
 *
 * @example
 * ```typescript
 * const [searchTerm, setSearchTerm] = useState("");
 * const results = useMockPlayerSearch(searchTerm);
 *
 * return (
 *   <div>
 *     <input
 *       value={searchTerm}
 *       onChange={(e) => setSearchTerm(e.target.value)}
 *       placeholder="Search players..."
 *     />
 *     {results.map(player => (
 *       <div key={player._id}>{player.firstName} {player.lastName}</div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useMockPlayerSearch(searchQuery: string): PlayerWithTeam[] {
	return useMemo(() => {
		if (!searchQuery.trim()) return [];
		return searchMockPlayers(searchQuery);
	}, [searchQuery]);
}

/**
 * Mock hook to fetch paginated player list with full control
 *
 * This is a thin wrapper around the mock data that provides
 * filtering, sorting, and pagination functionality.
 *
 * @param options - Query configuration options (pagination, sorting, filtering)
 * @returns {PlayerListResult} Paginated results
 *
 * @example
 * ```typescript
 * const result = useMockPlayerList({
 *   pagination: { pageIndex: 0, pageSize: 10 },
 *   sorting: { field: "lastName", direction: "asc" },
 *   filtering: { status: ["active"] }
 * });
 *
 * return (
 *   <div>
 *     <div>Total: {result.totalCount}</div>
 *     {result.data.map(player => (
 *       <div key={player._id}>{player.firstName} {player.lastName}</div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useMockPlayerList(
	options: PlayerListOptions = {},
): PlayerListResult {
	const { pagination, sorting, filtering } = options;

	return useMemo(() => {
		let players = getMockPlayersWithTeams();

		// Apply team filter
		if (filtering?.teamId) {
			players = players.filter((player) => player.teamId === filtering.teamId);
		}

		// Apply text search filter
		if (filtering?.search) {
			const searchTerm = filtering.search.toLowerCase();
			players = players.filter(
				(player) =>
					player.firstName.toLowerCase().includes(searchTerm) ||
					player.lastName.toLowerCase().includes(searchTerm) ||
					(player.email && player.email.toLowerCase().includes(searchTerm)) ||
					(player.phone && player.phone.includes(searchTerm)),
			);
		}

		// Apply status filter
		if (filtering?.status && filtering.status.length > 0) {
			players = players.filter((player) =>
				filtering.status!.includes(player.status),
			);
		}

		// Apply sorting
		if (sorting) {
			players.sort((a, b) => {
				const { field, direction } = sorting;
				let aValue: any = a[field as keyof typeof a];
				let bValue: any = b[field as keyof typeof b];

				// Handle special cases
				if (field === "fullName") {
					aValue = `${a.firstName} ${a.lastName}`;
					bValue = `${b.firstName} ${b.lastName}`;
				}

				// Handle undefined values
				if (aValue === undefined && bValue === undefined) return 0;
				if (aValue === undefined) return direction === "asc" ? 1 : -1;
				if (bValue === undefined) return direction === "asc" ? -1 : 1;

				if (aValue < bValue) return direction === "asc" ? -1 : 1;
				if (aValue > bValue) return direction === "asc" ? 1 : -1;
				return 0;
			});
		}

		// Get total count before pagination
		const totalCount = players.length;

		// Apply pagination
		if (pagination) {
			const { pageIndex, pageSize } = pagination;
			const startIndex = pageIndex * pageSize;
			players = players.slice(startIndex, startIndex + pageSize);
		}

		return {
			data: players,
			totalCount,
			hasMore: pagination
				? (pagination.pageIndex + 1) * pagination.pageSize < totalCount
				: false,
		};
	}, [pagination, sorting, filtering]);
}

/**
 * Comprehensive mock hook for managing player data with built-in state management
 *
 * This is the recommended mock hook for data tables and complex UI components.
 * It manages pagination, sorting, and filtering state internally while providing
 * a clean API for common operations.
 *
 * @param initialOptions - Optional initial configuration for the query
 * @returns Object containing data, state, and control functions
 *
 * @example
 * ```typescript
 * function MockPlayerTable() {
 *   const {
 *     players,
 *     totalCount,
 *     isLoading,
 *     setPagination,
 *     setSorting,
 *     setFiltering
 *   } = useMockPlayers({
 *     pagination: { pageIndex: 0, pageSize: 10 },
 *     sorting: { field: "firstName", direction: "asc" }
 *   });
 *
 *   // For mock data, isLoading is always false
 *   return (
 *     <div>
 *       <div>Total players: {totalCount}</div>
 *       {players.map(player => (
 *         <div key={player._id}>
 *           {player.firstName} {player.lastName} - {player.team?.name}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMockPlayers(initialOptions?: PlayerListOptions) {
	// Internal state for managing query configuration
	const [options, setOptions] = useState<PlayerListOptions>(
		initialOptions || {},
	);

	// Execute the mock query with current options
	const result = useMockPlayerList(options);

	// Get total count for pagination metadata
	const count = useMockPlayerCount();

	// For mock data, we're never loading (instant return)
	const isLoading = false;

	return {
		// === Data ===
		/** Array of players for current page */
		players: result.data,

		/** Total number of players matching current filters */
		totalCount: result.totalCount || count,

		/** Whether more players are available on next page */
		hasMore: result.hasMore,

		// === State ===
		/** Overall loading state (always false for mock data) */
		isLoading,

		// === Actions ===
		/** Update pagination settings and refetch data */
		setPagination: (pagination: PlayerListOptions["pagination"]) =>
			setOptions((prev) => ({ ...prev, pagination })),

		/** Update sorting configuration and refetch data */
		setSorting: (sorting: PlayerListOptions["sorting"]) =>
			setOptions((prev) => ({ ...prev, sorting })),

		/** Update filtering criteria and refetch data */
		setFiltering: (filtering: PlayerListOptions["filtering"]) =>
			setOptions((prev) => ({ ...prev, filtering })),

		/** Update all options at once */
		setOptions,

		/** Current query options being used */
		currentOptions: options,
	};
}
