import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

export type GameStatWithPlayer = Doc<"gameStats"> & {
	player: Doc<"players"> | null;
};

export type GameStatWithGame = Doc<"gameStats"> & {
	game: Doc<"games"> | null;
};

export function useGameStatsByGame(gameId: Id<"games">) {
	return useQuery(api.gameStats.getByGame, { gameId }) as
		| GameStatWithPlayer[]
		| undefined;
}

export function useGameStatsByPlayer(playerId: Id<"players">) {
	return useQuery(api.gameStats.getByPlayer, { playerId }) as
		| GameStatWithGame[]
		| undefined;
}

export function useGameStatsMutations() {
	const upsert = useMutation(api.gameStats.upsert);

	return { upsert };
}
