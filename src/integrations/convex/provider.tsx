import { useAuth } from "@clerk/clerk-react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useEffect, useState } from "react";

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL;
if (!CONVEX_URL) {
	console.error("missing envar CONVEX_URL");
}
const convexQueryClient = new ConvexQueryClient(CONVEX_URL);

export default function AppConvexProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return <>{children}</>;
	}

	return (
		<ConvexProviderWithClerk
			client={convexQueryClient.convexClient}
			useAuth={useAuth}
		>
			{children}
		</ConvexProviderWithClerk>
	);
}
