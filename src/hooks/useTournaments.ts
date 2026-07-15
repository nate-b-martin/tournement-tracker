import { useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

export type TournamentWithMeta = Doc<"tournaments">;

export interface TournamentListOptions {
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

export function useTournaments(initialOptions?: TournamentListOptions) {
	const [currentOptions, setCurrentOptions] = useState<TournamentListOptions>(
		initialOptions || {
			pagination: { pageIndex: 0, pageSize: 10 },
			sorting: { field: "name", direction: "asc" },
		},
	);

	const result = useQuery(api.tournaments.list, currentOptions);
	const count = useQuery(api.tournaments.count);
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
		(filtering?: TournamentListOptions["filtering"]) => {
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
		tournaments: result?.data || [],
		totalCount: result?.totalCount || count || 0,
		isLoading,
		setPagination,
		setSorting,
		setFiltering,
		currentOptions,
	};
}

export function useTournamentById(id: string | undefined) {
	return useQuery(
		api.tournaments.getById,
		id ? { id: id as Id<"tournaments"> } : "skip",
	);
}

export function useTournamentCount() {
	return useQuery(api.tournaments.count);
}
