import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

export type PlayerWithTeam = Doc<"players"> & {
	team: Doc<"teams"> | null;
};

export function usePlayerById(id: Id<"players"> | undefined) {
	return useQuery(api.players.getById, id ? { id } : "skip") as
		| PlayerWithTeam
		| null
		| undefined;
}
