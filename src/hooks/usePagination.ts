export interface PaginationState {
	currentPage: number;
	pageSize: number;
	totalPages: number;
	startIndex: number;
	endIndex: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	itemCount: number;
}

export function usePagination(
	totalCount: number,
	pageIndex: number,
	pageSize: number,
): PaginationState {
	const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
	const startIndex = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
	const endIndex = Math.min((pageIndex + 1) * pageSize, totalCount);
	const hasNextPage = endIndex < totalCount;
	const hasPreviousPage = pageIndex > 0;

	return {
		currentPage: pageIndex,
		pageSize,
		totalPages,
		startIndex,
		endIndex,
		hasNextPage,
		hasPreviousPage,
		itemCount: totalCount,
	};
}
