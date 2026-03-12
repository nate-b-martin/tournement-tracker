import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/card";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const teamCount = useQuery(api.teams.count);
	const playerCount = useQuery(api.players.count);
	const tournamentCount = useQuery(api.tournaments.count);
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{/*<FeatureSection />*/}
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
	);
}
