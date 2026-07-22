import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SeasonGameWithTeams } from "@/hooks/useSeasonGames";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { GenerateBracketDialog } from "./GenerateBracketDialog";

interface SeasonStandingsViewProps {
	games: SeasonGameWithTeams[];
	teams: Doc<"teams">[];
	isAdmin?: boolean;
	seasonId?: Id<"seasons">;
	linkedTournament?: {
		_id: Id<"tournaments">;
		name: string;
		bracketType: string;
	} | null;
	regularSeasonComplete?: boolean;
}

export function SeasonStandingsView({
	games,
	teams,
	isAdmin,
	seasonId,
	linkedTournament,
	regularSeasonComplete,
}: SeasonStandingsViewProps) {
	const [bracketDialogOpen, setBracketDialogOpen] = useState(false);
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
		if (!game.homeTeam || !game.awayTeam) continue;

		const homeId = game.homeTeamId;
		const awayId = game.awayTeamId;
		const homeScore = game.homeScore ?? 0;
		const awayScore = game.awayScore ?? 0;

		const home = teamStats.get(homeId);
		const away = teamStats.get(awayId);

		if (home && away) {
			home.gamesPlayed++;
			away.gamesPlayed++;
			home.pointsFor += homeScore;
			home.pointsAgainst += awayScore;
			away.pointsFor += awayScore;
			away.pointsAgainst += homeScore;

			if (homeScore > awayScore) {
				home.wins++;
				away.losses++;
			} else if (awayScore > homeScore) {
				away.wins++;
				home.losses++;
			} else {
				home.ties++;
				away.ties++;
			}
		}
	}

	const sorted = [...teamStats.values()].sort((a, b) => {
		const aPct = a.gamesPlayed > 0 ? a.wins / a.gamesPlayed : 0;
		const bPct = b.gamesPlayed > 0 ? b.wins / b.gamesPlayed : 0;
		if (bPct !== aPct) return bPct - aPct;
		return b.pointsFor - a.pointsFor;
	});

	const hasCompletedGames = games.some((g) => g.status === "completed");

	if (sorted.length === 0 || sorted.every((s) => s.gamesPlayed === 0)) {
		return (
			<div className="text-center py-12 text-muted-foreground">
				No completed games to calculate standings.
			</div>
		);
	}

	return (
		<>
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
									<td className="py-2 px-3 text-center">
										{winPct === "-" ? "-" : `${winPct}%`}
									</td>
									<td className="py-2 px-3 text-center">{stat.pointsFor}</td>
									<td className="py-2 px-3 text-center">
										{stat.pointsAgainst}
									</td>
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
			{regularSeasonComplete && (
				<div className="mt-2 text-xs text-emerald-400 text-right">
					Regular season complete — ready for playoffs
				</div>
			)}
			{isAdmin && hasCompletedGames && seasonId && (
				<div className="mt-4 flex justify-end">
					<Button
						type="button"
						variant="default"
						onClick={() => setBracketDialogOpen(true)}
					>
						Generate Tournament Bracket
					</Button>
				</div>
			)}
			{seasonId && (
				<GenerateBracketDialog
					seasonId={seasonId}
					tournamentId={linkedTournament?._id ?? null}
					bracketType={linkedTournament?.bracketType}
					teamCount={teams.length}
					open={bracketDialogOpen}
					onOpenChange={setBracketDialogOpen}
				/>
			)}
		</>
	);
}
