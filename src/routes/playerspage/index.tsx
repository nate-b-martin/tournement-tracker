import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/playerspage/")({
  component: PlayersPageComponent,
});

function PlayersPageComponent() {
  return <div>Hello "/playerspage/"!</div>;
}
