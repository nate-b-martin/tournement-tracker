import { useMemo, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type {
	TournamentListOptions,
	TournamentWithMeta,
} from "../../hooks/useTournaments";
import { mockTournaments } from "../data/mockTournaments";

export function useMockTournamentCount(): number {
	return mockTournaments.length;
}

export function useMockTournamentById(
	id: Id<"tournaments"> | undefined,
): TournamentWithMeta | null {
	return useMemo(() => {
		if (!id) return null;
		return mockTournaments.find((t) => t._id === id) || null;
	}, [id]);
}

export function useMockTournamentList(options: TournamentListOptions = {}): {
	data: TournamentWithMeta[];
	totalCount: number;
	hasMore: boolean;
} {
	const { pagination, sorting, filtering } = options;

	return useMemo(() => {
		let tournaments = [...mockTournaments];

		if (filtering?.search) {
			const term = filtering.search.toLowerCase();
			tournaments = tournaments.filter(
				(t) =>
					t.name.toLowerCase().includes(term) ||
					t.description?.toLowerCase().includes(term) ||
					t.location?.toLowerCase().includes(term),
			);
		}

		if (filtering?.status && filtering.status.length > 0) {
			tournaments = tournaments.filter((t) =>
				filtering?.status?.includes(t.status),
			);
		}

		if (filtering?.sport) {
			tournaments = tournaments.filter((t) => t.sport === filtering.sport);
		}

		if (sorting) {
			const { field, direction } = sorting;
			tournaments.sort((a, b) => {
				const aVal = a[field as keyof typeof a];
				const bVal = b[field as keyof typeof b];
				if (aVal === undefined && bVal === undefined) return 0;
				if (aVal === undefined) return direction === "asc" ? 1 : -1;
				if (bVal === undefined) return direction === "asc" ? -1 : 1;
				return aVal < bVal
					? direction === "asc"
						? -1
						: 1
					: aVal > bVal
						? direction === "asc"
							? 1
							: -1
						: 0;
			});
		}

		const totalCount = tournaments.length;

		if (pagination) {
			const { pageIndex, pageSize } = pagination;
			const start = pageIndex * pageSize;
			tournaments = tournaments.slice(start, start + pageSize);
		}

		return {
			data: tournaments,
			totalCount,
			hasMore: pagination
				? (pagination.pageIndex + 1) * pagination.pageSize < totalCount
				: false,
		};
	}, [pagination, sorting, filtering]);
}

export function useMockTournaments(initialOptions?: TournamentListOptions) {
	const [options, setOptions] = useState<TournamentListOptions>(
		initialOptions || {},
	);

	const result = useMockTournamentList(options);
	const count = useMockTournamentCount();
	const isLoading = false;

	return {
		tournaments: result.data,
		totalCount: result.totalCount || count,
		hasMore: result.hasMore,
		isLoading,
		setPagination: (pagination: TournamentListOptions["pagination"]) =>
			setOptions((prev) => ({ ...prev, pagination })),
		setSorting: (sorting: TournamentListOptions["sorting"]) =>
			setOptions((prev) => ({ ...prev, sorting })),
		setFiltering: (filtering: TournamentListOptions["filtering"]) =>
			setOptions((prev) => ({ ...prev, filtering })),
		setOptions,
		currentOptions: options,
	};
}
