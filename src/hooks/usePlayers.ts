/**
 * Player Hooks - React hooks for fetching and managing player data
 *
 * This file provides a collection of hooks that wrap Convex player queries,
 * offering both simple wrappers for individual queries and a comprehensive
 * hook with built-in state management for complex data table scenarios.
 *
 * @fileoverview Player data management hooks for Convex backend
 * @author Tournament Tracker Team
 */

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

/**
 * Type definition for a player document with associated team data
 *
 * This type extends the base player document with team information,
 * providing a complete view of a player with their team assignment.
 *
 * @example
 * ```typescript
 * const player: PlayerWithTeam = {
 *   _id: "player123",
 *   firstName: "John",
 *   lastName: "Doe",
 *   teamId: "team456",
 *   team: { _id: "team456", name: "Warriors" }
 * };
 * ```
 */
export type PlayerWithTeam = Doc<"players"> & {
	team: Doc<"teams"> | null;
};

/**
 * Interface for configuring player list queries
 *
 * Matches the argument structure defined in convex/players.ts,
 * allowing fine-grained control over data retrieval.
 *
 * @interface PlayerListOptions
 */
export interface PlayerListOptions {
	/** Pagination configuration for result limiting */
	pagination?: {
		/** Zero-based page index (0 = first page) */
		pageIndex: number;
		/** Number of items per page */
		pageSize: number;
	};

	/** Sorting configuration for result ordering */
	sorting?: {
		/** Field to sort by (e.g., "firstName", "lastName", "status") */
		field: string;
		/** Sort direction - ascending or descending */
		direction: "asc" | "desc";
	};

	/** Filtering configuration for result narrowing */
	filtering?: {
		/** Text search across name, email, and phone fields */
		search?: string;
		/** Filter by player status values */
		status?: string[];
		/** Filter by specific team ID */
		teamId?: Id<"teams">;
	};
}

/**
 * Return type structure for paginated player list queries
 *
 * Contains the actual data along with metadata about pagination
 * and total result counts for UI components like data tables.
 */
export interface PlayerListResult {
	/** Array of players with their team data */
	data: PlayerWithTeam[];
	/** Total number of players matching the criteria (before pagination) */
	totalCount: number;
	/** Whether more results are available on the next page */
	hasMore: boolean;
}

/**
 * Simple hook to get the total count of all players
 *
 * @returns {number | undefined} Total player count or undefined while loading
 *
 * @example
 * ```typescript
 * const playerCount = usePlayerCount();
 * if (playerCount === undefined) return <div>Loading...</div>;
 * return <div>Total players: {playerCount}</div>;
 * ```
 */
export function usePlayerCount() {
	return useQuery(api.players.count);
}

/**
 * Hook to fetch a specific player by ID with associated team data
 *
 * Uses conditional querying - will not execute if ID is undefined.
 *
 * @param id - The player ID to fetch, or undefined to skip the query
 * @returns {PlayerWithTeam | null | undefined} Player with team data, null if not found, or undefined while loading
 *
 * @example
 * ```typescript
 * const player = usePlayerById(playerId);
 * if (player === undefined) return <div>Loading...</div>;
 * if (player === null) return <div>Player not found</div>;
 * return <div>{player.firstName} {player.team?.name}</div>;
 * ```
 */
export function usePlayerById(id: Id<"players"> | undefined) {
	// Use "skip" to prevent unnecessary queries when ID is undefined
	return useQuery(api.players.getById, id ? { id } : "skip");
}

/**
 * Hook to search players by text query
 *
 * Searches across first name, last name, and email fields.
 * Automatically re-runs when searchQuery changes.
 *
 * @param searchQuery - The search term to find players by
 * @returns {PlayerWithTeam[] | undefined} Array of matching players or undefined while loading
 *
 * @example
 * ```typescript
 * const [searchTerm, setSearchTerm] = useState("");
 * const results = usePlayerSearch(searchTerm);
 *
 * return (
 *   <input
 *     value={searchTerm}
 *     onChange={(e) => setSearchTerm(e.target.value)}
 *     placeholder="Search players..."
 *   />
 * );
 * ```
 */
export function usePlayerSearch(searchQuery: string) {
	return useQuery(api.players.search, { query: searchQuery });
}

/**
 * Direct hook to fetch paginated player list with full control
 *
 * This is a thin wrapper around the Convex list query that provides
 * the same interface as the backend function. Use this when you need
 * complete control over query parameters or want to manage state externally.
 *
 * @param options - Query configuration options (pagination, sorting, filtering)
 * @returns {PlayerListResult | undefined} Paginated results or undefined while loading
 *
 * @example
 * ```typescript
 * const result = usePlayerList({
 *   pagination: { pageIndex: 0, pageSize: 10 },
 *   sorting: { field: "lastName", direction: "asc" },
 *   filtering: { status: ["active"] }
 * });
 * ```
 */
export function usePlayerList(options: PlayerListOptions = {}) {
	// Type assertion helps TypeScript understand the exact return structure
	return useQuery(api.players.list, options) as PlayerListResult | undefined;
}

/**
 * Comprehensive hook for managing player data with built-in state management
 *
 * This is the recommended hook for data tables and complex UI components.
 * It manages pagination, sorting, and filtering state internally while providing
 * a clean API for common operations.
 *
 * @param initialOptions - Optional initial configuration for the query
 * @returns Object containing data, state, and control functions
 *
 * @example
 * ```typescript
 * function PlayerTable() {
 *   const {
 *     players,
 *     totalCount,
 *     isLoading,
 *     setPagination,
 *     setSorting,
 *     setFiltering
 *   } = usePlayers({
 *     pagination: { pageIndex: 0, pageSize: 10 },
 *     sorting: { field: "firstName", direction: "asc" }
 *   });
 *
 *   // Use the data in your table component
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <Table>
 *       {players.map(player => (
 *         <TableRow key={player._id}>
 *           <TableCell>{player.firstName} {player.lastName}</TableCell>
 *           <TableCell>{player.team?.name}</TableCell>
 *         </TableRow>
 *       ))}
 *     </Table>
 *   );
 * }
 * ```
 */
export function usePlayers(initialOptions?: PlayerListOptions) {
	// Internal state for managing query configuration
	const [options, setOptions] = useState<PlayerListOptions>(
		initialOptions || {},
	);

	// Execute the primary list query with current options
	const result = usePlayerList(options);

	// Get total count for pagination metadata (fallback if result doesn't have it)
	const count = usePlayerCount();

	// Determine loading state - true if either query is still loading
	const isLoading = result === undefined || count === undefined;

	return {
		// === Data ===
		/** Array of players for current page */
		players: result?.data || [],

		/** Total number of players matching current filters */
		totalCount: result?.totalCount || count || 0,

		/** Whether more players are available on next page */
		hasMore: result?.hasMore || false,

		// === State ===
		/** Overall loading state for the hook */
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

/**
 * Note: Types are exported inline where they are defined for cleaner organization
 *
 * Components can import types like this:
 * ```typescript
 * import { type PlayerWithTeam, type PlayerListOptions } from '@/hooks/usePlayers';
 * ```
 */
