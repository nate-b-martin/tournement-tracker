import { createFileRoute } from "@tanstack/react-router";
import { TeamsTable } from "@/components/TeamsTable";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/teamspage/")({
	component: TeamsPageComponent,
});

function TeamsPageComponent() {
	const { isAdmin } = useAuth();

	return (
		<div className="container mx-auto p-6">
			<h1 className="text-2xl font-bold mb-6">Teams</h1>
			<TeamsTable
				isAdmin={isAdmin}
				initialOptions={{
					sorting: { field: "name", direction: "asc" },
				}}
			/>
		</div>
	);
}
