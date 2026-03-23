import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
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
	// Get Clerk config key early (checked later after hooks)
	const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

	// Call all hooks unconditionally at the top level (React Rules of Hooks)
	// If Clerk is not configured, these will return safe defaults.
	const { isLoaded, isSignedIn, user } = useUser();
	const [isCreatingProfile, setIsCreatingProfile] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const signInToastShown = useRef(false);

	const profile = useQuery(
		api.userProfiles.getCurrentUser,
		isSignedIn && user ? { userId: user.id } : "skip",
	);

	const createProfile = useMutation(api.userProfiles.createUserProfile);

	// Effect must be called before conditional returns (React Rules of Hooks)
	useEffect(() => {
		// If Clerk is not configured, skip profile creation
		if (!PUBLISHABLE_KEY) {
			return;
		}

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
				.then(() => {
					toast.success("Welcome! Your profile has been created.");
				})
				.catch((err) => {
					const errorMsg =
						err instanceof Error ? err.message : "Failed to create profile";
					setError(
						err instanceof Error ? err : new Error(errorMsg),
					);
					toast.error("Unable to create your profile. Please try again.");
					if (import.meta.env.DEV) {
						console.error("Failed to create user profile:", err);
					}
				})
				.finally(() => {
					setIsCreatingProfile(false);
				});
		}
	}, [isLoaded, isSignedIn, user, profile, isCreatingProfile, createProfile]);

	// Show sign-in toast only once when user first signs in
	useEffect(() => {
		if (!signInToastShown.current && isLoaded && isSignedIn && user && profile) {
			signInToastShown.current = true;
			toast.success(`Welcome back, ${user.firstName || "User"}!`);
		}
	}, [isLoaded, isSignedIn, user, profile]);

	// If Clerk is not configured (e.g. in CI or local dev without keys),
	// return a safe unauthenticated state so components still render instead of
	// stalling. Tests that require auth should skip when Clerk keys aren't present.
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
