import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tournamentspage/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/tournamentspage/"!</div>
}
