import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
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
	retry: () => void;
	retryCount: number;
	hasMaxRetries: boolean;
	isOnline: boolean;
}

const MAX_RETRIES = 3;

export function useAuth(): UseAuthResult {
	// Get Clerk config key early (checked later after hooks)
	const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

	// Call all hooks unconditionally at the top level (React Rules of Hooks)
	// If Clerk is not configured, these will return safe defaults.
	const { isLoaded, isSignedIn, user } = useUser();
	const [isCreatingProfile, setIsCreatingProfile] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [retryCount, setRetryCount] = useState(0);
	const [isOnline, setIsOnline] = useState(
		typeof navigator !== "undefined" ? navigator.onLine : true,
	);
	const signInToastShown = useRef(false);

	const profile = useQuery(
		api.userProfiles.getCurrentUser,
		isSignedIn && user ? { userId: user.id } : "skip",
	);

	const createProfile = useMutation(api.userProfiles.createUserProfile);

	const retry = useCallback(() => {
		if (retryCount < MAX_RETRIES) {
			setError(null);
			setRetryCount((c) => c + 1);
		}
	}, [retryCount]);

	// Retry with exponential backoff when profile creation fails
	useEffect(() => {
		if (error && retryCount > 0 && retryCount < MAX_RETRIES) {
			const delay = 2000 * 2 ** (retryCount - 1);
			const timer = setTimeout(() => {
				retry();
			}, delay);

			return () => clearTimeout(timer);
		}
	}, [error, retryCount, retry]);

	// Offline detection
	useEffect(() => {
		const handleOnline = () => {
			setIsOnline(true);
			toast.success("You're back online!");
		};
		const handleOffline = () => {
			setIsOnline(false);
			toast.warning(
				"You are offline. Some features may be unavailable until you're back online.",
			);
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

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
					setError(err instanceof Error ? err : new Error(errorMsg));
					toast.error(`Auth error: ${errorMsg}`);
					console.error("Failed to create user profile:", err);
				})
				.finally(() => {
					setIsCreatingProfile(false);
				});
		}
	}, [isLoaded, isSignedIn, user, profile, isCreatingProfile, createProfile]);

	// Show role-specific welcome toast only once when user first signs in
	useEffect(() => {
		if (
			!signInToastShown.current &&
			isLoaded &&
			isSignedIn &&
			user &&
			profile
		) {
			signInToastShown.current = true;

			const role = profile.role;
			if (role === "admin") {
				toast.success("Welcome, Admin!", {
					description: "You have full access to manage tournaments.",
				});
			} else if (role === "organizer") {
				toast.success("Welcome, Organizer!", {
					description: "You can manage tournaments and games.",
				});
			} else {
				toast.success(`Welcome back, ${user.firstName || "User"}!`, {
					description:
						role === "player"
							? "You can view your teams and games."
							: "You have view-only access to tournament data.",
				});
			}
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
			retry: () => {},
			retryCount: 0,
			hasMaxRetries: false,
			isOnline: true,
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
		refetch: () => {
			setError(null);
			setRetryCount(0);
		},
		retry,
		retryCount,
		hasMaxRetries: retryCount >= MAX_RETRIES,
		isOnline,
	};
}

export type { Role, UserProfile };
