import { useMutation, useQuery } from "convex/react";
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
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

interface TeamRosterDialogProps {
	team: Doc<"teams"> | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function TeamRosterDialog({
	team,
	open,
	onOpenChange,
}: TeamRosterDialogProps) {
	const playersResult = useQuery(api.players.list, {
		filtering: team ? { teamId: team._id as Id<"teams"> } : undefined,
	});
	const players = playersResult?.data || [];
	const isLoading = playersResult === undefined;
	const removeFromTeam = useMutation(api.players.removeFromTeam);

	const handleRemoveFromTeam = async (playerId: Id<"players">) => {
		try {
			await removeFromTeam({ id: playerId });
			toast.success("Player removed from team");
		} catch {
			toast.error("Failed to remove player from team");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[550px]">
				<DialogHeader>
					<DialogTitle>{team?.name || "Team"} Roster</DialogTitle>
					<DialogDescription>
						Players assigned to this team ({players.length} total)
					</DialogDescription>
				</DialogHeader>
				<div className="max-h-[400px] space-y-2 overflow-y-auto">
					{isLoading ? (
						<p className="py-4 text-center text-sm text-muted-foreground">
							Loading players...
						</p>
					) : players.length === 0 ? (
						<p className="py-4 text-center text-sm text-muted-foreground">
							No players on this team
						</p>
					) : (
						players.map((player) => (
							<div
								key={player._id}
								className="flex items-center justify-between rounded-lg border border-card-outline/70 bg-background/40 px-4 py-2"
							>
								<div className="flex items-center gap-3">
									<button
										type="button"
										className="font-medium hover:underline cursor-pointer"
										onClick={() => {
											window.location.href = `/players/${player._id}`;
										}}
									>
										{player.firstName} {player.lastName}
									</button>
									{player.isCaptain && (
										<span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-400">
											Captain
										</span>
									)}
									{player.jerseyNumber && (
										<span className="text-sm text-muted-foreground">
											#{player.jerseyNumber}
										</span>
									)}
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() =>
										handleRemoveFromTeam(player._id as Id<"players">)
									}
									className="text-red-400 hover:text-red-300"
								>
									Remove
								</Button>
							</div>
						))
					)}
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
