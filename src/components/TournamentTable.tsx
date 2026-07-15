import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
	type TournamentListOptions,
	useTournaments,
} from "@/hooks/useTournaments";
import { cn } from "@/lib/utils";
import type { Doc } from "../../convex/_generated/dataModel";
import { DataTable } from "./DataTable/DataTable";
import type { ColumnDef } from "./DataTable/types";

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
	registration_closed:
		"border border-amber-500/30 bg-amber-500/15 text-amber-300",
	active: "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
	complete: "border border-purple-500/30 bg-purple-500/15 text-purple-300",
};

const BRACKET_LABELS: Record<string, string> = {
	single_elimination: "Single Elim",
	double_elimination: "Double Elim",
	round_robin: "Round Robin",
};

const tournamentColumns: ColumnDef<Tournament>[] = [
	{
		header: "Name",
		field: "name",
		sortable: true,
		cell: (t) => (
			<Link
				to="/tournaments/$id"
				params={{ id: t._id }}
				className="font-medium hover:text-primary transition-colors"
			>
				{t.name}
			</Link>
		),
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
			<span>
				{t.currentTeamCount} / {t.maxTeams}
			</span>
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
			<span
				className={cn(
					"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
					STATUS_STYLES[t.status] || STATUS_STYLES.draft,
				)}
			>
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
			<span>
				{t.startDate ? new Date(t.startDate).toLocaleDateString() : "-"}
			</span>
		),
	},
];

const STATUS_FILTERS = [
	{ value: "all", label: "All Statuses" },
	{ value: "draft", label: "Draft" },
	{ value: "registration_open", label: "Open" },
	{ value: "registration_closed", label: "Closed" },
	{ value: "active", label: "Active" },
	{ value: "complete", label: "Complete" },
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
				onEdit: onEdit ? (item: Tournament) => onEdit(item) : undefined,
				onDelete: onDelete ? (item: Tournament) => onDelete(item) : undefined,
			}}
		/>
	);
}
