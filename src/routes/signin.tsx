import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/signin")({
	component: SignInPage,
});

type Mode = "signIn" | "signUp";

function SignInPage() {
	const navigate = useNavigate();
	const { isAuthenticated, isLoading } = useConvexAuth();
	const { signIn } = useAuthActions();
	const [mode, setMode] = useState<Mode>("signIn");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			void navigate({ to: "/" });
		}
	}, [isAuthenticated, isLoading, navigate]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			await signIn("password", { email, password, flow: mode });
			await navigate({ to: "/" });
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Unable to sign in. Please try again.",
			);
			setPassword("");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (isAuthenticated) {
		return null;
	}

	const isSignUp = mode === "signUp";

	return (
		<div className="flex min-h-[60vh] items-center justify-center py-10">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>{isSignUp ? "Create an account" : "Sign in"}</CardTitle>
					<CardDescription>
						{isSignUp
							? "Register to manage tournaments, teams, and players."
							: "Sign in to manage tournaments, teams, and players."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
						{error && (
							<Alert variant="destructive">
								<AlertTitle>Authentication failed</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="flex flex-col gap-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								autoComplete="email"
								required
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								disabled={isSubmitting}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								autoComplete={isSignUp ? "new-password" : "current-password"}
								required
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								disabled={isSubmitting}
							/>
						</div>

						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
							{isSignUp ? "Create account" : "Sign in"}
						</Button>

						<Button
							type="button"
							variant="link"
							className="self-center"
							onClick={() => {
								setMode(isSignUp ? "signIn" : "signUp");
								setError(null);
							}}
						>
							{isSignUp
								? "Already have an account? Sign in"
								: "Need an account? Create one"}
						</Button>

						<p className="text-center text-sm text-muted-foreground">
							<Link to="/" className="underline-offset-4 hover:underline">
								Back to home
							</Link>
						</p>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
