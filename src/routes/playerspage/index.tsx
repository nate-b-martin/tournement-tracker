import { createFileRoute } from "@tanstack/react-router";
import { PlayersTable } from "@/components/PlayersTable";

export const Route = createFileRoute("/playerspage/")({
  component: PlayersPageComponent,
});

function PlayersPageComponent() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Players</h1>
      <PlayersTable
        initialOptions={{
          pagination: { pageIndex: 0, pageSize: 10 },
          sorting: { field: "lastName", direction: "asc" },
        }}
      />
    </div>
  );
}
