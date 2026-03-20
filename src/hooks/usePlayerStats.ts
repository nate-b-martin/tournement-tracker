import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

export type PlayerStatsWithTeam = Doc<"players"> & {
	team: Doc<"teams"> | null;
	gamesPlayed: number;
	atBats: number;
	hits: number;
	singles: number;
	doubles: number;
	triples: number;
	homeRuns: number;
	rbi: number;
	battingAverage: number;
};

export interface PlayerStatsListOptions {
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
		teamId?: Id<"teams">;
	};
}

interface PlayerStatsListResult {
	data: PlayerStatsWithTeam[];
	totalCount: number;
	hasMore: boolean;
}

export function usePlayerStatsList(options: PlayerStatsListOptions = {}) {
	return useQuery(api.playerStats.list, options) as
		| PlayerStatsListResult
		| undefined;
}

export function usePlayerStats(initialOptions?: PlayerStatsListOptions) {
	const [options, setOptions] = useState<PlayerStatsListOptions>(
		initialOptions || {},
	);

	const result = usePlayerStatsList(options);
	const isLoading = result === undefined;

	return {
		stats: result?.data || [],
		totalCount: result?.totalCount || 0,
		hasMore: result?.hasMore || false,
		isLoading,
		setPagination: (pagination: PlayerStatsListOptions["pagination"]) =>
			setOptions((prev) => ({ ...prev, pagination })),
		setSorting: (sorting: PlayerStatsListOptions["sorting"]) =>
			setOptions((prev) => ({ ...prev, sorting })),
		setFiltering: (filtering: PlayerStatsListOptions["filtering"]) =>
			setOptions((prev) => ({ ...prev, filtering })),
		setOptions,
		currentOptions: options,
	};
}
