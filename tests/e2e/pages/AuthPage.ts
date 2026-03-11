import type { Page } from "@playwright/test";

export class AuthPage {
	constructor(private page: Page) {}

	get signInButton() {
		return this.page.getByRole("button", { name: /sign in/i });
	}

	get userButton() {
		return this.page.locator(".cl-userButton");
	}

	async clickSignIn() {
		await this.signInButton.click();
	}

	async signOut() {
		await this.userButton.click();
		await this.page.getByRole("menuitem", { name: /sign out/i }).click();
	}

	async goto(page = "/") {
		await this.page.goto(page);
	}
}
