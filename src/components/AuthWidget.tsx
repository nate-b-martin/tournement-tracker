import { useConvexAuth, useAuthActions } from "@convex-dev/auth/react";
import { Link } from "@tanstack/react-router";
import { Eye, LogIn, LogOut, Shield } from "lucide-react";
import { toast } from "sonner";

import { useCurrentUser } from "@/hooks/useCurrentUser";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

function getInitials(profile: { displayName?: string; email?: string } | null) {
	const source = profile?.displayName || profile?.email || "?";

	return source.slice(0, 1).toUpperCase();
}

export function AuthWidget() {
	const { isAuthenticated, isLoading } = useConvexAuth();
	const { signOut } = useAuthActions();
	const { profile, isAdmin } = useCurrentUser();

	const handleSignOut = async () => {
		try {
			await signOut();
			toast.success("You have been signed out.");
		} catch (error) {
			console.error("Sign out error:", error);
			toast.error("Failed to sign out. Please try again.");
		}
	};

	// Loading state
	if (isLoading) {
		return (
			<div className="flex items-center gap-3 p-3">
				<Skeleton className="h-10 w-10 rounded-full" />
				<div className="flex flex-col gap-2 flex-1">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-3 w-24" />
				</div>
			</div>
		);
	}

	// Signed out state
	if (!isAuthenticated) {
		return (
			<Button asChild variant="outline" className="w-full justify-start gap-2">
				<Link to="/signin">
					<LogIn className="h-4 w-4" />
					<span>Sign In</span>
				</Link>
			</Button>
		);
	}

	// Signed in - show user info and role
	return (
		<div className="flex flex-col gap-3">
			{/* User info section */}
			<div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-800/50">
				<div className="flex items-center gap-2 flex-1 min-w-0">
					<div
						className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-sm font-semibold text-white"
						aria-hidden="true"
					>
						{getInitials(profile)}
					</div>
					<div className="flex flex-col min-w-0">
						<span className="text-sm font-medium text-white truncate">
							{profile?.displayName || "User"}
						</span>
						<span className="text-xs text-gray-400 truncate">
							{profile?.email}
						</span>
					</div>
				</div>

				{/* Role badge */}
				{isAdmin ? (
					<Badge className="bg-purple-600 hover:bg-purple-700 text-white border-0 shrink-0">
						<Shield className="w-3 h-3 mr-1" />
						Admin
					</Badge>
				) : (
					<Badge
						variant="secondary"
						className="bg-gray-600 text-gray-200 border-0 shrink-0"
					>
						<Eye className="w-3 h-3 mr-1" />
						View
					</Badge>
				)}
			</div>

			{/* Sign out button */}
			<Button
				variant="ghost"
				size="sm"
				onClick={handleSignOut}
				className="w-full justify-start gap-2 text-gray-400 hover:text-white hover:bg-gray-800"
			>
				<LogOut className="w-4 h-4" />
				Sign Out
			</Button>
		</div>
	);
}
