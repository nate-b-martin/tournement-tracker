import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { DataTable } from "@/components/DataTable/DataTable";
import type { ColumnDef } from "@/components/DataTable/types";
import { SeasonDialog } from "@/components/SeasonDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import type { SeasonListOptions } from "@/hooks/useSeasons";
import { useSeasons } from "@/hooks/useSeasons";
import { cn } from "@/lib/utils";
import type { Doc } from "../../convex/_generated/dataModel";

type Season = Doc<"seasons">;

const SEASON_STATUS_STYLES: Record<string, string> = {
	planning: "border border-amber-500/30 bg-amber-500/15 text-amber-300",
	active: "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
	complete: "border border-purple-500/30 bg-purple-500/15 text-purple-300",
};

const seasonColumns: ColumnDef<Season>[] = [
	{
		header: "Name",
		field: "name",
		sortable: true,
		cell: (s) => (
			<Link
				to="/seasons/$id"
				params={{ id: s._id }}
				className="font-medium hover:text-primary transition-colors"
			>
				{s.name}
			</Link>
		),
	},
	{
		header: "Sport",
		field: "sport",
		sortable: true,
		cell: (s) => <span className="capitalize">{s.sport}</span>,
	},
	{
		header: "Status",
		field: "status",
		sortable: true,
		cell: (s) => (
			<span
				className={cn(
					"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
					SEASON_STATUS_STYLES[s.status] || SEASON_STATUS_STYLES.planning,
				)}
			>
				{s.status}
			</span>
		),
	},
	{
		header: "Start Date",
		field: "startDate",
		sortable: true,
		cell: (s) => <span>{new Date(s.startDate).toLocaleDateString()}</span>,
	},
	{
		header: "End Date",
		field: "endDate",
		sortable: true,
		cell: (s) => <span>{new Date(s.endDate).toLocaleDateString()}</span>,
	},
];

export function SeasonsTable() {
	const { isAdmin } = useAuth();
	const {
		seasons,
		totalCount,
		isLoading,
		setPagination,
		setSorting,
		setFiltering,
		currentOptions,
	} = useSeasons();

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [createDialogOpen, setCreateDialogOpen] = useState(false);

	const filterBySearch = (list: Season[], query: string) => {
		const trimmed = query.trim().toLowerCase();
		if (!trimmed) return list;
		return list.filter(
			(s) =>
				s.name.toLowerCase().includes(trimmed) ||
				s.sport.toLowerCase().includes(trimmed),
		);
	};

	const filteredSeasons = filterBySearch(seasons, searchQuery);

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
		const filtering: SeasonListOptions["filtering"] =
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

	const toolbarFilters = [
		{ value: "all", label: "All Statuses" },
		{ value: "planning", label: "Planning" },
		{ value: "active", label: "Active" },
		{ value: "complete", label: "Complete" },
	].map((f) => ({
		label: f.label,
		active: statusFilter === f.value,
		onClick: () => {
			setStatusFilter(f.value);
			applyStatusFilter(f.value);
		},
	}));

	return (
		<div>
			{isAdmin && (
				<div className="mb-4">
					<Button type="button" onClick={() => setCreateDialogOpen(true)}>
						Create Season
					</Button>
				</div>
			)}

			<DataTable
				data={filteredSeasons}
				columns={seasonColumns}
				isLoading={isLoading}
				totalCount={totalCount}
				pagination={
					currentOptions?.pagination || { pageIndex: 0, pageSize: 10 }
				}
				onPaginationChange={handlePaginationChange}
				sorting={currentOptions?.sorting}
				onSort={handleSort}
				emptyMessage="No seasons found"
				itemName="seasons"
				toolbar={{
					search: {
						value: searchQuery,
						placeholder: "Search seasons...",
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
			/>

			{isAdmin && (
				<SeasonDialog
					mode="create"
					open={createDialogOpen}
					onOpenChange={setCreateDialogOpen}
				/>
			)}
		</div>
	);
}
