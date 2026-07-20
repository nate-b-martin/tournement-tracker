import { useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

export type SeasonWithMeta = Doc<"seasons">;

export interface SeasonListOptions {
	pagination?: {
		pageIndex: number;
		pageSize: number;
	};
	sorting?: {
		field: string;
		direction: "asc" | "desc";
	};
	filtering?: {
		search?: string;
		status?: string[];
		sport?: string;
	};
}

export function useSeasons(initialOptions?: SeasonListOptions) {
	const [currentOptions, setCurrentOptions] = useState<SeasonListOptions>(
		initialOptions || {
			pagination: { pageIndex: 0, pageSize: 10 },
			sorting: { field: "name", direction: "asc" },
		},
	);

	const result = useQuery(api.seasons.list, currentOptions);
	const count = useQuery(api.seasons.count);
	const isLoading = result === undefined || count === undefined;

	const setPagination = useCallback(
		(pagination: { pageIndex: number; pageSize: number }) => {
			setCurrentOptions((prev) => ({ ...prev, pagination }));
		},
		[],
	);

	const setSorting = useCallback(
		(sorting: { field: string; direction: "asc" | "desc" }) => {
			setCurrentOptions((prev) => ({ ...prev, sorting }));
		},
		[],
	);

	const setFiltering = useCallback(
		(filtering?: SeasonListOptions["filtering"]) => {
			setCurrentOptions((prev) => ({
				...prev,
				filtering,
				pagination: {
					pageIndex: 0,
					pageSize: prev.pagination?.pageSize || 10,
				},
			}));
		},
		[],
	);

	return {
		seasons: result?.data || [],
		totalCount: result?.totalCount || count || 0,
		isLoading,
		setPagination,
		setSorting,
		setFiltering,
		currentOptions,
	};
}

export function useSeasonById(id: string | undefined) {
	return useQuery(
		api.seasons.getById,
		id ? { id: id as Id<"seasons"> } : "skip",
	);
}

export function useSeasonCount() {
	return useQuery(api.seasons.count);
}
