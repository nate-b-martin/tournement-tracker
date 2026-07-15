import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { GameWithDetails } from "./Bracket/types";

interface StandingsViewProps {
	tournamentId: Id<"tournaments">;
	games: GameWithDetails[];
	teams: Doc<"teams">[];
}

export function StandingsView({ games, teams }: StandingsViewProps) {
	const teamStats = new Map<
		string,
		{
			name: string;
			gamesPlayed: number;
			wins: number;
			losses: number;
			ties: number;
			pointsFor: number;
			pointsAgainst: number;
		}
	>();

	for (const t of teams) {
		teamStats.set(t._id, {
			name: t.name,
			gamesPlayed: 0,
			wins: 0,
			losses: 0,
			ties: 0,
			pointsFor: 0,
			pointsAgainst: 0,
		});
	}

	for (const game of games) {
		if (game.status !== "completed") continue;
		if (!game.team1 || !game.team2) continue;
		const t1Id = game.team1Id;
		const t2Id = game.team2Id;
		const t1Score = game.team1Score ?? 0;
		const t2Score = game.team2Score ?? 0;

		const t1 = teamStats.get(t1Id);
		const t2 = teamStats.get(t2Id);

		if (t1 && t2) {
			t1.gamesPlayed++;
			t2.gamesPlayed++;
			t1.pointsFor += t1Score;
			t1.pointsAgainst += t2Score;
			t2.pointsFor += t2Score;
			t2.pointsAgainst += t1Score;

			if (t1Score > t2Score) {
				t1.wins++;
				t2.losses++;
			} else if (t2Score > t1Score) {
				t2.wins++;
				t1.losses++;
			} else {
				t1.ties++;
				t2.ties++;
			}
		}
	}

	const sorted = [...teamStats.values()].sort((a, b) => {
		const aPct = a.gamesPlayed > 0 ? a.wins / a.gamesPlayed : 0;
		const bPct = b.gamesPlayed > 0 ? b.wins / b.gamesPlayed : 0;
		if (bPct !== aPct) return bPct - aPct;
		return b.pointsFor - a.pointsFor;
	});

	if (sorted.length === 0 || sorted.every((s) => s.gamesPlayed === 0)) {
		return (
			<div className="text-center py-12 text-muted-foreground">
				No completed games to calculate standings.
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b text-muted-foreground">
						<th className="text-left py-2 px-3 font-medium">#</th>
						<th className="text-left py-2 px-3 font-medium">Team</th>
						<th className="text-center py-2 px-3 font-medium">GP</th>
						<th className="text-center py-2 px-3 font-medium">W</th>
						<th className="text-center py-2 px-3 font-medium">L</th>
						<th className="text-center py-2 px-3 font-medium">T</th>
						<th className="text-center py-2 px-3 font-medium">Win %</th>
						<th className="text-center py-2 px-3 font-medium">PF</th>
						<th className="text-center py-2 px-3 font-medium">PA</th>
						<th className="text-center py-2 px-3 font-medium">+/-</th>
					</tr>
				</thead>
				<tbody>
					{sorted.map((stat, idx) => {
						const winPct =
							stat.gamesPlayed > 0
								? ((stat.wins / stat.gamesPlayed) * 100).toFixed(1)
								: "-";
						const diff = stat.pointsFor - stat.pointsAgainst;
						return (
							<tr
								key={stat.name}
								className={`border-b last:border-0 ${
									idx < 2 ? "bg-emerald-500/5" : ""
								}`}
							>
								<td className="py-2 px-3 font-medium">{idx + 1}</td>
								<td className="py-2 px-3 font-medium">{stat.name}</td>
								<td className="py-2 px-3 text-center">{stat.gamesPlayed}</td>
								<td className="py-2 px-3 text-center text-emerald-400">
									{stat.wins}
								</td>
								<td className="py-2 px-3 text-center text-red-400">
									{stat.losses}
								</td>
								<td className="py-2 px-3 text-center">{stat.ties}</td>
								<td className="py-2 px-3 text-center">{winPct}%</td>
								<td className="py-2 px-3 text-center">{stat.pointsFor}</td>
								<td className="py-2 px-3 text-center">{stat.pointsAgainst}</td>
								<td
									className={`py-2 px-3 text-center tabular-nums ${
										diff > 0
											? "text-emerald-400"
											: diff < 0
												? "text-red-400"
												: ""
									}`}
								>
									{diff > 0 ? "+" : ""}
									{diff}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
