import type { Page } from "@playwright/test";

export class SignInDialog {
	constructor(private page: Page) {}

	get emailInput() {
		return this.page.getByLabel("Email");
	}

	get passwordInput() {
		return this.page.getByLabel("Password");
	}

	get signInButton() {
		return this.page.getByRole("button", { name: "Sign In" });
	}

	async signIn(email: string, password: string) {
		await this.emailInput.fill(email);
		await this.passwordInput.fill(password);
		await this.signInButton.click();
	}
}
