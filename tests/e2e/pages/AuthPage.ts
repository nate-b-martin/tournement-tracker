import type { Page } from "@playwright/test";

export class AuthPage {
	constructor(private page: Page) {}

	/** Trigger the app's Sign In dialog (opens the SignInDialog) */
	get signInButton() {
		return this.page.getByRole("button", { name: /sign in/i });
	}

	/** User menu / initials / name shown when signed in */
	get userButton() {
		return this.page.getByRole("button", { name: /open user menu/i });
	}

	/** Sign out via the AuthWidget / user menu */
	async signOut() {
		await this.userButton.click();
		await this.page.getByRole("menuitem", { name: /sign out/i }).click();
	}

	async goto(page = "/") {
		await this.page.goto(page);
	}
}
