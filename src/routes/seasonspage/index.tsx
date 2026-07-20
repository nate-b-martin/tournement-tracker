import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/seasonspage/")({
	component: SeasonsPage,
});

function SeasonsPage() {
	return (
		<div className="container mx-auto px-6 py-8">
			<h1 className="text-3xl font-bold tracking-tight">Seasons</h1>
			<p className="text-muted-foreground mt-1">Browse and manage seasons</p>
		</div>
	);
}
