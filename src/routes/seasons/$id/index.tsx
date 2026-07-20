import {
	createFileRoute,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowLeft, Edit, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { SeasonDialog } from "@/components/SeasonDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useSeasonById } from "@/hooks/useSeasons";
import { useSeasonTeams } from "@/hooks/useSeasonTeams";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/seasons/$id/")({
	component: SeasonDetailPage,
});

const SEASON_STATUS_STYLES: Record<string, string> = {
	planning: "border border-amber-500/30 bg-amber-500/15 text-amber-300",
	active: "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
	complete: "border border-purple-500/30 bg-purple-500/15 text-purple-300",
};

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

function SeasonDetailPage() {
	const { id } = useParams({ from: "/seasons/$id/" });
	const navigate = useNavigate();
	const { isAdmin } = useAuth();
	const season = useSeasonById(id);
	const { teams, isLoading: teamsLoading } = useSeasonTeams(id);
	const linkedTournament = useQuery(
		api.tournaments.getBySeasonId,
		id ? { seasonId: id as Id<"seasons"> } : "skip",
	);

	const [editDialogOpen, setEditDialogOpen] = useState(false);

	if (season === undefined) {
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

	if (season === null) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-foreground">
						Season not found
					</h2>
					<p className="mt-2 text-muted-foreground">
						This season doesn't exist or has been deleted.
					</p>
					<Button
						type="button"
						variant="outline"
						className="mt-4"
						onClick={() => navigate({ to: "/seasonspage" })}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Seasons
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
					onClick={() => navigate({ to: "/seasonspage" })}
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to Seasons
				</Button>

				<div className="flex items-start justify-between">
					<div>
						<h1 className="text-3xl font-bold truncate max-w-[80vw]">
							{season.name}
						</h1>
						<div className="flex gap-2 mt-2">
							<Badge
								variant="outline"
								className={SEASON_STATUS_STYLES[season.status] || ""}
							>
								{season.status}
							</Badge>
							<Badge variant="secondary">{season.sport}</Badge>
						</div>
					</div>
					{isAdmin && (
						<Button
							type="button"
							variant="outline"
							size="icon"
							onClick={() => setEditDialogOpen(true)}
							aria-label="Edit season"
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
							Details
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-1 text-sm">
						<p>
							<span className="text-muted-foreground">Name:</span> {season.name}
						</p>
						<p>
							<span className="text-muted-foreground">Sport:</span>{" "}
							{season.sport}
						</p>
						<p>
							<span className="text-muted-foreground">Dates:</span>{" "}
							{formatDateRange(season.startDate, season.endDate)}
						</p>
						{season.description && (
							<p>
								<span className="text-muted-foreground">Description:</span>{" "}
								<span className="line-clamp-3">{season.description}</span>
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm text-muted-foreground">
							Teams
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-3">
							<Users className="h-8 w-8 shrink-0 text-muted-foreground/50" />
							<div>
								<div className="text-2xl font-bold">{season.teamCount}</div>
								<div className="text-xs text-muted-foreground">
									{season.teamCount === 1 ? "Team" : "Teams"}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm text-muted-foreground">
							Tournament
						</CardTitle>
					</CardHeader>
					<CardContent>
						{linkedTournament ? (
							<div className="min-w-0">
								<Button
									type="button"
									variant="link"
									className="h-auto p-0 max-w-full"
									onClick={() =>
										navigate({
											to: "/tournaments/$id",
											params: {
												id: linkedTournament._id,
											},
										})
									}
								>
									<Trophy className="mr-2 h-4 w-4 shrink-0" />
									<span className="truncate">{linkedTournament.name}</span>
								</Button>
							</div>
						) : (
							<div className="flex items-center gap-3">
								<Trophy className="h-8 w-8 shrink-0 text-muted-foreground/50" />
								<div>
									<div className="text-sm text-muted-foreground">
										No tournament configured
									</div>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="overview">
				<TabsList>
					<TabsTrigger value="overview">Overview ({teams.length})</TabsTrigger>
					<TabsTrigger value="schedule" disabled>
						Schedule
					</TabsTrigger>
					<TabsTrigger value="standings" disabled>
						Standings
					</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="mt-4">
					{teamsLoading ? (
						<div className="space-y-3">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : teams.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{teams.map((team) => (
								<Card key={team._id}>
									<CardContent className="pt-6">
										<div className="flex items-center justify-between">
											<div className="min-w-0">
												<h3 className="font-medium truncate">{team.name}</h3>
												<p className="text-xs text-muted-foreground mt-1 truncate">
													{team.city || "No location"}
												</p>
											</div>
											<Badge
												variant={
													team.status === "active" ? "default" : "secondary"
												}
												className="capitalize"
											>
												{team.status}
											</Badge>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : (
						<div className="text-center py-12 text-muted-foreground">
							No teams added yet.
						</div>
					)}
				</TabsContent>

				<TabsContent value="schedule" className="mt-4">
					<div className="text-center py-12 text-muted-foreground">
						Schedule will appear once regular season games are configured.
					</div>
				</TabsContent>

				<TabsContent value="standings" className="mt-4">
					<div className="text-center py-12 text-muted-foreground">
						Standings will appear once games have been played.
					</div>
				</TabsContent>
			</Tabs>

			{isAdmin && (
				<SeasonDialog
					mode="edit"
					season={season}
					open={editDialogOpen}
					onOpenChange={setEditDialogOpen}
				/>
			)}
		</div>
	);
}
