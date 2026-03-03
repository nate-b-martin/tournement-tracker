import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { ConvexReactClient } from "convex/react";
import { routeTree } from "./routeTree.gen";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
if (!CONVEX_URL) {
	throw new Error("missing VITE_CONVEX_URL envar");
}

const convex = new ConvexReactClient(CONVEX_URL, {
	unsavedChangesWarning: false,
});
const convexQueryClient = new ConvexQueryClient(convex);

const queryClient: QueryClient = new QueryClient({
	defaultOptions: {
		queries: {
			queryKeyHashFn: convexQueryClient.hashFn(),
			queryFn: convexQueryClient.queryFn(),
		},
	},
});
convexQueryClient.connect(queryClient);

const router = createTanStackRouter({
	routeTree,
	defaultPreload: "intent",
	context: { queryClient, convexClient: convex, convexQueryClient },
	scrollRestoration: true,
	defaultErrorComponent: ({ error }) => (
		<div className="p-4 text-red-500">
			<h2>Error</h2>
			<p>{error?.message ?? "Unknown error"}</p>
		</div>
	),
	defaultNotFoundComponent: () => (
		<div className="p-4">
			<h2>404 - Page Not Found</h2>
		</div>
	),
});

export { queryClient, convex, convexQueryClient };

export function getRouter() {
	return router;
}
