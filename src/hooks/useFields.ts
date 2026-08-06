import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface UseFieldsOptions {
	tournamentId: Id<"tournaments">;
}

export function useFields(options: UseFieldsOptions) {
	const fields = useQuery(api.fields.listByTournament, {
		tournamentId: options.tournamentId,
	});

	return {
		fields: fields || [],
		isLoading: fields === undefined,
	};
}
