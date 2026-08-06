import { useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	useGameStatsByGame,
	useGameStatsMutations,
} from "@/hooks/useGameStats";
import type { GameWithTeams } from "@/hooks/useGames";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

interface GameStatsSheetProps {
	game: GameWithTeams;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	isAdmin?: boolean;
}

interface PlayerStatInputs {
	gamesPlayed: string;
	atBats: string;
	hits: string;
	singles: string;
	doubles: string;
	triples: string;
	homeRuns: string;
	rbi: string;
}

function emptyInputs(): PlayerStatInputs {
	return {
		gamesPlayed: "1",
		atBats: "",
		hits: "",
		singles: "",
		doubles: "",
		triples: "",
		homeRuns: "",
		rbi: "",
	};
}

function fromStat(stat: Doc<"gameStats"> | undefined): PlayerStatInputs {
	if (!stat) return emptyInputs();
	return {
		gamesPlayed: stat.gamesPlayed.toString(),
		atBats: stat.atBats.toString(),
		hits: stat.hits.toString(),
		singles: stat.singles.toString(),
		doubles: stat.doubles.toString(),
		triples: stat.triples.toString(),
		homeRuns: stat.homeRuns.toString(),
		rbi: stat.rbi.toString(),
	};
}

export function GameStatsSheet({
	game,
	open,
	onOpenChange,
	isAdmin,
}: GameStatsSheetProps) {
	const gameStats = useGameStatsByGame(game._id as Id<"games">);
	const { upsert } = useGameStatsMutations();

	const team1Players = useQuery(api.players.list, {
		filtering: { teamId: game.team1Id },
	});
	const team2Players = useQuery(api.players.list, {
		filtering: { teamId: game.team2Id },
	});

	const players =
		team1Players?.data && team2Players?.data
			? [...team1Players.data, ...team2Players.data]
			: [];

	const [editingPlayerId, setEditingPlayerId] = useState<Id<"players"> | null>(
		null,
	);
	const [inputs, setInputs] = useState<PlayerStatInputs>(emptyInputs);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleEdit = (playerId: Id<"players">) => {
		const existing = gameStats?.find((s) => String(s.player?._id) === playerId);
		setInputs(fromStat(existing));
		setEditingPlayerId(playerId);
	};

	const handleCancelEdit = () => {
		setEditingPlayerId(null);
		setInputs(emptyInputs());
	};

	const handleSave = async (playerId: Id<"players">) => {
		setIsSubmitting(true);
		try {
			await upsert({
				gameId: game._id as Id<"games">,
				playerId,
				sportType: "softball",
				gamesPlayed: Number(inputs.gamesPlayed) || 0,
				atBats: Number(inputs.atBats) || 0,
				hits: Number(inputs.hits) || 0,
				singles: Number(inputs.singles) || 0,
				doubles: Number(inputs.doubles) || 0,
				triples: Number(inputs.triples) || 0,
				homeRuns: Number(inputs.homeRuns) || 0,
				rbi: Number(inputs.rbi) || 0,
			});
			toast.success("Stats saved");
			setEditingPlayerId(null);
			setInputs(emptyInputs());
		} catch {
			toast.error("Failed to save stats");
		} finally {
			setIsSubmitting(false);
		}
	};

	const totals = (gameStats || []).reduce(
		(acc, s) => ({
			gamesPlayed: acc.gamesPlayed + s.gamesPlayed,
			atBats: acc.atBats + s.atBats,
			hits: acc.hits + s.hits,
			singles: acc.singles + s.singles,
			doubles: acc.doubles + s.doubles,
			triples: acc.triples + s.triples,
			homeRuns: acc.homeRuns + s.homeRuns,
			rbi: acc.rbi + s.rbi,
		}),
		{
			gamesPlayed: 0,
			atBats: 0,
			hits: 0,
			singles: 0,
			doubles: 0,
			triples: 0,
			homeRuns: 0,
			rbi: 0,
		},
	);

	const isLoading =
		gameStats === undefined ||
		team1Players === undefined ||
		team2Players === undefined;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						Game Stats: {game.team1?.name ?? "Team 1"} vs{" "}
						{game.team2?.name ?? "Team 2"}
					</DialogTitle>
				</DialogHeader>

				{isLoading ? (
					<div className="py-8 text-center text-muted-foreground">
						Loading stats...
					</div>
				) : (
					<div className="space-y-6">
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm">
								<thead>
									<tr className="border-b text-muted-foreground">
										<th className="pb-2 pr-4 font-medium">Player</th>
										<th className="pb-2 pr-3 font-medium">AB</th>
										<th className="pb-2 pr-3 font-medium">H</th>
										<th className="pb-2 pr-3 font-medium">1B</th>
										<th className="pb-2 pr-3 font-medium">2B</th>
										<th className="pb-2 pr-3 font-medium">3B</th>
										<th className="pb-2 pr-3 font-medium">HR</th>
										<th className="pb-2 pr-3 font-medium">RBI</th>
										<th className="pb-2 font-medium">AVG</th>
										{isAdmin && (
											<th className="pb-2 pl-2 font-medium">Actions</th>
										)}
									</tr>
								</thead>
								<tbody>
									{players.map((player) => {
										const stat = gameStats?.find(
											(s) => String(s.player?._id) === String(player._id),
										);
										const avg =
											stat && stat.atBats > 0
												? (stat.hits / stat.atBats).toFixed(3)
												: ".000";
										const isEditing = editingPlayerId === String(player._id);

										return (
											<tr key={player._id} className="border-b last:border-0">
												<td className="py-2 pr-4 font-medium">
													{player.firstName} {player.lastName}
												</td>
												{isEditing ? (
													<>
														{(
															[
																"atBats",
																"hits",
																"singles",
																"doubles",
																"triples",
																"homeRuns",
																"rbi",
															] as const
														).map((field) => (
															<td key={field} className="py-2 pr-3">
																<Input
																	type="number"
																	min={0}
																	className="h-8 w-16"
																	value={inputs[field]}
																	onChange={(e) =>
																		setInputs((prev) => ({
																			...prev,
																			[field]: e.target.value,
																		}))
																	}
																/>
															</td>
														))}
														<td className="py-2 pr-3 tabular-nums text-muted-foreground">
															{avg}
														</td>
														<td className="py-2 pl-2">
															<div className="flex gap-1">
																<Button
																	type="button"
																	size="sm"
																	disabled={isSubmitting}
																	onClick={() =>
																		handleSave(player._id as Id<"players">)
																	}
																>
																	Save
																</Button>
																<Button
																	type="button"
																	size="sm"
																	variant="outline"
																	onClick={handleCancelEdit}
																>
																	Cancel
																</Button>
															</div>
														</td>
													</>
												) : (
													<>
														<td className="py-2 pr-3 tabular-nums">
															{stat?.atBats ?? "-"}
														</td>
														<td className="py-2 pr-3 tabular-nums">
															{stat?.hits ?? "-"}
														</td>
														<td className="py-2 pr-3 tabular-nums">
															{stat?.singles ?? "-"}
														</td>
														<td className="py-2 pr-3 tabular-nums">
															{stat?.doubles ?? "-"}
														</td>
														<td className="py-2 pr-3 tabular-nums">
															{stat?.triples ?? "-"}
														</td>
														<td className="py-2 pr-3 tabular-nums">
															{stat?.homeRuns ?? "-"}
														</td>
														<td className="py-2 pr-3 tabular-nums">
															{stat?.rbi ?? "-"}
														</td>
														<td className="py-2 pr-3 tabular-nums">{avg}</td>
														{isAdmin && (
															<td className="py-2 pl-2">
																<Button
																	type="button"
																	size="sm"
																	variant="outline"
																	onClick={() =>
																		handleEdit(player._id as Id<"players">)
																	}
																>
																	{stat ? "Edit" : "Add"}
																</Button>
															</td>
														)}
													</>
												)}
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>

						{gameStats && gameStats.length > 0 && (
							<div className="rounded-lg border p-4">
								<h4 className="mb-2 text-sm font-semibold text-muted-foreground">
									Game Totals
								</h4>
								<div className="flex flex-wrap gap-6 text-sm">
									<div className="flex items-center gap-1">
										<span className="text-muted-foreground">AB:</span>
										<span className="tabular-nums font-medium">
											{totals.atBats}
										</span>
									</div>
									<div className="flex items-center gap-1">
										<span className="text-muted-foreground">H:</span>
										<span className="tabular-nums font-medium">
											{totals.hits}
										</span>
									</div>
									<div className="flex items-center gap-1">
										<span className="text-muted-foreground">1B:</span>
										<span className="tabular-nums font-medium">
											{totals.singles}
										</span>
									</div>
									<div className="flex items-center gap-1">
										<span className="text-muted-foreground">2B:</span>
										<span className="tabular-nums font-medium">
											{totals.doubles}
										</span>
									</div>
									<div className="flex items-center gap-1">
										<span className="text-muted-foreground">3B:</span>
										<span className="tabular-nums font-medium">
											{totals.triples}
										</span>
									</div>
									<div className="flex items-center gap-1">
										<span className="text-muted-foreground">HR:</span>
										<span className="tabular-nums font-medium">
											{totals.homeRuns}
										</span>
									</div>
									<div className="flex items-center gap-1">
										<span className="text-muted-foreground">RBI:</span>
										<span className="tabular-nums font-medium">
											{totals.rbi}
										</span>
									</div>
									<div className="flex items-center gap-1">
										<span className="text-muted-foreground">AVG:</span>
										<span className="tabular-nums font-medium">
											{totals.atBats > 0
												? (totals.hits / totals.atBats).toFixed(3)
												: ".000"}
										</span>
									</div>
								</div>
							</div>
						)}

						{gameStats && gameStats.length === 0 && (
							<div className="py-4 text-center text-sm text-muted-foreground">
								No stats recorded yet.
								{isAdmin ? " Click 'Add' to record player stats." : ""}
							</div>
						)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
