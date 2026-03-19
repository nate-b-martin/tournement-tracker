import { Button } from "./ui/button";

interface PaginationControlsProps {
	currentPage: number;
	totalPages: number;
	pageSize: number;
	totalCount: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
}

export const PaginationControls = ({
	currentPage,
	totalPages,
	pageSize,
	totalCount,
	hasNextPage,
	hasPreviousPage,
	onPageChange,
	onPageSizeChange,
}: PaginationControlsProps) => {
	return (
		<div className="mt-1 flex flex-col gap-3 border-t border-card-outline/60 px-2 pt-4 md:flex-row md:items-center md:justify-between">
			{/* Page size selector*/}
			<div className="flex items-center gap-2">
				<span className="text-sm text-muted-foreground">Rows per page</span>
				<select
					value={pageSize}
					onChange={(e) => onPageSizeChange(Number(e.target.value))}
					aria-label="Rows per page"
					className="h-8 rounded-md border border-card-outline/70 bg-background px-2 text-sm text-foreground"
				>
					<option value={10}>10</option>
					<option value={25}>25</option>
					<option value={50}>50</option>
				</select>
				<span className="text-sm text-muted-foreground">of {totalCount}</span>
			</div>
			{/* Page Navigation*/}
			<div className="flex flex-wrap items-center gap-2">
				<Button
					type="button"
					onClick={() => onPageChange(0)}
					disabled={!hasPreviousPage}
					variant="outline"
					size="sm"
					className="min-w-16"
				>
					First
				</Button>
				<Button
					type="button"
					onClick={() => onPageChange(currentPage - 1)}
					disabled={!hasPreviousPage}
					variant="outline"
					size="sm"
					className="min-w-20"
				>
					Previous
				</Button>
				<span className="rounded-md border border-card-outline/70 bg-muted/20 px-2 py-1 text-sm text-muted-foreground">
					Page {currentPage + 1} of {totalPages}
				</span>
				<Button
					type="button"
					onClick={() => onPageChange(currentPage + 1)}
					disabled={!hasNextPage}
					variant="outline"
					size="sm"
					className="min-w-16"
				>
					Next
				</Button>
				<Button
					type="button"
					onClick={() => onPageChange(totalPages - 1)}
					disabled={!hasNextPage}
					variant="outline"
					size="sm"
					className="min-w-16"
				>
					Last
				</Button>
			</div>
		</div>
	);
};
