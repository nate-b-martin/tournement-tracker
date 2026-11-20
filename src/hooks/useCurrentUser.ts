import { useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";

export function useCurrentUser() {
	const { data: profile } = useQuery(api.userProfiles.getCurrentUser, {});

	return {
		profile,
		isAdmin: profile?.role === "admin",
	};
}
