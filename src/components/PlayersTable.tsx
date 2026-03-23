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
import { type PlayerStatsWithTeam, usePlayerStats } from "@/hooks/usePlayerStats";
import { cn } from "@/lib/utils";
import { DataTable } from "./DataTable/DataTable";
import type { ColumnDef } from "./DataTable/types";

interface PlayersTableProps {
	/** Optional initial options for the players query */
	initialOptions?: PlayerListOptions;
	isAdmin?: boolean;
}

type PlayerTableView = "contact" | "stats";
type PlayerFiltering = NonNullable<PlayerListOptions["filtering"]>;
type FilterTeamId = PlayerFiltering["teamId"];
type FilterStatus = "all" | "active" | "inactive" | "injured";

const DEFAULT_PAGINATION = { pageIndex: 0, pageSize: 10 };
const STATUS_FILTERS: Array<{ value: FilterStatus; label: string }> = [
	{ value: "all", label: "All Statuses" },
	{ value: "active", label: "Active" },
	{ value: "inactive", label: "Inactive" },
	{ value: "injured", label: "Injured" },
];

function isFilterStatus(value: string | undefined): value is FilterStatus {
	return value === "all" || value === "active" || value === "inactive" || value === "injured";
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

const playerStatsColumns: ColumnDef<PlayerStatsWithTeam>[] = [
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
		header: "Team",
		field: "teamId",
		sortable: true,
		cell: (player) => <span>{player.team?.name || "No Team"}</span>,
	},
	{
		header: "Games",
		field: "gamesPlayed",
		sortable: true,
		cell: (player) => <span>{player.gamesPlayed}</span>,
	},
	{
		header: "At Bats",
		field: "atBats",
		sortable: true,
		cell: (player) => <span>{player.atBats}</span>,
	},
	{
		header: "Hits",
		field: "hits",
		sortable: true,
		cell: (player) => <span>{player.hits}</span>,
	},
	{
		header: "1B",
		field: "singles",
		sortable: true,
		cell: (player) => <span>{player.singles}</span>,
	},
	{
		header: "2B",
		field: "doubles",
		sortable: true,
		cell: (player) => <span>{player.doubles}</span>,
	},
	{
		header: "3B",
		field: "triples",
		sortable: true,
		cell: (player) => <span>{player.triples}</span>,
	},
	{
		header: "HR",
		field: "homeRuns",
		sortable: true,
		cell: (player) => <span>{player.homeRuns}</span>,
	},
	{
		header: "RBI",
		field: "rbi",
		sortable: true,
		cell: (player) => <span>{player.rbi}</span>,
	},
	{
		header: "AVG",
		field: "battingAverage",
		sortable: true,
		cell: (player) => <span>{player.battingAverage.toFixed(3)}</span>,
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
	const {
		stats,
		totalCount: statsTotalCount,
		isLoading: statsIsLoading,
		setPagination: setStatsPagination,
		setSorting: setStatsSorting,
		setFiltering: setStatsFiltering,
		currentOptions: statsCurrentOptions,
	} = usePlayerStats(initialOptions);
	const [searchQuery, setSearchQuery] = useState("");
	const [tableView, setTableView] = useState<PlayerTableView>("contact");
	const initialStatus = initialOptions?.filtering?.status?.[0];
	const [statusFilter, setStatusFilter] = useState<FilterStatus>(
		isFilterStatus(initialStatus) ? initialStatus : "all",
	);

	// Client-side search filter function - filters players without API calls
	const filterPlayersBySearch = <
		T extends {
			firstName: string;
			lastName: string;
			email?: string;
			phone?: string;
		},
	>(
		playersList: T[],
		query: string,
	): T[] => {
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
	const buildFiltering = (
		status: FilterStatus,
		teamId?: FilterTeamId,
	): PlayerListOptions["filtering"] => {
		const nextFiltering: PlayerFiltering = {};

		if (status !== "all") {
			nextFiltering.status = [status];
		}

		if (teamId) {
			nextFiltering.teamId = teamId;
		}

		return Object.keys(nextFiltering).length > 0 ? nextFiltering : undefined;
	};

	const resetPagination = () => {
		setPagination({
			pageIndex: DEFAULT_PAGINATION.pageIndex,
			pageSize: currentOptions?.pagination?.pageSize || DEFAULT_PAGINATION.pageSize,
		});
		setStatsPagination({
			pageIndex: DEFAULT_PAGINATION.pageIndex,
			pageSize: statsCurrentOptions?.pagination?.pageSize || DEFAULT_PAGINATION.pageSize,
		});
	};

	const applyStatusFilter = (status: FilterStatus) => {
		setFiltering(buildFiltering(status, currentOptions?.filtering?.teamId));
		setStatsFiltering(
			buildFiltering(status, statsCurrentOptions?.filtering?.teamId),
		);
		resetPagination();
	};

	const clearFilters = () => {
		setSearchQuery("");
		setStatusFilter("all");
		setFiltering(undefined);
		setStatsFiltering(undefined);
		resetPagination();
	};

	// Apply client-side search filter to players data
	const filteredPlayers = filterPlayersBySearch(players, searchQuery);
	const filteredStats = filterPlayersBySearch(stats, searchQuery);

	const handleSort = (field: string) => {
		const activeOptions =
			tableView === "contact" ? currentOptions : statsCurrentOptions;
		const currentSort = activeOptions?.sorting;
		const newDirection =
			currentSort?.field === field && currentSort?.direction === "asc"
				? "desc"
				: "asc";

		if (tableView === "contact") {
			setSorting({ field, direction: newDirection });
			return;
		}

		setStatsSorting({ field, direction: newDirection });
	};

	const handlePaginationChange = (pagination: {
		pageIndex: number;
		pageSize: number;
	}) => {
		if (tableView === "contact") {
			setPagination(pagination);
			return;
		}

		setStatsPagination(pagination);
	};

	const handleEdit = (player: PlayerWithTeam) => {
		console.log("Editing player:", player);
	};

	const handleDelete = (player: PlayerWithTeam) => {
		console.log("Deleting player:", player);
	};

	const toolbarFilters = STATUS_FILTERS.map((filter) => ({
		label: filter.label,
		active: statusFilter === filter.value,
		onClick: () => {
			setStatusFilter(filter.value);
			applyStatusFilter(filter.value);
		},
	}));

	const toggleContent = (
		<div
			className="inline-flex rounded-full border border-card-outline/70 bg-background/70 p-1"
			role="tablist"
			aria-label="Player table view"
		>
			<button
				type="button"
				role="tab"
				aria-selected={tableView === "contact"}
				onClick={() => setTableView("contact")}
				className={cn(
					"rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
					tableView === "contact"
						? "bg-primary/15 text-primary"
						: "text-muted-foreground hover:text-foreground",
				)}
			>
				Contact Info
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={tableView === "stats"}
				onClick={() => setTableView("stats")}
				className={cn(
					"rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
					tableView === "stats"
						? "bg-primary/15 text-primary"
						: "text-muted-foreground hover:text-foreground",
				)}
			>
				Individual Stats
			</button>
		</div>
	);

	if (tableView === "stats") {
		return (
			<DataTable
				data={filteredStats}
				columns={playerStatsColumns}
				isLoading={statsIsLoading}
				totalCount={statsTotalCount}
				pagination={statsCurrentOptions?.pagination || DEFAULT_PAGINATION}
				onPaginationChange={handlePaginationChange}
				sorting={statsCurrentOptions?.sorting}
				onSort={handleSort}
				emptyMessage="No player stats found"
				itemName="players"
				toolbar={{
					search: {
						value: searchQuery,
						placeholder: "Search players...",
						onChange: (value) => {
							setSearchQuery(value);
						},
					},
					filters: toolbarFilters,
					extraContent: toggleContent,
					actions: [
						{
							label: "Clear filters",
							variant: "ghost",
							onClick: clearFilters,
						},
					],
				}}
				actions={{
					canEdit: false,
					canDelete: false,
					onEdit: undefined,
					onDelete: undefined,
				}}
			/>
		);
	}

	return (
		<DataTable
			data={filteredPlayers}
			columns={playerColumns}
			isLoading={isLoading}
			totalCount={totalCount}
			pagination={currentOptions?.pagination || DEFAULT_PAGINATION}
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
				extraContent: toggleContent,
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
