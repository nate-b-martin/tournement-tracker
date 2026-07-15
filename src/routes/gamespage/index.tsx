import { createFileRoute } from "@tanstack/react-router";
import { GamesTable } from "@/components/GamesTable";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/gamespage/")({
	component: GamesPageComponent,
});

function GamesPageComponent() {
	const { isAdmin } = useAuth();

	return (
		<div className="container mx-auto p-6">
			<h1 className="text-2xl font-bold mb-6">Games</h1>
			<GamesTable
				isAdmin={isAdmin}
				initialOptions={{
					sorting: { field: "round", direction: "asc" },
					pagination: { pageIndex: 0, pageSize: 10 },
				}}
			/>
		</div>
	);
}
