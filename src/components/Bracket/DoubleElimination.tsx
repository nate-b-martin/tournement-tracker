import type { BracketViewProps } from "./types";

export function DoubleEliminationBracket({
	games,
}: {
	games: BracketViewProps["games"];
}) {
	const rounds = [...new Set(games.map((g) => g.round))].sort();

	return (
		<div className="overflow-x-auto pb-4">
			<div
				className="grid gap-8 min-w-[600px]"
				style={{
					gridTemplateColumns: `repeat(${rounds.length}, 1fr)`,
				}}
			>
				{rounds.map((round) => {
					const roundGames = games
						.filter((g) => g.round === round)
						.sort((a, b) => a.gameNumber - b.gameNumber);

					return (
						<div key={round} className="space-y-4">
							<h3 className="text-sm font-semibold text-muted-foreground mb-2 text-center">
								Round {round}
							</h3>
							<div className="space-y-3">
								{roundGames.map((game) => (
									<div
										key={game._id}
										className="border rounded-lg p-2 bg-card text-xs"
									>
										<div className="flex justify-between">
											<span
												className={`truncate ${
													game.status === "completed" &&
													game.winnerId === game.team1Id
														? "text-emerald-400 font-bold"
														: ""
												}`}
											>
												{game.team1?.name || "TBD"}
											</span>
											<span className="tabular-nums">
												{game.team1Score ?? "-"}
											</span>
										</div>
										<div className="flex justify-between">
											<span
												className={`truncate ${
													game.status === "completed" &&
													game.winnerId === game.team2Id
														? "text-emerald-400 font-bold"
														: ""
												}`}
											>
												{game.team2?.name || "TBD"}
											</span>
											<span className="tabular-nums">
												{game.team2Score ?? "-"}
											</span>
										</div>
									</div>
								))}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
