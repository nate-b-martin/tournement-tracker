import {
	SignedIn,
	SignedOut,
	SignInButton,
	UserButton,
} from "@clerk/clerk-react";
import { useEffect, useState } from "react";

export default function HeaderUser() {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	return (
		<>
			<SignedIn>
				<UserButton />
			</SignedIn>
			<SignedOut>
				<SignInButton />
			</SignedOut>
		</>
	);
}
