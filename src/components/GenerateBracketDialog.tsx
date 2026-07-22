import { useMutation } from "convex/react";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSeasonGames } from "@/hooks/useSeasonGames";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

interface GenerateBracketDialogProps {
	seasonId: Id<"seasons">;
	tournamentId: Id<"tournaments"> | null;
	bracketType: string | undefined;
	teamCount: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

type TeamStats = {
	teamId: string;
	name: string;
	wins: number;
	gamesPlayed: number;
	pointsFor: number;
	winPct: number;
};

function computeStandings(
	games: Array<{
		status: string;
		homeTeamId: string;
		awayTeamId: string;
		homeScore?: number | null;
		awayScore?: number | null;
		homeTeam?: Doc<"teams"> | null;
		awayTeam?: Doc<"teams"> | null;
	}>,
): TeamStats[] {
	const teamMap = new Map<
		string,
		{ name: string; wins: number; gamesPlayed: number; pointsFor: number }
	>();

	for (const game of games) {
		if (game.status !== "completed") continue;
		if (!game.homeTeam || !game.awayTeam) continue;

		const homeId = game.homeTeamId;
		const awayId = game.awayTeamId;
		const homeScore = game.homeScore ?? 0;
		const awayScore = game.awayScore ?? 0;

		if (!teamMap.has(homeId)) {
			teamMap.set(homeId, {
				name: game.homeTeam.name,
				wins: 0,
				gamesPlayed: 0,
				pointsFor: 0,
			});
		}
		if (!teamMap.has(awayId)) {
			teamMap.set(awayId, {
				name: game.awayTeam.name,
				wins: 0,
				gamesPlayed: 0,
				pointsFor: 0,
			});
		}

		const home = teamMap.get(homeId);
		const away = teamMap.get(awayId);
		if (!home || !away) continue;
		home.gamesPlayed++;
		away.gamesPlayed++;
		home.pointsFor += homeScore;
		away.pointsFor += awayScore;
		if (homeScore > awayScore) home.wins++;
		else if (awayScore > homeScore) away.wins++;
	}

	return [...teamMap.entries()]
		.map(([teamId, stats]) => ({
			teamId,
			...stats,
			winPct: stats.gamesPlayed > 0 ? stats.wins / stats.gamesPlayed : 0,
		}))
		.sort((a, b) => {
			if (b.winPct !== a.winPct) return b.winPct - a.winPct;
			return b.pointsFor - a.pointsFor;
		});
}

function nextPowerOf2(n: number): number {
	let p = 1;
	while (p < n) p *= 2;
	return p;
}

export function GenerateBracketDialog({
	seasonId,
	tournamentId,
	bracketType,
	teamCount,
	open,
	onOpenChange,
	onSuccess,
}: GenerateBracketDialogProps) {
	const generateBracket = useMutation(api.games.generateBracket);
	const { games } = useSeasonGames(seasonId);

	const formId = useId();
	const [playoffTeamsCount, setPlayoffTeamsCount] = useState(
		Math.min(4, teamCount),
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const standings = useMemo(() => computeStandings(games), [games]);

	const bracketSlots = useMemo(
		() => nextPowerOf2(playoffTeamsCount),
		[playoffTeamsCount],
	);

	const projectedSeeds = useMemo(() => {
		const count = Math.min(playoffTeamsCount, standings.length);
		return standings.slice(0, count);
	}, [standings, playoffTeamsCount]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!tournamentId) {
			toast.error("No tournament linked to this season");
			return;
		}
		if (teamCount < 2) {
			toast.error("Need at least 2 teams");
			return;
		}
		if (playoffTeamsCount < 2) {
			toast.error("At least 2 teams needed for playoffs");
			return;
		}

		setIsSubmitting(true);
		try {
			const result = await generateBracket({
				tournamentId,
				seasonId,
				playoffTeamsCount,
			});
			toast.success(
				`Bracket generated: ${result.gamesCreated} games, ${result.rounds} rounds`,
			);
			onOpenChange(false);
			onSuccess?.();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to generate bracket",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const hasCompletedGames = games.some((g) => g.status === "completed");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Generate Tournament Bracket</DialogTitle>
					<DialogDescription>
						Generate a single-elimination bracket from regular season standings.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					{!tournamentId ? (
						<div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
							No tournament linked to this season. Create a tournament first and
							link it to generate a bracket.
						</div>
					) : (
						<>
							<div className="space-y-2">
								<Label htmlFor={`${formId}-playoff-teams`}>
									Teams in Playoffs
								</Label>
								<Input
									id={`${formId}-playoff-teams`}
									type="number"
									min={2}
									max={teamCount}
									value={playoffTeamsCount}
									onChange={(e) => {
										const val = Number.parseInt(e.target.value, 10);
										if (!Number.isNaN(val)) {
											setPlayoffTeamsCount(
												Math.max(2, Math.min(val, teamCount)),
											);
										}
									}}
								/>
								<p className="text-xs text-muted-foreground">
									Max {teamCount} team{teamCount !== 1 ? "s" : ""} in season.
									Bracket will use {bracketSlots} slot
									{bracketSlots !== 1 ? "s" : ""}
									{bracketSlots > playoffTeamsCount
										? ` (${bracketSlots - playoffTeamsCount} bye${bracketSlots - playoffTeamsCount !== 1 ? "s" : ""})`
										: ""}
								</p>
							</div>

							{bracketType && (
								<div className="space-y-1 text-sm">
									<span className="text-muted-foreground">Bracket type: </span>
									<span className="font-medium capitalize">
										{bracketType.replace(/_/g, " ")}
									</span>
								</div>
							)}

							{projectedSeeds.length > 0 && (
								<div className="rounded-lg border bg-muted/50 p-3">
									<p className="text-sm font-medium mb-2">Projected Seeds</p>
									<table className="w-full text-xs">
										<thead>
											<tr className="text-muted-foreground border-b">
												<th className="text-left py-1 pr-2">#</th>
												<th className="text-left py-1 pr-2">Team</th>
												<th className="text-center py-1 pr-2">W</th>
												<th className="text-center py-1 pr-2">Win %</th>
												<th className="text-center py-1">PF</th>
											</tr>
										</thead>
										<tbody>
											{projectedSeeds.map((team, idx) => (
												<tr
													key={team.teamId}
													className="border-b last:border-0"
												>
													<td className="py-1 pr-2 font-medium">{idx + 1}</td>
													<td className="py-1 pr-2 truncate max-w-[160px]">
														{team.name}
													</td>
													<td className="py-1 pr-2 text-center">{team.wins}</td>
													<td className="py-1 pr-2 text-center">
														{(team.winPct * 100).toFixed(0)}%
													</td>
													<td className="py-1 text-center">{team.pointsFor}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}

							{!hasCompletedGames && (
								<p className="text-xs text-amber-400">
									No completed games yet. Seeding will be approximate.
								</p>
							)}
						</>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={!tournamentId || isSubmitting || teamCount < 2}
						>
							{isSubmitting ? "Generating..." : "Generate Bracket"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
