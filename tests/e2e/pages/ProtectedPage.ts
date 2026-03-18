import type { Page } from "@playwright/test";

export class ProtectedPage {
	readonly path = "/dashboard";

	constructor(private page: Page) {}

	get loader() {
		return this.page.locator(".animate-spin");
	}

	get dashboardHeading() {
		return this.page.getByRole("heading", { name: /dashboard overview/i });
	}

	get teamsCountHeading() {
		return this.page.getByRole("heading", { name: /total teams count/i });
	}

	get accessDeniedTitle() {
		return this.page.getByRole("heading", {
			name: /authentication required|admin access required/i,
		});
	}

	get signInPrompt() {
		return this.page.getByText(/please sign in to access/i);
	}

	async goto() {
		await this.page.goto(this.path);
	}

	async waitForLoader() {
		await this.loader
			.first()
			.waitFor({ state: "visible", timeout: 5000 })
			.catch(() => {});
		await this.loader.first().waitFor({ state: "hidden", timeout: 10000 });
	}

	async waitForAuthenticatedAccess() {
		await this.page.waitForURL(/\/dashboard\/?$/, { timeout: 15_000 });
		await this.page.waitForLoadState("domcontentloaded");

		await Promise.race([
			this.dashboardHeading.first().waitFor({ timeout: 15_000 }),
			this.teamsCountHeading.first().waitFor({ timeout: 15_000 }),
			this.loader.first().waitFor({ state: "hidden", timeout: 15_000 }),
		]).catch(() => {});

		const authDeniedVisible = await this.signInPrompt
			.isVisible()
			.catch(() => false);

		if (authDeniedVisible) {
			throw new Error(
				"Expected authenticated access to /dashboard, but access-denied content was visible.",
			);
		}
	}

	async waitForAccessDenied() {
		await this.page.waitForURL(/\/dashboard\/?$/, { timeout: 15_000 });
		await this.accessDeniedTitle.first().waitFor({ timeout: 15_000 });
	}
}
