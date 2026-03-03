import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useEffect, useState } from "react";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CONVEX_URL) {
	console.error("missing envar CONVEX_URL");
}
if (!PUBLISHABLE_KEY) {
	console.error("missing envar VITE_CLERK_PUBLISHABLE_KEY");
}

const convex = new ConvexReactClient(CONVEX_URL);

function ClientProviders({ children }: { children: React.ReactNode }) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
			</div>
		);
	}

	return (
		<ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
			<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
				{children}
			</ConvexProviderWithClerk>
		</ClerkProvider>
	);
}

export default function ConvexClerkProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return <ClientProviders>{children}</ClientProviders>;
}
