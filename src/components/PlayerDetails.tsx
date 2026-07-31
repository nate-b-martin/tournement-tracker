import { useQuery } from "convex/react";
import { ArrowLeft, Edit, Mail, User, Users } from "lucide-react";
import { useState } from "react";
import { PlayerDialog } from "@/components/PlayerDialog";
import { PlayerGameStatsDialog } from "@/components/PlayerGameStatsDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useGameStatsByPlayer } from "@/hooks/useGameStats";
import { usePlayerById } from "@/hooks/usePlayerById";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const PLAYER_STATUS_STYLES: Record<string, string> = {
	active: "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
	inactive: "border border-slate-500/30 bg-slate-500/15 text-slate-300",
	injured: "border border-amber-500/30 bg-amber-500/15 text-amber-300",
};

interface PlayerDetailsProps {
	playerId: Id<"players">;
	onBack: () => void;
}

export function PlayerDetails({ playerId, onBack }: PlayerDetailsProps) {
	const { isAdmin } = useAuth();
	const player = usePlayerById(playerId);
	const stats = useGameStatsByPlayer(playerId);

	const allTeams = useQuery(api.teams.list, {})?.teams || [];

	const [editDialogOpen, setEditDialogOpen] = useState(false);

	if (player === undefined) {
		return (
			<div className="py-8">
				<div className="space-y-4">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-96" />
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
					</div>
					<Skeleton className="h-64" />
				</div>
			</div>
		);
	}

	if (player === null) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-foreground">
						Player not found
					</h2>
					<p className="mt-2 text-muted-foreground">
						This player doesn't exist or has been deleted.
					</p>
					<Button
						type="button"
						variant="outline"
						className="mt-4"
						onClick={onBack}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Players
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="py-8">
			<div className="mb-6">
				<Button
					type="button"
					variant="ghost"
					className="mb-4 -ml-2 text-muted-foreground"
					onClick={onBack}
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to Players
				</Button>

				<div className="flex items-start justify-between">
					<div>
						<h1 className="text-3xl font-bold truncate max-w-[80vw]">
							{player.firstName} {player.lastName} #{player.jerseyNumber}
						</h1>
						<div className="flex gap-2 mt-2">
							<Badge
								variant="outline"
								className={PLAYER_STATUS_STYLES[player.status] || ""}
							>
								{player.status}
							</Badge>
							{player.teamId && <Badge variant="secondary">Team Player</Badge>}
						</div>
					</div>
					{isAdmin && (
						<Button
							type="button"
							variant="outline"
							size="icon"
							onClick={() => setEditDialogOpen(true)}
							aria-label="Edit player"
						>
							<Edit className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm text-muted-foreground">
							<User className="mr-2 h-4 w-4 inline" />
							Profile
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<p>
							<span className="text-muted-foreground">Jersey:</span>{" "}
							{player.jerseyNumber ?? "-"}
						</p>
						<p>
							<span className="text-muted-foreground">Contact:</span>{" "}
							{player.email || "-"}
						</p>
						<p>
							<span className="text-muted-foreground">Phone:</span>{" "}
							{player.phone || "-"}
						</p>
						<p>
							<span className="text-muted-foreground">Team:</span>{" "}
							{player.team?.name || "No Team"}
						</p>
						{player.isCaptain && (
							<p>
								<span className="text-muted-foreground">Captain:</span> Yes
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm text-muted-foreground">
							<Users className="mr-2 h-4 w-4 inline" />
							Team
						</CardTitle>
					</CardHeader>
					<CardContent>
						{player.teamId ? (
							<div className="text-sm">
								<p className="font-medium truncate">{player.team?.name}</p>
								{player.team?.city && (
									<p className="text-muted-foreground">
										City: {player.team.city}
									</p>
								)}
								<p className="text-muted-foreground">
									Captain: {player.isCaptain ? "Yes" : "No"}
								</p>
							</div>
						) : (
							<div className="text-sm text-muted-foreground">
								No team assigned
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm text-muted-foreground">
							<Mail className="mr-2 h-4 w-4 inline" />
							Stats
						</CardTitle>
					</CardHeader>
					<CardContent className="text-sm">
						{stats === undefined ? (
							<div className="text-muted-foreground">Loading stats...</div>
						) : stats && stats.length > 0 ? (
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Games:</span>
									<span className="font-medium">{stats.length}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Hits:</span>
									<span className="font-medium">
										{stats.reduce((acc, s) => acc + s.hits, 0)}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Home Runs:</span>
									<span className="font-medium">
										{stats.reduce((acc, s) => acc + s.homeRuns, 0)}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Average:</span>
									<span className="font-medium">
										{(() => {
											const totalAtBats = stats.reduce(
												(acc, s) => acc + s.atBats,
												0,
											);
											const totalHits = stats.reduce(
												(acc, s) => acc + s.hits,
												0,
											);
											return totalAtBats > 0
												? (totalHits / totalAtBats).toFixed(3)
												: "-";
										})()}
									</span>
								</div>
							</div>
						) : (
							<div className="text-sm text-muted-foreground">
								No game stats recorded
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="overview" className="mt-8">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="gameStats">Game Stats</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="mt-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Card>
							<CardHeader>
								<CardTitle className="text-sm text-muted-foreground">
									Contact Information
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-sm">
								<p>
									<span className="text-muted-foreground">Email:</span>{" "}
									{player.email || "-"}
								</p>
								<p>
									<span className="text-muted-foreground">Phone:</span>{" "}
									{player.phone || "-"}
								</p>
								<p>
									<span className="text-muted-foreground">Jersey Number:</span>{" "}
									{player.jerseyNumber ?? "-"}
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-sm text-muted-foreground">
									Additional Info
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-sm">
								<p>
									<span className="text-muted-foreground">Status:</span>{" "}
									{player.status}
								</p>
								<p>
									<span className="text-muted-foreground">Captain:</span>{" "}
									{player.isCaptain ? "Yes" : "No"}
								</p>
								<p>
									<span className="text-muted-foreground">Team:</span>{" "}
									{player.team?.name || "No Team"}
								</p>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="gameStats" className="mt-4">
					<PlayerGameStatsDialog
						player={{
							_id: player._id,
							firstName: player.firstName,
							lastName: player.lastName,
							team: player.team ? { name: player.team.name } : null,
						}}
						open={true}
						onOpenChange={() => {}}
					/>
				</TabsContent>
			</Tabs>

			{isAdmin && (
				<PlayerDialog
					mode="edit"
					player={player}
					teams={allTeams.map((t) => ({
						_id: t._id,
						name: t.name,
					}))}
					open={editDialogOpen}
					onOpenChange={setEditDialogOpen}
					onSuccess={() => {
						setEditDialogOpen(false);
					}}
				/>
			)}
		</div>
	);
}
