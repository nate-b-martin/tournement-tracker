import { createFileRoute } from "@tanstack/react-router";
import { PlayersTable } from "@/components/PlayersTable";
import { ViewOnlyAlert } from "@/components/ViewOnlyAlert";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/playerspage/")({
	component: PlayersPageComponent,
});

function PlayersPageComponent() {
	const { isAdmin, isSignedIn } = useAuth();

	return (
		<div className="container mx-auto p-6">
			<h1 className="text-2xl font-bold mb-6">Players</h1>
			{isSignedIn && !isAdmin && <ViewOnlyAlert resourceName="players" />}
			<PlayersTable
				isAdmin={isAdmin}
				initialOptions={{
					sorting: { field: "lastName", direction: "asc" },
				}}
			/>
		</div>
	);
}
