import { renderHook, waitFor } from "@testing-library/react";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vite-plus/test";

// Stable string references so useQuery calls can be asserted per function.
vi.mock("../../../convex/_generated/api", () => ({
	api: {
		users: { getCurrent: "users:getCurrent" },
		userProfiles: {
			getCurrentUser: "userProfiles.getCurrentUser",
			createUserProfile: "userProfiles:createUserProfile",
		},
	},
}));

vi.mock("@convex-dev/auth/react", () => ({
	useConvexAuth: vi.fn(),
}));

vi.mock("convex/react", () => ({
	useQuery: vi.fn(),
	useMutation: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		warning: vi.fn(),
		error: vi.fn(),
	},
}));

import { useConvexAuth } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";

const authUser = {
	_id: "users1",
	_creationTime: 1,
	name: "Admin",
	email: "admin@example.com",
};

const adminProfile = {
	_id: "profile1",
	_creationTime: 1,
	userId: "users1",
	role: "admin" as const,
	displayName: "Admin",
	email: "admin@example.com",
};

const mockAuth = vi.mocked(useConvexAuth);
const mockUseQuery = vi.mocked(useQuery);
const mockUseMutation = vi.mocked(useMutation);
const mockCreateProfile = vi.fn();

let authState: { isLoading: boolean; isAuthenticated: boolean };
let currentUser: unknown;
let currentProfile: unknown;

beforeEach(() => {
	vi.stubEnv("VITE_CONVEX_URL", "https://test.convex.cloud");
	authState = { isLoading: false, isAuthenticated: false };
	currentUser = undefined;
	currentProfile = undefined;

	mockAuth.mockImplementation(() => ({
		...authState,
		fetchAccessToken: vi.fn(async () => null),
	}));
	mockUseQuery.mockImplementation(((ref: unknown) => {
		if (ref === "users:getCurrent") return currentUser;
		if (ref === "userProfiles.getCurrentUser") return currentProfile;
		return undefined;
	}) as unknown as typeof useQuery);
	mockUseMutation.mockReturnValue(mockCreateProfile);
	mockCreateProfile.mockReset().mockResolvedValue(adminProfile);
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.clearAllMocks();
});

describe("useAuth", () => {
	it("returns safe defaults and fires no queries when signed out", () => {
		const { result } = renderHook(() => useAuth());

		expect(result.current.isLoaded).toBe(true);
		expect(result.current.isSignedIn).toBe(false);
		expect(result.current.user).toBeNull();
		expect(result.current.profile).toBeNull();
		expect(result.current.isAdmin).toBe(false);
		expect(result.current.isLoading).toBe(false);

		expect(mockUseQuery).toHaveBeenCalledWith("users:getCurrent", "skip");
		expect(mockUseQuery).toHaveBeenCalledWith(
			"userProfiles.getCurrentUser",
			"skip",
		);
		expect(mockCreateProfile).not.toHaveBeenCalled();
	});

	it("reports loading while the auth state is resolving", () => {
		authState = { isLoading: true, isAuthenticated: false };

		const { result } = renderHook(() => useAuth());

		expect(result.current.isLoaded).toBe(false);
		expect(result.current.isLoading).toBe(true);
	});

	it("exposes the Convex Auth user, profile, and role when signed in", () => {
		authState = { isLoading: false, isAuthenticated: true };
		currentUser = authUser;
		currentProfile = adminProfile;

		const { result } = renderHook(() => useAuth());

		expect(result.current.isSignedIn).toBe(true);
		expect(result.current.user).toEqual(authUser);
		expect(result.current.user?.email).toBe("admin@example.com");
		expect(result.current.user?.name).toBe("Admin");
		expect(result.current.profile).toEqual(adminProfile);
		expect(result.current.isAdmin).toBe(true);
		expect(result.current.isLoading).toBe(false);

		expect(mockUseQuery).toHaveBeenCalledWith("users:getCurrent", {});
		expect(mockUseQuery).toHaveBeenCalledWith(
			"userProfiles.getCurrentUser",
			{},
		);
		expect(mockCreateProfile).not.toHaveBeenCalled();
	});

	it("auto-creates a profile with the Convex Auth user data", async () => {
		authState = { isLoading: false, isAuthenticated: true };
		currentUser = authUser;
		currentProfile = null;

		// Once created, the profile query resolves to the new profile so the
		// auto-create guard stops re-firing (mirrors Convex reactivity).
		mockCreateProfile.mockImplementation(() => {
			currentProfile = adminProfile;
			return Promise.resolve(adminProfile);
		});

		const { result } = renderHook(() => useAuth());

		await waitFor(() => {
			expect(mockCreateProfile).toHaveBeenCalledTimes(1);
		});

		expect(mockCreateProfile).toHaveBeenCalledWith({
			email: "admin@example.com",
			displayName: "Admin",
		});
		expect(result.current.hasError).toBe(false);
	});

	it("treats a duplicate profile creation as success (idempotent)", async () => {
		authState = { isLoading: false, isAuthenticated: true };
		currentUser = authUser;
		currentProfile = null;

		mockCreateProfile.mockImplementation(() => {
			currentProfile = adminProfile;
			return Promise.reject(new Error("User profile already exists"));
		});

		const { result } = renderHook(() => useAuth());

		await waitFor(() => {
			expect(mockCreateProfile).toHaveBeenCalledTimes(1);
		});

		expect(result.current.hasError).toBe(false);
		expect(toast.error).not.toHaveBeenCalled();
	});

	it("surfaces profile creation failures as an error state", async () => {
		authState = { isLoading: false, isAuthenticated: true };
		currentUser = authUser;
		currentProfile = null;

		mockCreateProfile.mockImplementation(() => {
			// Profile stays null so the guard remains armed; the error state
			// must be set instead of looping.
			return Promise.reject(new Error("Network down"));
		});

		const { result } = renderHook(() => useAuth());

		await waitFor(() => {
			expect(result.current.hasError).toBe(true);
		});

		expect(result.current.error?.message).toBe("Network down");
		expect(toast.error).toHaveBeenCalledWith("Auth error: Network down");
	});

	it("returns safe defaults without touching hooks when Convex is unconfigured", () => {
		vi.stubEnv("VITE_CONVEX_URL", "");

		const { result } = renderHook(() => useAuth());

		expect(result.current).toMatchObject({
			isLoaded: true,
			isSignedIn: false,
			user: null,
			profile: null,
			isAdmin: false,
			isLoading: false,
			isOnline: true,
		});
		expect(mockAuth).not.toHaveBeenCalled();
		expect(mockUseQuery).not.toHaveBeenCalled();
		expect(mockUseMutation).not.toHaveBeenCalled();
	});
});
