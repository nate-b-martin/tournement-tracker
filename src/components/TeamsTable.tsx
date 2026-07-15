/**
 * Teams Table Component
 *
 * This component displays a table of teams with their information.
 * Supports filtering by status and search, alongside sorting and pagination.
 *
 * @fileoverview Table component for displaying team data
 */

import { useMutation, useQuery } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { type TeamListOptions, useTeams } from "@/hooks/useTeams";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { ConfirmDelete } from "./ConfirmDelete";
import { DataTable } from "./DataTable/DataTable";
import type { ColumnDef } from "./DataTable/types";
import { TeamDialog } from "./TeamDialog";
import { TeamRosterDialog } from "./TeamRosterDialog";

type Team = Doc<"teams"> & { playerCount?: number };

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
		header: "Players",
		field: "playerCount",
		sortable: false,
		cell: (team) => <span>{team.playerCount ?? 0}</span>,
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
	const tournamentsResult = useQuery(api.tournaments.list, {});
	const allTournaments = tournamentsResult?.data || [];
	const deleteTeam = useMutation(api.teams.remove);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingTeam, setEditingTeam] = useState<Team | undefined>();
	const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [deletingTeam, setDeletingTeam] = useState<Team | undefined>();
	const [isDeleting, setIsDeleting] = useState(false);

	const [rosterTeam, setRosterTeam] = useState<Team | null>(null);
	const [rosterOpen, setRosterOpen] = useState(false);

	const handleViewRoster = useCallback((team: Team) => {
		setRosterTeam(team);
		setRosterOpen(true);
	}, []);

	const columns = useMemo<ColumnDef<Team>[]>(
		() => [
			...teamColumns,
			{
				header: "",
				field: "roster",
				sortable: false,
				cell: (team) => (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => handleViewRoster(team)}
					>
						View Players
					</Button>
				),
			},
		],
		[handleViewRoster],
	);

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState(
		initialOptions?.filtering?.status?.[0] || "all",
	);

	const filterTeamsBySearch = (teamsList: Team[], query: string): Team[] => {
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
		setEditingTeam(team);
		setDialogMode("edit");
		setDialogOpen(true);
	};

	const handleDelete = (team: Team) => {
		setDeletingTeam(team);
		setDeleteConfirmOpen(true);
	};

	const confirmDelete = async () => {
		if (!deletingTeam) return;
		setIsDeleting(true);
		try {
			await deleteTeam({ id: deletingTeam._id as Id<"teams"> });
			toast.success("Team deleted");
			setDeleteConfirmOpen(false);
			setDeletingTeam(undefined);
		} catch {
			toast.error("Failed to delete team");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleAddTeam = () => {
		setEditingTeam(undefined);
		setDialogMode("create");
		setDialogOpen(true);
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
		<>
			<DataTable
				data={filteredTeams}
				columns={columns}
				isLoading={isLoading}
				totalCount={totalCount}
				pagination={
					currentOptions?.pagination || { pageIndex: 0, pageSize: 10 }
				}
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
						...(isAdmin
							? [
									{
										label: "Add Team",
										variant: "default" as const,
										onClick: handleAddTeam,
									},
								]
							: []),
						{
							label: "Clear filters",
							variant: "ghost" as const,
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
			<TeamDialog
				mode={dialogMode}
				team={editingTeam}
				tournamentId={currentOptions?.filtering?.tournamentId}
				tournaments={allTournaments.map((t) => ({
					_id: t._id as Id<"tournaments">,
					name: t.name,
				}))}
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onSuccess={() => {
					setEditingTeam(undefined);
				}}
			/>
			<ConfirmDelete
				open={deleteConfirmOpen}
				onOpenChange={(val) => {
					setDeleteConfirmOpen(val);
					if (!val) setDeletingTeam(undefined);
				}}
				itemName={deletingTeam ? `${deletingTeam.name}` : "this team"}
				onConfirm={confirmDelete}
				isLoading={isDeleting}
			/>
			<TeamRosterDialog
				team={rosterTeam}
				open={rosterOpen}
				onOpenChange={(val) => {
					setRosterOpen(val);
					if (!val) setRosterTeam(null);
				}}
			/>
		</>
	);
}
