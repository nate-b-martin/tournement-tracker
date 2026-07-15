import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useGameStatsByPlayer } from "@/hooks/useGameStats";
import type { Id } from "../../convex/_generated/dataModel";

interface PlayerGameStatsDialogProps {
	player: {
		_id: Id<"players">;
		firstName: string;
		lastName: string;
		team?: { name: string } | null;
	};
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function PlayerGameStatsDialog({
	player,
	open,
	onOpenChange,
}: PlayerGameStatsDialogProps) {
	const gameStats = useGameStatsByPlayer(player._id);
	const isLoading = gameStats === undefined;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{player.firstName} {player.lastName} — Game Stats
					</DialogTitle>
				</DialogHeader>

				{isLoading ? (
					<div className="py-8 text-center text-muted-foreground">
						Loading stats...
					</div>
				) : gameStats && gameStats.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm">
							<thead>
								<tr className="border-b text-muted-foreground">
									<th className="pb-2 pr-4 font-medium">Game</th>
									<th className="pb-2 pr-3 font-medium">AB</th>
									<th className="pb-2 pr-3 font-medium">H</th>
									<th className="pb-2 pr-3 font-medium">1B</th>
									<th className="pb-2 pr-3 font-medium">2B</th>
									<th className="pb-2 pr-3 font-medium">3B</th>
									<th className="pb-2 pr-3 font-medium">HR</th>
									<th className="pb-2 pr-3 font-medium">RBI</th>
									<th className="pb-2 font-medium">AVG</th>
								</tr>
							</thead>
							<tbody>
								{gameStats.map((stat) => {
									const avg =
										stat.atBats > 0
											? (stat.hits / stat.atBats).toFixed(3)
											: ".000";
									return (
										<tr key={stat._id} className="border-b last:border-0">
											<td className="py-2 pr-4 font-medium">
												{stat.game
													? `Round ${stat.game.round}, Game #${stat.game.gameNumber}`
													: "Unknown Game"}
											</td>
											<td className="py-2 pr-3 tabular-nums">{stat.atBats}</td>
											<td className="py-2 pr-3 tabular-nums">{stat.hits}</td>
											<td className="py-2 pr-3 tabular-nums">{stat.singles}</td>
											<td className="py-2 pr-3 tabular-nums">{stat.doubles}</td>
											<td className="py-2 pr-3 tabular-nums">{stat.triples}</td>
											<td className="py-2 pr-3 tabular-nums">
												{stat.homeRuns}
											</td>
											<td className="py-2 pr-3 tabular-nums">{stat.rbi}</td>
											<td className="py-2 pr-3 tabular-nums">{avg}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				) : (
					<div className="py-8 text-center text-muted-foreground">
						No game stats recorded for this player.
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
