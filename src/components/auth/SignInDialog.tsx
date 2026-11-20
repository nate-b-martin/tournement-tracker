import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SignInDialog() {
	const { signIn } = useAuthActions();
	const [open, setOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [flow, setFlow] = useState("signIn");
	const [error, setError] = useState<string | null>(null);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		try {
			await signIn("password", { email, password, flow });
			setOpen(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Sign in failed");
		}
	};

	const toggleFlow = () => {
		setFlow((prev) => (prev === "signIn" ? "signUp" : "signIn"));
		setError(null);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{flow === "signIn" ? "Sign In" : "Create account"}
					</DialogTitle>
					<DialogDescription>
						{flow === "signIn"
							? "Log in to manage tournaments."
							: "Register to manage tournaments, teams, and players."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={onSubmit} className="space-y-4">
					{error && (
						<div
							aria-describedby="error-message"
							className="mb-3 text-sm text-red-600"
						>
							{error}
						</div>
					)}

					<div className="flex flex-col gap-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							autoComplete={
								flow === "signUp" ? "new-password" : "current-password"
							}
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>

					<Button type="submit">
						{flow === "signIn" ? "Sign In" : "Create account"}
					</Button>

					<Button type="button" variant="outline" onClick={toggleFlow}>
						{flow === "signIn"
							? "No account? Create one"
							: "Have an account? Sign in"}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default SignInDialog;
