import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	Scripts,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthErrorBoundary } from "../components/AuthErrorBoundary";
import Header from "../components/Header";
import { convex } from "../router";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "TanStack Start Starter",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),

	shellComponent: RootDocument,
});

function LoadingIndicator() {
	const isLoading = useRouterState({ select: (s) => s.isLoading });

	if (!isLoading) return null;

	return (
		<div className="fixed top-0 left-0 right-0 z-50 h-1 animate-pulse bg-purple-600" />
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<ConvexAuthProvider client={convex}>
					<AuthErrorBoundary>
						<LoadingIndicator />
						<Header />

						<div className="container mx-auto px-4">
							<TooltipProvider>{children}</TooltipProvider>
						</div>
						<Toaster />
						{import.meta.env.DEV && (
							<TanStackDevtools
								config={{
									position: "bottom-right",
								}}
								plugins={[
									{
										name: "Tanstack Router",
										render: <TanStackRouterDevtoolsPanel />,
									},
								]}
							/>
						)}
					</AuthErrorBoundary>
				</ConvexAuthProvider>
				<Scripts />
			</body>
		</html>
	);
}
