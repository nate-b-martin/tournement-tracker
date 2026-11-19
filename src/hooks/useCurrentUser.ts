import { useQuery } from "@convex-dev/react-query";
import { api } from "../convex/convex";

export function useCurrentUser() {
	const { data: currentUser } = useQuery(
		api.auth.getCurrentUser,
		// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
		{} as { userId: string }
	);

	return {
		profile: currentUser?.profile,
		isAdmin: currentUser?.role === "admin",
	};
}