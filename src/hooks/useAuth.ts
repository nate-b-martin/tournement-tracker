import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

type Role = "admin" | "organizer" | "player" | "spectator";

type UserProfile = Doc<"userProfiles">;

interface UseAuthResult {
	isLoaded: boolean;
	isSignedIn: boolean;
	user: ReturnType<typeof useUser>["user"];
	profile: UserProfile | null;
	isAdmin: boolean;
	isOrganizer: boolean;
	isPlayer: boolean;
	isSpectator: boolean;
	isLoading: boolean;
	error: Error | null;
	hasError: boolean;
	refetch: () => void;
}

export function useAuth(): UseAuthResult {
	// Call all hooks unconditionally at the top level (React Rules of Hooks)
	// If Clerk is not configured, these will return safe defaults.
	const { isLoaded, isSignedIn, user } = useUser();
	const [isCreatingProfile, setIsCreatingProfile] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const profile = useQuery(
		api.userProfiles.getCurrentUser,
		isSignedIn && user ? { userId: user.id } : "skip",
	);

	const createProfile = useMutation(api.userProfiles.createUserProfile);

	// If Clerk is not configured (e.g. in CI or local dev without keys),
	// return a safe unauthenticated state so components still render instead of
	// stalling. Tests that require auth should skip when Clerk keys aren't present.
	const PUBLISHABLE_KEY = (import.meta as any).env.VITE_CLERK_PUBLISHABLE_KEY;
	if (!PUBLISHABLE_KEY) {
		return {
			isLoaded: true,
			isSignedIn: false,
			user: null,
			profile: null,
			isAdmin: false,
			isOrganizer: false,
			isPlayer: false,
			isSpectator: false,
			isLoading: false,
			error: null,
			hasError: false,
			refetch: () => {},
		};
	}

	useEffect(() => {
		if (
			isLoaded &&
			isSignedIn &&
			user &&
			profile === null &&
			!isCreatingProfile
		) {
			setIsCreatingProfile(true);
			setError(null);

			createProfile({
				userId: user.id,
				email: user.primaryEmailAddress?.emailAddress,
				displayName: user.fullName || user.username || undefined,
			})
				.catch((err) => {
					setError(
						err instanceof Error ? err : new Error("Failed to create profile"),
					);
					console.error("Failed to create user profile:", err);
				})
				.finally(() => {
					setIsCreatingProfile(false);
				});
		}
	}, [isLoaded, isSignedIn, user, profile, isCreatingProfile, createProfile]);

	const currentProfile = profile ?? null;
	const isAdmin = currentProfile?.role === "admin";
	const isOrganizer = currentProfile?.role === "organizer";
	const isPlayer = currentProfile?.role === "player";
	const isSpectator = currentProfile?.role === "spectator";

	const isLoading =
		!isLoaded || isCreatingProfile || (!!isSignedIn && profile === undefined);

	return {
		isLoaded,
		isSignedIn: !!isSignedIn,
		user,
		profile: currentProfile,
		isAdmin: !!isAdmin,
		isOrganizer: !!isOrganizer,
		isPlayer: !!isPlayer,
		isSpectator: !!isSpectator,
		isLoading: !!isLoading,
		error,
		hasError: error !== null,
		refetch: () => {},
	};
}

export type { Role, UserProfile };
