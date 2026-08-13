import type { Page } from "@playwright/test";
import { CrudTablePage } from "./TablePage";

export class PlayersPage extends CrudTablePage {
	constructor(page: Page) {
		super(page, {
			route: "/playerspage",
			headingPattern: /players/i,
			searchPlaceholder: /search players, email/i,
			itemName: "players",
		});
	}

	get addPlayerButton() {
		return this.page.getByRole("button", { name: /add player/i });
	}

	get contactInfoTab() {
		return this.page.getByRole("tab", { name: /contact info/i });
	}

	get individualStatsTab() {
		return this.page.getByRole("tab", { name: /individual stats/i });
	}
}