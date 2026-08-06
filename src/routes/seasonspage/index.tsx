import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SeasonsTable } from "@/components/SeasonsTable";

export const Route = createFileRoute("/seasonspage/")({
	component: SeasonsPage,
});

function SeasonsPage() {
	return (
		<ProtectedRoute requireAdmin={false}>
			<div className="container mx-auto px-6 py-8">
				<h1 className="text-3xl font-bold tracking-tight">Seasons</h1>
				<p className="text-muted-foreground mt-1 mb-6">
					Browse and manage seasons
				</p>
				<SeasonsTable />
			</div>
		</ProtectedRoute>
	);
}
