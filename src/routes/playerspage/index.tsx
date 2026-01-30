import { createFileRoute } from "@tanstack/react-router";
import { PlayersTable } from "@/components/PlayersTable";
import { useState } from "react";

export const Route = createFileRoute("/playerspage/")({
  component: PlayersPageComponent,
});

function PlayersPageComponent() {
  const [pageSize, setPageSize] = useState(10);
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Players</h1>
      {/*TODO: Add ability to PlayerTable to add css properties*/}
      <PlayersTable
        initialOptions={{
          // pagination: { pageIndex: 0, pageSize },
          sorting: { field: "lastName", direction: "asc" },
        }}
      />
    </div>
  );
}
