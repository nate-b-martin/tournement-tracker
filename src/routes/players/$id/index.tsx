import {
	createFileRoute,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { PlayerDetails } from "@/components/PlayerDetails";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { Id } from "../../../../convex/_generated/dataModel";

export const Route = createFileRoute("/players/$id/")({
	component: PlayerDetailsRoute,
});

function PlayerDetailsRoute() {
	const { id } = useParams({ from: "/players/$id/" });
	const navigate = useNavigate();

	return (
		<ProtectedRoute requireAdmin={false}>
			<PlayerDetails
				playerId={id as Id<"players">}
				onBack={() => navigate({ to: "/playerspage" })}
			/>
		</ProtectedRoute>
	);
}
