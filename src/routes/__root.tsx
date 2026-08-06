import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	Scripts,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthErrorBoundary } from "../components/AuthErrorBoundary";
import Header from "../components/Header";
import ConvexClerkProvider from "../integrations/convex-clerk-provider";
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
	// Listen for Clerk sign-out events
	useEffect(() => {
		const handleSignOut = () => {
			toast.success("Signed out", {
				description: "You have been successfully signed out.",
			});
		};

		window.addEventListener("clerk:signout", handleSignOut);
		return () => window.removeEventListener("clerk:signout", handleSignOut);
	}, []);

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<ConvexClerkProvider>
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
				</ConvexClerkProvider>
				<Scripts />
			</body>
		</html>
	);
}
