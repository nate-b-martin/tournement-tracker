import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BracketView } from "@/components/Bracket/BracketView";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { FieldsList } from "@/components/FieldsList";
import { GamesTable } from "@/components/GamesTable";
import { StandingsView } from "@/components/StandingsView";
import { TeamCard } from "@/components/TeamCard";
import { TeamDialog } from "@/components/TeamDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/tournaments/$id/")({
	component: TournamentDetailPage,
});

const BRACKET_LABELS: Record<string, string> = {
	single_elimination: "Single Elimination",
	double_elimination: "Double Elimination",
	round_robin: "Round Robin",
};

type Team = Doc<"teams">;

function formatDate(ms?: number): string {
	if (!ms) return "TBD";
	return new Date(ms).toLocaleDateString();
}

function formatDateRange(start?: number, end?: number): string {
	if (!start && !end) return "TBD";
	if (start && !end) return `From ${formatDate(start)}`;
	if (!start && end) return `Until ${formatDate(end)}`;
	return `${formatDate(start)} — ${formatDate(end)}`;
}

function TournamentDetailPage() {
	const { id } = useParams({ from: "/tournaments/$id/" });
	const { isAdmin } = useAuth();
	const tournament = useQuery(api.tournaments.getById, {
		id: id as Id<"tournaments">,
	});
	const teams = useQuery(api.teams.list, {
		filtering: { tournamentId: id as Id<"tournaments"> },
	});
	const games = useQuery(api.games.getByTournament, {
		tournamentId: id as Id<"tournaments">,
	});
	const fields = useQuery(api.fields.listByTournament, {
		tournamentId: id as Id<"tournaments">,
	});

	const removeTeam = useMutation(api.teams.remove);

	const [teamDialogOpen, setTeamDialogOpen] = useState(false);
	const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
	const [removingTeam, setRemovingTeam] = useState<Team | undefined>();
	const [isRemoving, setIsRemoving] = useState(false);

	const allTournaments = useQuery(api.tournaments.list, {});

	if (!tournament) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-center">
					<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
					<p className="mt-4 text-muted-foreground">Loading tournament...</p>
				</div>
			</div>
		);
	}

	const handleRemoveTeam = async () => {
		if (!removingTeam) return;
		setIsRemoving(true);
		try {
			await removeTeam({ id: removingTeam._id as Id<"teams"> });
			toast.success("Team removed from tournament");
			setRemoveConfirmOpen(false);
			setRemovingTeam(undefined);
		} catch {
			toast.error("Failed to remove team");
		} finally {
			setIsRemoving(false);
		}
	};

	return (
		<div className="py-8">
			<div className="flex items-start justify-between mb-8">
				<div>
					<h1 className="text-3xl font-bold">{tournament.name}</h1>
					<div className="flex gap-2 mt-2">
						<Badge variant="outline">{tournament.sport}</Badge>
						<Badge>{tournament.status.replace(/_/g, " ")}</Badge>
						<Badge variant="secondary">
							{tournament.currentTeamCount}/{tournament.maxTeams} Teams
						</Badge>
					</div>
				</div>
				{isAdmin && (
					<div className="flex gap-2">
						<Button variant="outline" type="button">
							Edit Tournament
						</Button>
						<Button type="button">Schedule Games</Button>
					</div>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm text-muted-foreground">
							Details
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-1 text-sm">
						<p>
							<span className="text-muted-foreground">Location:</span>{" "}
							{tournament.location || "TBD"}
						</p>
						<p>
							<span className="text-muted-foreground">Dates:</span>{" "}
							{formatDateRange(tournament.startDate, tournament.endDate)}
						</p>
						<p>
							<span className="text-muted-foreground">Bracket:</span>{" "}
							{BRACKET_LABELS[tournament.bracketType]}
						</p>
						<p>
							<span className="text-muted-foreground">Seeding:</span>{" "}
							{tournament.seedingType}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm text-muted-foreground">
							Game Settings
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-1 text-sm">
						<p>
							<span className="text-muted-foreground">Fields:</span>{" "}
							{fields?.length || 0}
						</p>
						<p>
							<span className="text-muted-foreground">Game Duration:</span>{" "}
							{tournament.gameDuration} min
						</p>
						<p>
							<span className="text-muted-foreground">Break:</span>{" "}
							{tournament.breakBetweenGames} min
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm text-muted-foreground">
							Registration
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-1 text-sm">
						<p>
							<span className="text-muted-foreground">Deadline:</span>{" "}
							{formatDate(tournament.registrationDeadline)}
						</p>
						<p>
							<span className="text-muted-foreground">Min Teams:</span>{" "}
							{tournament.minTeams}
						</p>
						<p>
							<span className="text-muted-foreground">Max Teams:</span>{" "}
							{tournament.maxTeams}
						</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="teams">
				<TabsList>
					<TabsTrigger value="teams">
						Teams ({teams?.totalCount || 0})
					</TabsTrigger>
					<TabsTrigger value="games">Games ({games?.length || 0})</TabsTrigger>
					<TabsTrigger value="bracket">Bracket</TabsTrigger>
					<TabsTrigger value="standings">Standings</TabsTrigger>
					<TabsTrigger value="fields">
						Fields ({fields?.length || 0})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="teams" className="mt-4">
					{isAdmin && (
						<div className="mb-4">
							<Button type="button" onClick={() => setTeamDialogOpen(true)}>
								<Plus className="mr-2 h-4 w-4" />
								Add Team
							</Button>
						</div>
					)}
					{teams?.teams?.length ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{teams.teams.map((team) => (
								<TeamCard
									key={team._id}
									team={team}
									isAdmin={isAdmin}
									onRemove={
										isAdmin
											? (t) => {
													setRemovingTeam(t);
													setRemoveConfirmOpen(true);
												}
											: undefined
									}
								/>
							))}
						</div>
					) : (
						<div className="text-center py-12 text-muted-foreground">
							No teams registered yet.
						</div>
					)}
				</TabsContent>

				<TabsContent value="games" className="mt-4">
					<GamesTable
						initialOptions={{
							filtering: { tournamentId: id as Id<"tournaments"> },
						}}
						isAdmin={isAdmin}
					/>
				</TabsContent>

				<TabsContent value="bracket" className="mt-4">
					{games && games.length > 0 ? (
						<BracketView bracketType={tournament.bracketType} games={games} />
					) : (
						<div className="text-center py-12 text-muted-foreground">
							No games scheduled yet. Games will appear here once the bracket is
							generated.
						</div>
					)}
				</TabsContent>

				<TabsContent value="standings" className="mt-4">
					{games && games.length > 0 && teams?.teams?.length ? (
						<StandingsView
							tournamentId={tournament._id}
							games={games}
							teams={teams.teams}
						/>
					) : (
						<div className="text-center py-12 text-muted-foreground">
							Standings will appear once games have been played.
						</div>
					)}
				</TabsContent>

				<TabsContent value="fields" className="mt-4">
					<FieldsList
						tournamentId={id as Id<"tournaments">}
						isAdmin={isAdmin}
					/>
				</TabsContent>
			</Tabs>

			<TeamDialog
				mode="create"
				tournamentId={id as Id<"tournaments">}
				tournaments={
					allTournaments?.data
						? allTournaments.data.map((t) => ({
								_id: t._id,
								name: t.name,
							}))
						: []
				}
				open={teamDialogOpen}
				onOpenChange={setTeamDialogOpen}
			/>

			<ConfirmDelete
				open={removeConfirmOpen}
				onOpenChange={(val) => {
					setRemoveConfirmOpen(val);
					if (!val) setRemovingTeam(undefined);
				}}
				itemName={removingTeam ? `${removingTeam.name}` : "this team"}
				onConfirm={handleRemoveTeam}
				isLoading={isRemoving}
			/>
		</div>
	);
}
