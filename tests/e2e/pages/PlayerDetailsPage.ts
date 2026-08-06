import type { Page } from "@playwright/test";

export class PlayerDetailsPage {
	constructor(private page: Page) {}

	get backButton() {
		return this.page.getByRole("button", { name: /back to players/i });
	}

	get overviewTab() {
		return this.page.getByRole("tab", { name: /overview/i });
	}

	get gameStatsTab() {
		return this.page.getByRole("tab", { name: /game stats/i });
	}

	get editButton() {
		return this.page.getByLabel("Edit player");
	}

	playerName(name: string) {
		return this.page.getByRole("heading", { name: new RegExp(name, "i") });
	}

	async gotoPlayer(id: string) {
		await this.page.goto(`/players/${id}`);
	}

	async clickOverviewTab() {
		await this.overviewTab.click();
	}

	async clickGameStatsTab() {
		await this.gameStatsTab.click();
	}
}
