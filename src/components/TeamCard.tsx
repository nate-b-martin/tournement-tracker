import { useQuery } from "convex/react";
import { Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

type Team = Doc<"teams">;

interface TeamCardProps {
	team: Team;
	isAdmin: boolean;
	onRemove?: (team: Team) => void;
}

export function TeamCard({ team, isAdmin, onRemove }: TeamCardProps) {
	const playerCount = useQuery(api.players.countByTeam, {
		teamId: team._id,
	});

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div>
						<CardTitle className="text-base">{team.name}</CardTitle>
						<p className="text-sm text-muted-foreground mt-1">
							Coach: {team.coachName}
						</p>
					</div>
					{isAdmin && onRemove && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => onRemove(team)}
							aria-label={`Remove ${team.name}`}
						>
							<Trash2 className="h-4 w-4 text-destructive" />
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Users className="h-4 w-4" />
					<span>{playerCount ?? "..."} players</span>
				</div>
				{team.city && (
					<p className="text-sm text-muted-foreground mt-1">{team.city}</p>
				)}
			</CardContent>
		</Card>
	);
}
