import type { Page } from "@playwright/test";
import { CrudTablePage } from "./TablePage";

export class TournamentsPage extends CrudTablePage {
	constructor(page: Page) {
		super(page, {
			route: "/tournamentspage",
			headingPattern: /tournaments/i,
			searchPlaceholder: /search tournaments/i,
			itemName: "tournaments",
		});
	}

	get newTournamentButton() {
		return this.page.getByRole("button", { name: /new tournament/i });
	}

	get createDialogTitle() {
		return this.page.getByRole("heading", { name: /create tournament/i });
	}

	get editDialogTitle() {
		return this.page.getByRole("heading", { name: /edit tournament/i });
	}

	get nameInput() {
		return this.page.getByLabel(/tournament name/i);
	}

	get sportInput() {
		return this.page.getByLabel(/sport/i);
	}

	get submitCreateButton() {
		return this.page.getByRole("button", { name: /^create tournament$/i });
	}

	get saveChangesButton() {
		return this.page.getByRole("button", { name: /save changes/i });
	}

	get successToast() {
		return this.page.getByText(/tournament (created|updated) successfully/i);
	}

	tournamentLink(name: string) {
		return this.page.getByRole("link", { name: new RegExp(name, "i") });
	}

	async openCreateDialog() {
		await this.newTournamentButton.click();
		await this.createDialogTitle.waitFor({ state: "visible" });
	}

	async createTournament(name: string, sport: string) {
		await this.openCreateDialog();
		await this.nameInput.fill(name);
		await this.sportInput.fill(sport);
		await this.submitCreateButton.click();
	}
}