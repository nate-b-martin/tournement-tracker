import { SignInButton } from "@clerk/clerk-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	CalendarDays,
	Landmark,
	ShieldCheck,
	Trophy,
	Users,
	UsersRound,
	Wand2,
} from "lucide-react";
import { useState } from "react";
import { SetupWizard } from "@/components/SetupWizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { api } from "../../convex/_generated/api";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/")({ component: App });

function StatCard({
	title,
	value,
	icon,
	href,
}: {
	title: string;
	value: number | undefined;
	icon: React.ReactNode;
	href: string;
}) {
	return (
		<Card className="transition-shadow hover:shadow-md">
			<CardContent className="flex items-center justify-between p-6">
				<div>
					<p className="text-sm text-muted-foreground">{title}</p>
					<p className="mt-1 text-3xl font-bold">
						{value === undefined ? "..." : value}
					</p>
				</div>
				<Link to={href} aria-label={title} className="text-muted-foreground">
					{icon}
				</Link>
			</CardContent>
		</Card>
	);
}

function NavCard({
	title,
	description,
	href,
	icon,
}: {
	title: string;
	description: string;
	href: string;
	icon: React.ReactNode;
}) {
	return (
		<Link
			to={href}
			className="group flex items-start gap-4 rounded-xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
		>
			<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
				{icon}
			</div>
			<div>
				<h3 className="font-semibold group-hover:underline">{title}</h3>
				<p className="mt-1 text-sm text-muted-foreground">{description}</p>
			</div>
		</Link>
	);
}

function RecentList({
	title,
	href,
	items,
	emptyText,
}: {
	title: string;
	href: string;
	items: Array<{ id: string; name: string; meta: string }>;
	emptyText: string;
}) {
	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg">{title}</CardTitle>
					<Button variant="ghost" size="sm" asChild>
						<Link to={href}>View all</Link>
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{items.length === 0 ? (
					<p className="py-6 text-center text-sm text-muted-foreground">
						{emptyText}
					</p>
				) : (
					<ul className="divide-y">
						{items.map((item) => (
							<li key={item.id} className="py-3">
								<Link
									to={href}
									className="flex items-center justify-between gap-4 rounded-md hover:underline"
								>
									<span className="font-medium">{item.name}</span>
									<span className="text-sm text-muted-foreground">
										{item.meta}
									</span>
								</Link>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}

function App() {
	const { isAdmin, isOrganizer, isSignedIn, isLoading } = useAuth();
	const [wizardOpen, setWizardOpen] = useState(false);

	const teamCount = useQuery(api.teams.count);
	const playerCount = useQuery(api.players.count);
	const tournamentCount = useQuery(api.tournaments.count);
	const seasonCount = useQuery(api.seasons.count);

	const recentTournaments = useQuery(api.tournaments.list, {
		pagination: { pageIndex: 0, pageSize: 5 },
		sorting: { field: "createdAt", direction: "desc" },
	});
	const recentSeasons = useQuery(api.seasons.list, {
		pagination: { pageIndex: 0, pageSize: 5 },
		sorting: { field: "createdAt", direction: "desc" },
	});

	const canManage = isAdmin || isOrganizer;

	return (
		<div className="container mx-auto max-w-7xl p-6">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight">
					Tournament Tracker
				</h1>
				<p className="mt-2 text-muted-foreground">
					Manage tournaments, teams, players, and seasons all in one place.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="Teams"
					value={teamCount}
					icon={<UsersRound className="h-5 w-5" />}
					href="/teamspage"
				/>
				<StatCard
					title="Players"
					value={playerCount}
					icon={<Users className="h-5 w-5" />}
					href="/playerspage"
				/>
				<StatCard
					title="Tournaments"
					value={tournamentCount}
					icon={<Trophy className="h-5 w-5" />}
					href="/tournamentspage"
				/>
				<StatCard
					title="Seasons"
					value={seasonCount}
					icon={<CalendarDays className="h-5 w-5" />}
					href="/seasonspage"
				/>
			</div>

			{isSignedIn && (
				<div className="mt-8">
					<h2 className="mb-4 text-lg font-semibold">Quick Access</h2>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<NavCard
							title="Teams"
							description="View and manage teams"
							href="/dashboard"
							icon={<UsersRound className="h-5 w-5" />}
						/>
						<NavCard
							title="Players"
							description="View and manage player rosters"
							href="/dashboard"
							icon={<Users className="h-5 w-5" />}
						/>
						<NavCard
							title="Tournaments"
							description="Organize tournaments and brackets"
							href="/tournamentspage"
							icon={<Trophy className="h-5 w-5" />}
						/>
						<NavCard
							title="Seasons"
							description="Schedule games and track standings"
							href="/seasonspage"
							icon={<CalendarDays className="h-5 w-5" />}
						/>
					</div>
				</div>
			)}

			{canManage && (
				<div className="mt-8">
					<div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5">
						<div className="flex items-center gap-4">
							<div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
								{isAdmin ? (
									<ShieldCheck className="h-5 w-5" />
								) : (
									<Landmark className="h-5 w-5" />
								)}
							</div>
							<div>
								<h3 className="font-semibold">Setup & Management</h3>
								<p className="text-sm text-muted-foreground">
									Use the guided wizard or jump straight into management tools.
								</p>
							</div>
						</div>
						<div className="flex flex-wrap gap-3">
							<Button asChild variant="outline">
								<Link to="/dashboard">Open Dashboard</Link>
							</Button>
							{isAdmin && (
								<Button type="button" onClick={() => setWizardOpen(true)}>
									<Wand2 className="mr-2 h-4 w-4" />
									Setup Wizard
								</Button>
							)}
						</div>
					</div>
				</div>
			)}

			{isSignedIn && (
				<div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
					<RecentList
						title="Recent Tournaments"
						href="/tournamentspage"
						emptyText="No tournaments yet."
						items={(recentTournaments?.data || []).map((t) => ({
							id: t._id,
							name: t.name,
							meta: t.sport,
						}))}
					/>
					<RecentList
						title="Recent Seasons"
						href="/seasonspage"
						emptyText="No seasons yet."
						items={(recentSeasons?.data || []).map((s) => ({
							id: s._id,
							name: s.name,
							meta: s.status,
						}))}
					/>
				</div>
			)}

			<SetupWizard open={wizardOpen} onOpenChange={setWizardOpen} />

			{!isSignedIn && !isLoading && (
				<div className="mt-8 p-6 bg-gray-800 rounded-lg text-center">
					<h3 className="text-lg font-semibold mb-2">
						Tournament Administrator?
					</h3>
					<p className="text-gray-400 mb-4">
						Sign in to manage tournaments, teams, and players.
					</p>
					<SignInButton mode="modal">
						<Button>Sign In</Button>
					</SignInButton>
				</div>
			)}
		</div>
	);
}
