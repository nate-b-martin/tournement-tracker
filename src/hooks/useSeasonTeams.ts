import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function useSeasonTeams(seasonId: string | undefined) {
	const result = useQuery(
		api.seasonTeams.listBySeason,
		seasonId ? { seasonId: seasonId as Id<"seasons"> } : "skip",
	);

	return {
		teams: result || [],
		isLoading: result === undefined,
	};
}
