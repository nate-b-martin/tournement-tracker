import type { Doc } from "../../../convex/_generated/dataModel";

export type GameWithDetails = Doc<"games"> & {
	team1: Doc<"teams"> | null;
	team2: Doc<"teams"> | null;
	winner: Doc<"teams"> | null;
};

export interface BracketViewProps {
	bracketType: "single_elimination" | "double_elimination" | "round_robin";
	games: GameWithDetails[];
}
