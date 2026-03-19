/**
 * Players Table Component
 *
 * This component displays a table of players with their team information.
 * Currently uses mock data for development.
 *
 * @fileoverview Table component for displaying player data
 */

import { useState } from "react";
import {
	type PlayerListOptions,
	type PlayerWithTeam,
	usePlayers,
} from "@/hooks/usePlayers";
import { cn } from "@/lib/utils";
import { DataTable } from "./DataTable/DataTable";
import type { ColumnDef } from "./DataTable/types";

interface PlayersTableProps {
	/** Optional initial options for the players query */
	initialOptions?: PlayerListOptions;
	isAdmin?: boolean;
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
		cell: (player) => (
			<span
				className={cn(
					"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
					player.status === "active" &&
						"border border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
					player.status === "inactive" &&
						"border border-slate-500/30 bg-slate-500/15 text-slate-300",
					player.status === "injured" &&
						"border border-amber-500/30 bg-amber-500/15 text-amber-300",
				)}
			>
				{player.status}
			</span>
		),
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

export function PlayersTable({ initialOptions, isAdmin }: PlayersTableProps) {
	const {
		players,
		totalCount,
		isLoading,
		setPagination,
		setSorting,
		setFiltering,
		currentOptions,
	} = usePlayers(initialOptions);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState(
		initialOptions?.filtering?.status?.[0] || "all",
	);

	// Client-side search filter function - filters players without API calls
	const filterPlayersBySearch = (
		playersList: PlayerWithTeam[],
		query: string,
	): PlayerWithTeam[] => {
		const trimmedQuery = query.trim().toLowerCase();
		if (!trimmedQuery) return playersList;

		return playersList.filter(
			(player) =>
				player.firstName.toLowerCase().includes(trimmedQuery) ||
				player.lastName.toLowerCase().includes(trimmedQuery) ||
				player.email?.toLowerCase().includes(trimmedQuery) ||
				player.phone?.includes(trimmedQuery),
		);
	};

	// Build backend filtering - only includes status and teamId, NOT search
	const buildFiltering = (status: string): PlayerListOptions["filtering"] => {
		const nextFiltering: NonNullable<PlayerListOptions["filtering"]> = {};

		if (status !== "all") {
			nextFiltering.status = [status];
		}

		if (currentOptions?.filtering?.teamId) {
			nextFiltering.teamId = currentOptions.filtering.teamId;
		}

		return Object.keys(nextFiltering).length > 0 ? nextFiltering : undefined;
	};

	const applyStatusFilter = (status: string) => {
		setFiltering(buildFiltering(status));
		setPagination({
			pageIndex: 0,
			pageSize: currentOptions?.pagination?.pageSize || 10,
		});
	};

	const clearFilters = () => {
		setSearchQuery("");
		setStatusFilter("all");
		setFiltering(undefined);
		setPagination({
			pageIndex: 0,
			pageSize: currentOptions?.pagination?.pageSize || 10,
		});
	};

	// Apply client-side search filter to players data
	const filteredPlayers = filterPlayersBySearch(players, searchQuery);

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

	const handleEdit = (player: PlayerWithTeam) => {
		console.log("Editing player:", player);
	};

	const handleDelete = (player: PlayerWithTeam) => {
		console.log("Deleting player:", player);
	};

	const toolbarFilters = [
		{
			label: "All Statuses",
			active: statusFilter === "all",
			onClick: () => {
				setStatusFilter("all");
				applyStatusFilter("all");
			},
		},
		{
			label: "Active",
			active: statusFilter === "active",
			onClick: () => {
				setStatusFilter("active");
				applyStatusFilter("active");
			},
		},
		{
			label: "Inactive",
			active: statusFilter === "inactive",
			onClick: () => {
				setStatusFilter("inactive");
				applyStatusFilter("inactive");
			},
		},
		{
			label: "Injured",
			active: statusFilter === "injured",
			onClick: () => {
				setStatusFilter("injured");
				applyStatusFilter("injured");
			},
		},
	];

	return (
		<DataTable
			data={filteredPlayers}
			columns={playerColumns}
			isLoading={isLoading}
			totalCount={totalCount}
			pagination={currentOptions?.pagination || { pageIndex: 0, pageSize: 10 }}
			onPaginationChange={handlePaginationChange}
			sorting={currentOptions?.sorting}
			onSort={handleSort}
			emptyMessage="No players found"
			itemName="players"
			toolbar={{
				search: {
					value: searchQuery,
					placeholder: "Search players, email, phone...",
					onChange: (value) => {
						setSearchQuery(value);
					},
				},
				filters: toolbarFilters,
				actions: [
					{
						label: "Clear filters",
						variant: "ghost",
						onClick: clearFilters,
					},
				],
			}}
			actions={{
				canEdit: isAdmin ?? false,
				canDelete: isAdmin ?? false,
				onEdit: handleEdit,
				onDelete: handleDelete,
			}}
		/>
	);
}
