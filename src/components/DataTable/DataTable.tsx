import { useMemo } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
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
	if (currentSort?.field !== field) return null;
	return (
		<span className="ml-1">{currentSort.direction === "asc" ? "▲" : "▼"}</span>
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
	const actionsColumn: ColumnDef<T> | null = useMemo(() => {
		if (!actions?.canEdit && !actions?.canDelete) {
			return null;
		}

		return {
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
	}, [actions]);

	// Combine columns
	const allColumns = useMemo(() => {
		return actionsColumn ? [...columns, actionsColumn] : columns;
	}, [columns, actionsColumn]);
	if (isLoading) {
		return <div className="p-4">Loading {itemName}...</div>;
	}
	return (
		<div className="container grid space-y-4 mt-3 max-h-1/2">
			{/* Summary */}
			<div className="text-sm text-gray-600 mb-4">
				<span>
					Showing {paginationState.startIndex}—{paginationState.endIndex} of{" "}
					{totalCount} {itemName}
				</span>
				{paginationState.totalPages > 1 && (
					<span className="ml-4 text-gray-500">
						(Page {paginationState.currentPage + 1} of{" "}
						{paginationState.totalPages})
					</span>
				)}
			</div>
			{/* Table */}
			<div className="rounded-md border max-h-full overflow-y-auto">
				<Table className="text-table-default">
					<TableHeader>
						<TableRow>
							{allColumns.map((column) => (
								<TableHead
									key={column.field}
									className={`${column.sortable ? "cursor-pointer hover:bg-gray-700" : ""} ${column.className || ""}`}
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
							<TableRow key={item._id}>
								{allColumns.map((column) => (
									<TableCell
										key={`${item._id}-${column.field}`}
										className={column.className}
									>
										{column.cell(item)}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
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
			{/* Empty state */}
			{data.length === 0 && (
				<div className="text-center py-8 text-gray-500">{emptyMessage}</div>
			)}
			{/* Debug info */}
			{debugInfo && (
				<div className="text-xs text-gray-500 mt-4 p-2 bg-gray-50 rounded">
					<div>Debug info:</div>
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
