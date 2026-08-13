import type { Page } from "@playwright/test";
import { TabbedDetailPage } from "./TabbedDetailPage";

export class PlayerDetailsPage extends TabbedDetailPage {
	constructor(page: Page) {
		super(page, {
			backPattern: /back to players/i,
			tabs: ["Overview", "Game Stats"],
		});
	}

	get editButton() {
		return this.page.getByLabel("Edit player");
	}

	get overviewTab() {
		return this.tab("overview");
	}

	get gameStatsTab() {
		return this.tab("game stats");
	}

	playerName(name: string) {
		return this.page.getByRole("heading", { name: new RegExp(name, "i") });
	}

	async gotoPlayer(id: string) {
		await this.page.goto(`/players/${id}`);
	}

	async clickOverviewTab() {
		await this.clickTab("overview");
	}

	async clickGameStatsTab() {
		await this.clickTab("game stats");
	}
}