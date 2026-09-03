import type { Page } from "@playwright/test";
import { CrudTablePage } from "./TablePage";

export class GamesPage extends CrudTablePage {
	constructor(page: Page) {
		super(page, {
			route: "/gamespage",
			headingPattern: /games/i,
			searchPlaceholder: /search teams, round, game/i,
			itemName: "games",
		});
	}

	get addGameButton() {
		return this.page.getByRole("button", { name: /add game/i });
	}

	get gameDialogTitle() {
		return this.page.getByRole("heading", { name: /add game/i });
	}

	get gameRoundInput() {
		return this.page.getByLabel(/round/i);
	}

	get gameGameNumberInput() {
		return this.page.getByLabel(/game number/i);
	}

	get gameTeam1Select() {
		return this.page.getByLabel(/team 1/i);
	}

	get gameTeam2Select() {
		return this.page.getByLabel(/team 2/i);
	}

	get gameFieldSelect() {
		return this.page.getByLabel(/field/i);
	}

	get gameScheduledTimeInput() {
		return this.page.getByLabel(/scheduled time/i);
	}

	get gameStatusSelect() {
		return this.page.getByLabel(/status/i);
	}

	get gameSubmitButton() {
		return this.page.getByRole("button", { name: /^create game$/i });
	}

	get successToast() {
		return this.page.getByText(/game (created|updated) successfully/i);
	}

	get statsSheetTitle() {
		return this.page.getByRole("heading", { name: /game stats/i });
	}

	get statsCloseButton() {
		return this.page.getByRole("button", { name: /close/i });
	}

	async viewGameStats(round: number, gameNumber: number) {
		await this.gameRow(round, gameNumber).click();
		await this.statsSheetTitle.waitFor({ state: "visible", timeout: 10000 });
	}

	async closeStatsSheet() {
		await this.statsCloseButton.click();
	}
}