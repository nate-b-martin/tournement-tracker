import { DoubleEliminationBracket } from "./DoubleElimination";
import { RoundRobinStandings } from "./RoundRobin";
import { SingleEliminationBracket } from "./SingleElimination";
import type { BracketViewProps } from "./types";

export function BracketView({ bracketType, games }: BracketViewProps) {
	switch (bracketType) {
		case "single_elimination":
			return <SingleEliminationBracket games={games} />;
		case "double_elimination":
			return <DoubleEliminationBracket games={games} />;
		case "round_robin":
			return <RoundRobinStandings games={games} />;
	}
}
