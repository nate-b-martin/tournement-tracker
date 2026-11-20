import { useConvexAuth } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

type Role = "admin" | "organizer" | "player" | "spectator";

type UserProfile = Doc<"userProfiles">;

type AuthUser = Doc<"users">;

interface UseAuthResult {
	isLoaded: boolean;
	isSignedIn: boolean;
	user: AuthUser | null;
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
	// If Convex is not configured, return a safe unauthenticated state before
	// any hooks run — the Convex Auth and Convex hooks throw without a
	// configured client. Components still render instead of stalling. Tests
	// that require auth should skip when the Convex URL isn't present.
	if (!import.meta.env.VITE_CONVEX_URL) {
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

	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
	const [isCreatingProfile, setIsCreatingProfile] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [retryCount, setRetryCount] = useState(0);
	const [isOnline, setIsOnline] = useState(
		typeof navigator !== "undefined" ? navigator.onLine : true,
	);
	const signInToastShown = useRef(false);

	// Skip both queries while signed out ("skip" → no network request). The
	// backend resolves the Convex Auth `users._id` from the session token, so
	// no user id is ever passed from the client.
	const user = useQuery(api.users.getCurrent, isAuthenticated ? {} : "skip");
	const profile = useQuery(
		api.userProfiles.getCurrentUser,
		isAuthenticated ? {} : "skip",
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

	// Auto-create the user profile the first time a signed-in user is seen
	// without one. `isCreatingProfile` blocks concurrent runs, `error` stops
	// re-firing until `retry()`/the backoff clears it, and a duplicate insert
	// reported by the server (profile already created by another tab or a
	// race with the profile query) is treated as success so the guard stays
	// idempotent.
	useEffect(() => {
		if (
			!authLoading &&
			isAuthenticated &&
			user &&
			profile === null &&
			!isCreatingProfile &&
			!error
		) {
			setIsCreatingProfile(true);
			setError(null);

			createProfile({ email: user.email, displayName: user.name })
				.then(() => {
					toast.success("Welcome! Your profile has been created.");
				})
				.catch((err) => {
					const errorMsg =
						err instanceof Error ? err.message : "Failed to create profile";
					if (errorMsg.includes("already exists")) {
						// Another create won the race — the profile exists.
						return;
					}
					setError(err instanceof Error ? err : new Error(errorMsg));
					toast.error(`Auth error: ${errorMsg}`);
					if (import.meta.env.DEV) {
						console.error("Failed to create user profile:", err);
					}
				})
				.finally(() => {
					setIsCreatingProfile(false);
				});
		}
	}, [
		authLoading,
		isAuthenticated,
		user,
		profile,
		isCreatingProfile,
		error,
		createProfile,
	]);

	// Show role-specific welcome toast only once when user first signs in
	useEffect(() => {
		if (
			!signInToastShown.current &&
			!authLoading &&
			isAuthenticated &&
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
				toast.success(`Welcome back, ${profile?.displayName || "User"}!`, {
					description:
						role === "player"
							? "You can view your teams and games."
							: "You have view-only access to tournament data.",
				});
			}
		}
	}, [authLoading, isAuthenticated, profile]);

	const currentProfile = profile ?? null;
	const isAdmin = currentProfile?.role === "admin";
	const isOrganizer = currentProfile?.role === "organizer";
	const isPlayer = currentProfile?.role === "player";
	const isSpectator = currentProfile?.role === "spectator";

	const isLoading =
		authLoading ||
		isCreatingProfile ||
		(!!isAuthenticated && profile === undefined);

	return {
		isLoaded: !authLoading,
		isSignedIn: !!isAuthenticated,
		user: user ?? null,
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
