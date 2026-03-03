import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { PlayersTable } from "@/components/PlayersTable";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPageComponent,
});

function DashboardPageComponent() {
  const { isAdmin } = useAuth();
  const teamCount = useQuery(api.teams.count);
  const playerCount = useQuery(api.players.count);
  const tournamentCount = useQuery(api.tournaments.count);
  return (
    <ProtectedRoute requireAdmin={false}>
      {!isAdmin && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-600">
            Viewing as spectator. Contact an admin to make changes
          </p>
        </div>
      )}
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
                  {tournamentCount === undefined
                    ? "Loading..."
                    : tournamentCount}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        <div className="container grid" aria-description="tables">
          {/*I want to show data tables for Teams, players, tournaments.*/}
          <PlayersTable
            isAdmin={isAdmin}
            initialOptions={{
              pagination: { pageIndex: 0, pageSize: 10 },
              sorting: { field: "lastName", direction: "asc" },
            }}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
