import { useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

export type GameWithTeams = Doc<"games"> & {
	team1: Doc<"teams"> | null;
	team2: Doc<"teams"> | null;
	winner: Doc<"teams"> | null;
};

export interface GameListOptions {
	pagination?: {
		pageIndex: number;
		pageSize: number;
	};
	sorting?: {
		field: string;
		direction: "asc" | "desc";
	};
	filtering?: {
		status?: string[];
		round?: number;
		tournamentId?: Id<"tournaments">;
	};
}

export interface GameListResult {
	data: GameWithTeams[];
	totalCount: number;
	hasMore: boolean;
}

export function useGameCount(tournamentId?: Id<"tournaments">) {
	return useQuery(api.games.count, tournamentId ? { tournamentId } : {});
}

export function useGameList(options: GameListOptions = {}) {
	return useQuery(api.games.list, options) as GameListResult | undefined;
}

export function useGamesByTournament(tournamentId: Id<"tournaments">) {
	return useQuery(api.games.getByTournament, {
		tournamentId,
	}) as GameWithTeams[] | undefined;
}

export function useGames(initialOptions?: GameListOptions) {
	const [options, setOptions] = useState<GameListOptions>(
		initialOptions || {
			pagination: { pageIndex: 0, pageSize: 10 },
			sorting: { field: "round", direction: "asc" },
		},
	);

	const result = useGameList(options);
	const count = useGameCount(options.filtering?.tournamentId);

	const isLoading = result === undefined || count === undefined;

	const setPagination = useCallback(
		(pagination: GameListOptions["pagination"]) =>
			setOptions((prev) => ({ ...prev, pagination })),
		[],
	);

	const setSorting = useCallback(
		(sorting: GameListOptions["sorting"]) =>
			setOptions((prev) => ({ ...prev, sorting })),
		[],
	);

	const setFiltering = useCallback(
		(filtering: GameListOptions["filtering"]) =>
			setOptions((prev) => ({ ...prev, filtering })),
		[],
	);

	return {
		games: result?.data || [],
		totalCount: result?.totalCount || count || 0,
		hasMore: result?.hasMore || false,
		isLoading,
		setPagination,
		setSorting,
		setFiltering,
		setOptions,
		currentOptions: options,
	};
}

export function useGameMutations() {
	const createGame = useMutation(api.games.create);
	const updateGame = useMutation(api.games.update);
	const removeGame = useMutation(api.games.remove);

	return { createGame, updateGame, removeGame };
}
