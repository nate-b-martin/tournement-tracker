import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { cn } from "@/lib/utils";
import { PaginationControls } from "../PaginationControls";
import { ActionsCell } from "./ActionsCell";
import type { ColumnDef, DataTableProps } from "./types";

function SortIndicator({
	field,
	currentSort,
}: {
	field: string;
	currentSort?: { field: string; direction: "asc" | "desc" };
}) {
	const isActive = currentSort?.field === field;
	if (!isActive) {
		return <span className="ml-1 text-muted-foreground/40">↕</span>;
	}

	return (
		<span className="ml-1 text-primary">
			{currentSort.direction === "asc" ? "▲" : "▼"}
		</span>
	);
}

export function DataTable<T extends { _id: string }>({
	data,
	columns,
	isLoading,
	totalCount,
	pagination,
	onPaginationChange,
	sorting,
	onSort,
	emptyMessage = "No items found",
	itemName,
	debugInfo,
	actions,
	toolbar,
}: DataTableProps<T>) {
	const paginationState = usePagination(
		totalCount,
		pagination.pageIndex,
		pagination.pageSize,
	);

	const handleHeaderClick = (column: ColumnDef<T>) => {
		if (!column.sortable || !onSort) return;
		onSort(column.field);
	};

	// Build actions column if actions are enabled
	let actionsColumn: ColumnDef<T> | null = null;
	if (actions?.canEdit || actions?.canDelete) {
		actionsColumn = {
			header: "Actions",
			field: "actions",
			sortable: false,
			cell: (item: T) => (
				<ActionsCell
					item={item}
					canEdit={actions.canEdit}
					canDelete={actions.canDelete}
					onEdit={actions.onEdit}
					onDelete={actions.onDelete}
				/>
			),
		};
	}

	// Combine columns
	const allColumns = actionsColumn ? [...columns, actionsColumn] : columns;
	if (isLoading) {
		return (
			<div className="mt-3 rounded-2xl border border-card-outline/70 bg-card/50 p-10 text-center text-muted-foreground">
				Loading {itemName}...
			</div>
		);
	}

	return (
		<div className="mt-4 space-y-4">
			<div className="rounded-2xl border border-card-outline/70 bg-card/50 p-5 shadow-md">
				{toolbar && (
					<div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex flex-1 flex-wrap items-center gap-2">
							{toolbar.search && (
								<div className="relative min-w-64 grow max-w-xl">
									<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<input
										type="text"
										value={toolbar.search.value}
										onChange={(e) => toolbar.search?.onChange(e.target.value)}
										placeholder={toolbar.search.placeholder || "Search..."}
										className="h-10 w-full rounded-full border border-card-outline/70 bg-background/80 px-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
									/>
								</div>
							)}
							{toolbar.filters?.map((filter) => (
								<button
									key={filter.label}
									type="button"
									onClick={filter.onClick}
									className={cn(
										"rounded-full border px-3 py-2 text-xs font-semibold tracking-wide transition-colors",
										filter.active
											? "border-primary/50 bg-primary/15 text-primary"
											: "border-card-outline/70 bg-background/70 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
									)}
								>
									{filter.label}
								</button>
							))}
							{toolbar.extraContent}
						</div>

						{toolbar.actions && toolbar.actions.length > 0 && (
							<div className="flex items-center gap-2 self-start lg:self-auto">
								{toolbar.actions.map((action) => (
									<Button
										key={action.label}
										type="button"
										variant={action.variant || "outline"}
										size="sm"
										onClick={action.onClick}
									>
										{action.label}
									</Button>
								))}
							</div>
						)}
					</div>
				)}

				<div className="mb-3 text-sm text-muted-foreground">
					<span>
						Showing {paginationState.startIndex}—{paginationState.endIndex} of{" "}
						{totalCount} {itemName || "items"}
					</span>
					{paginationState.totalPages > 1 && (
						<span className="ml-2 font-medium">
							(Page {paginationState.currentPage + 1} of{" "}
							{paginationState.totalPages})
						</span>
					)}
				</div>

				<div className="overflow-hidden rounded-xl border border-card-outline/70 bg-background/40">
					<div className="max-h-[60vh] overflow-y-auto">
						<Table className="text-table-default">
							<TableHeader className="bg-muted/40">
								<TableRow>
									{allColumns.map((column) => (
										<TableHead
											key={column.field}
											className={cn(
												"sticky top-0 z-10 h-12 bg-muted/70 px-4 text-xs uppercase tracking-wider text-muted-foreground backdrop-blur",
												column.sortable && "cursor-pointer hover:bg-muted/60",
												column.className,
											)}
											onClick={() => handleHeaderClick(column)}
										>
											<div className="flex items-center">
												{column.header}
												{column.sortable && (
													<SortIndicator
														field={column.field}
														currentSort={sorting}
													/>
												)}
											</div>
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.map((item) => (
									<TableRow
										key={item._id}
										className="h-14 border-card-outline/30"
									>
										{allColumns.map((column) => (
											<TableCell
												key={`${item._id}-${column.field}`}
												className={cn("px-4 py-3 text-sm", column.className)}
											>
												{column.cell(item)}
											</TableCell>
										))}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>

				<PaginationControls
					currentPage={paginationState.currentPage}
					totalPages={paginationState.totalPages}
					pageSize={paginationState.pageSize}
					totalCount={totalCount}
					hasNextPage={paginationState.hasNextPage}
					hasPreviousPage={paginationState.hasPreviousPage}
					onPageChange={(page) =>
						onPaginationChange({
							pageIndex: page,
							pageSize: paginationState.pageSize,
						})
					}
					onPageSizeChange={(size) =>
						onPaginationChange({ pageIndex: 0, pageSize: size })
					}
				/>
			</div>

			{/* Empty state */}
			{data.length === 0 && (
				<div className="rounded-xl border border-dashed border-card-outline/80 bg-card/20 px-6 py-12 text-center text-muted-foreground">
					<div className="mb-2 font-orbitron text-lg text-foreground/80">
						No results
					</div>
					<div>{emptyMessage}</div>
				</div>
			)}

			{/* Debug info */}
			{debugInfo && (
				<div className="rounded-lg border border-card-outline/60 bg-muted/20 p-3 text-xs text-muted-foreground">
					<div className="mb-1">Debug info:</div>
					{Object.entries(debugInfo).map(([key, value]) => (
						<div key={key}>
							{key}:{" "}
							{typeof value === "object"
								? JSON.stringify(value)
								: String(value)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
