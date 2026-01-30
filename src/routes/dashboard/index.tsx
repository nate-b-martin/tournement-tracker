import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PlayersTable } from "@/components/PlayersTable";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PlayerFilters } from "@/components/PlayerFilters";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPageComponent,
});

function DashboardPageComponent() {
  const teamCount = useQuery(api.teams.count);
  const playerCount = useQuery(api.players.count);
  const tournamentCount = useQuery(api.tournaments.count);
  return (
    <div className="container">
      <div className="container" aria-description="overview">
        <div className="grid items-center place-content-center m-4 py-4 text-5xl font-orbitron">
          <h1>Dashboard Overview</h1>
        </div>
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:max-w-full">
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
      </div>

      <div className="container grid" aria-description="tables">
        {/*I want to show data tables for Teams, players, tournaments.*/}
        <PlayersTable
          initialOptions={{
            pagination: { pageIndex: 0, pageSize: 10 },
            sorting: { field: "lastName", direction: "asc" },
          }}
        />
      </div>
    </div>
  );
}
