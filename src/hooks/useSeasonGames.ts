import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

export type SeasonGameWithTeams = Doc<"seasonGames"> & {
	homeTeam: Doc<"teams"> | null;
	awayTeam: Doc<"teams"> | null;
};

export function useSeasonGames(seasonId: string | undefined) {
	const games = useQuery(
		api.seasonGames.listBySeason,
		seasonId ? { seasonId: seasonId as Id<"seasons"> } : "skip",
	);

	return {
		games: (games || []) as SeasonGameWithTeams[],
		isLoading: games === undefined,
	};
}
