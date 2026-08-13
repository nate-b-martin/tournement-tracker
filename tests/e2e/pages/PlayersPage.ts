import type { Page } from "@playwright/test";

export class PlayersPage {
	constructor(private page: Page) {}

	get heading() {
		return this.page.getByRole("heading", { name: /players/i });
	}

	get addPlayerButton() {
		return this.page.getByRole("button", { name: /add player/i });
	}

	get searchInput() {
		return this.page.getByPlaceholder(/search players, email/i);
	}

	get clearFiltersButton() {
		return this.page.getByRole("button", { name: /clear filters/i });
	}

	get tableRows() {
		return this.page.getByRole("row");
	}

	get contactInfoTab() {
		return this.page.getByRole("tab", { name: /contact info/i });
	}

	get individualStatsTab() {
		return this.page.getByRole("tab", { name: /individual stats/i });
	}

	statusChip(status: string) {
		return this.page
			.locator("button")
			.filter({ hasText: new RegExp(`^${status}$`, "i") });
	}

	async goto() {
		await this.page.goto("/playerspage");
	}

	async waitForPageLoad() {
		await this.heading.waitFor({ state: "visible", timeout: 15000 });
	}

	async search(query: string) {
		await this.searchInput.fill(query);
	}

	async filterByStatus(status: string) {
		await this.statusChip(status).click();
	}
}