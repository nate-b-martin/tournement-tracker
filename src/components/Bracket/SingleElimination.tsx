import type { BracketViewProps } from "./types";

export function SingleEliminationBracket({
	games,
}: {
	games: BracketViewProps["games"];
}) {
	const rounds = [...new Set(games.map((g) => g.round))].sort();
	const maxRounds = rounds.length;

	return (
		<div className="overflow-x-auto pb-4">
			<div
				className="grid gap-8 min-w-[600px]"
				style={{
					gridTemplateColumns: `repeat(${maxRounds}, 1fr)`,
				}}
			>
				{rounds.map((round) => {
					const roundGames = games
						.filter((g) => g.round === round)
						.sort((a, b) => a.gameNumber - b.gameNumber);

					return (
						<div key={round} className="space-y-8">
							<h3 className="text-sm font-semibold text-muted-foreground mb-4 text-center">
								{round === maxRounds
									? "Final"
									: round === maxRounds - 1
										? "Semifinals"
										: `Round ${round}`}
							</h3>
							<div
								className="grid gap-8"
								style={{
									gridTemplateRows: `repeat(${roundGames.length}, minmax(4rem, auto))`,
								}}
							>
								{roundGames.map((game) => {
									const isTeam1Winner =
										game.status === "completed" &&
										game.winnerId === game.team1Id;
									const isTeam2Winner =
										game.status === "completed" &&
										game.winnerId === game.team2Id;
									const team1Score = game.team1Score ?? "-";
									const team2Score = game.team2Score ?? "-";

									return (
										<div
											key={game._id}
											className="border rounded-lg p-3 bg-card"
										>
											<div className="flex items-center justify-between gap-4">
												<span
													className={`text-sm font-medium truncate ${
														isTeam1Winner ? "text-emerald-400 font-bold" : ""
													}`}
												>
													{game.team1?.name || "TBD"}
												</span>
												<span
													className={`text-sm tabular-nums ${
														isTeam1Winner ? "text-emerald-400 font-bold" : ""
													}`}
												>
													{team1Score}
												</span>
											</div>
											<div className="border-t my-1" />
											<div className="flex items-center justify-between gap-4">
												<span
													className={`text-sm font-medium truncate ${
														isTeam2Winner ? "text-emerald-400 font-bold" : ""
													}`}
												>
													{game.team2?.name || "TBD"}
												</span>
												<span
													className={`text-sm tabular-nums ${
														isTeam2Winner ? "text-emerald-400 font-bold" : ""
													}`}
												>
													{team2Score}
												</span>
											</div>
											{game.status === "scheduled" && game.scheduledTime && (
												<p className="text-xs text-muted-foreground mt-1">
													{new Date(game.scheduledTime).toLocaleString()}
												</p>
											)}
										</div>
									);
								})}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
