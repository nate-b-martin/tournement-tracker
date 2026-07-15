import { SignInButton } from "@clerk/clerk-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "../components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { useAuth } from "../hooks/useAuth";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const { isAdmin, isSignedIn } = useAuth();
	const teamCount = useQuery(api.teams.count);
	const playerCount = useQuery(api.players.count);
	const tournamentCount = useQuery(api.tournaments.count);
	return (
		<div className="container mx-auto p-6">
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<Card>
					<CardHeader>
						<CardTitle>Total Teams Count</CardTitle>
						<CardDescription>
							{teamCount === undefined ? "Loading..." : teamCount}
						</CardDescription>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Total Players Count</CardTitle>
						<CardDescription>
							{playerCount === undefined ? "Loading..." : playerCount}
						</CardDescription>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Total Tournament Count</CardTitle>
						<CardDescription>
							{tournamentCount === undefined ? "Loading..." : tournamentCount}
						</CardDescription>
					</CardHeader>
				</Card>
			</div>

			{isAdmin && (
				<div className="mt-8">
					<h2 className="text-xl font-semibold mb-4">Admin Quick Actions</h2>
					<div className="flex gap-4">
						<Button asChild>
							<Link to="/dashboard">Open Dashboard</Link>
						</Button>
						<Button variant="outline" asChild>
							<Link to="/playerspage">Manage Players</Link>
						</Button>
					</div>
				</div>
			)}

			{!isSignedIn && (
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
