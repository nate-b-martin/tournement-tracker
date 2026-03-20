import { useQuery } from "convex/react";
import { useState, useCallback } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export interface TeamListOptions {
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
		tournamentId?: Id<"tournaments">;
	};
}

export function useTeams(initialOptions?: TeamListOptions) {
	const [currentOptions, setCurrentOptions] = useState<TeamListOptions>(
		initialOptions || {
			pagination: { pageIndex: 0, pageSize: 10 },
			sorting: { field: "name", direction: "asc" },
		},
	);

	const result = useQuery(api.teams.list, currentOptions);
	const teams = result?.teams || [];
	const totalCount = result?.totalCount || 0;
	const isLoading = result === undefined;

	const setPagination = useCallback((pagination: { pageIndex: number; pageSize: number }) => {
		setCurrentOptions((prev) => ({
			...prev,
			pagination,
		}));
	}, []);

	const setSorting = useCallback((sorting: { field: string; direction: "asc" | "desc" }) => {
		setCurrentOptions((prev) => ({
			...prev,
			sorting,
		}));
	}, []);

	const setFiltering = useCallback((filtering?: TeamListOptions["filtering"]) => {
		setCurrentOptions((prev) => ({
			...prev,
			filtering,
			pagination: { pageIndex: 0, pageSize: prev.pagination?.pageSize || 10 },
		}));
	}, []);

	return {
		teams,
		totalCount,
		isLoading,
		setPagination,
		setSorting,
		setFiltering,
		currentOptions,
	};
}
