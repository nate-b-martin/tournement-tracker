import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teamspage/")({
  component: TeamsPageComponent,
});

function TeamsPageComponent() {
  return <div>Hello "/teamspage/"!</div>;
}
