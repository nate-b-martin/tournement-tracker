/**
 * Teams Table Component
 *
 * This component displays a table of teams with their information.
 * Supports filtering by status and search, alongside sorting and pagination.
 *
 * @fileoverview Table component for displaying team data
 */

import { useState } from "react";
import { type TeamListOptions, useTeams } from "@/hooks/useTeams";
import { cn } from "@/lib/utils";
import { DataTable } from "./DataTable/DataTable";
import type { ColumnDef } from "./DataTable/types";

interface Team {
	_id: string;
	tournamentId: string;
	name: string;
	description?: string;
	coachName: string;
	coachEmail: string;
	coachPhone: string;
	city?: string;
	homeField?: string;
	organization?: string;
	teamAgeGroup?: string;
	status: "active" | "inactive" | "suspended";
	captainPlayerId?: string;
	createdAt: number;
	updatedAt: number;
}

interface TeamsTableProps {
	initialOptions?: TeamListOptions;
	isAdmin?: boolean;
}

const teamColumns: ColumnDef<Team>[] = [
	{
		header: "Team Name",
		field: "name",
		sortable: true,
		cell: (team) => <span className="font-medium">{team.name}</span>,
	},
	{
		header: "Coach",
		field: "coachName",
		sortable: true,
		cell: (team) => <span>{team.coachName}</span>,
	},
	{
		header: "Email",
		field: "coachEmail",
		sortable: true,
		cell: (team) => <span>{team.coachEmail || "-"}</span>,
	},
	{
		header: "Phone",
		field: "coachPhone",
		sortable: true,
		cell: (team) => <span>{team.coachPhone || "-"}</span>,
	},
	{
		header: "Organization",
		field: "organization",
		sortable: true,
		cell: (team) => <span>{team.organization || "-"}</span>,
	},
	{
		header: "Status",
		field: "status",
		sortable: true,
		cell: (team) => (
			<span
				className={cn(
					"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
					team.status === "active" &&
						"border border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
					team.status === "inactive" &&
						"border border-slate-500/30 bg-slate-500/15 text-slate-300",
					team.status === "suspended" &&
						"border border-red-500/30 bg-red-500/15 text-red-300",
				)}
			>
				{team.status}
			</span>
		),
	},
];

export function TeamsTable({ initialOptions, isAdmin }: TeamsTableProps) {
	const {
		teams,
		totalCount,
		isLoading,
		setPagination,
		setSorting,
		setFiltering,
		currentOptions,
	} = useTeams(initialOptions);

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState(
		initialOptions?.filtering?.status?.[0] || "all",
	);

	const filterTeamsBySearch = (
		teamsList: Team[],
		query: string,
	): Team[] => {
		const trimmedQuery = query.trim().toLowerCase();
		if (!trimmedQuery) return teamsList;

		return teamsList.filter(
			(team) =>
				team.name.toLowerCase().includes(trimmedQuery) ||
				team.coachName.toLowerCase().includes(trimmedQuery) ||
				team.coachEmail?.toLowerCase().includes(trimmedQuery) ||
				team.organization?.toLowerCase().includes(trimmedQuery),
		);
	};

	const buildFiltering = (status: string): TeamListOptions["filtering"] => {
		const nextFiltering: NonNullable<TeamListOptions["filtering"]> = {};

		if (status !== "all") {
			nextFiltering.status = [status];
		}

		if (currentOptions?.filtering?.tournamentId) {
			nextFiltering.tournamentId = currentOptions.filtering.tournamentId;
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

	const filteredTeams = filterTeamsBySearch(teams, searchQuery);

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

	const handleEdit = (team: Team) => {
		if (import.meta.env.DEV) {
			console.log("Editing team:", team);
		}
	};

	const handleDelete = (team: Team) => {
		if (import.meta.env.DEV) {
			console.log("Deleting team:", team);
		}
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
			label: "Suspended",
			active: statusFilter === "suspended",
			onClick: () => {
				setStatusFilter("suspended");
				applyStatusFilter("suspended");
			},
		},
	];

	return (
		<DataTable
			data={filteredTeams}
			columns={teamColumns}
			isLoading={isLoading}
			totalCount={totalCount}
			pagination={currentOptions?.pagination || { pageIndex: 0, pageSize: 10 }}
			onPaginationChange={handlePaginationChange}
			sorting={currentOptions?.sorting}
			onSort={handleSort}
			emptyMessage="No teams found"
			itemName="teams"
			toolbar={{
				search: {
					value: searchQuery,
					placeholder: "Search teams, coach name, organization...",
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
