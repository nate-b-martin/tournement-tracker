import { useAuthActions } from "@convex-dev/auth/react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

function SignOutButton() {
	const { signOut } = useAuthActions();

	const handleSignOut = async () => {
		try {
			await signOut();
			toast.success("You have been signed out.");
		} catch (error) {
			console.error("Sign out error:", error);
			toast.error("Failed to sign out. Please try again.");
		}
	};

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={handleSignOut}
			className="w-full justify-start gap-2 text-gray-400 hover:text-white hover:bg-gray-800"
		>
			<LogOut className="w-4 h-4" />
			Sign Out
		</Button>
	);
}

export default SignOutButton;
