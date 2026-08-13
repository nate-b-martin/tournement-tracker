import type { Page } from "@playwright/test";

export class TeamsPage {
	constructor(private page: Page) {}

	get heading() {
		return this.page.getByRole("heading", { name: /teams/i });
	}

	get addTeamButton() {
		return this.page.getByRole("button", { name: /add team/i });
	}

	get searchInput() {
		return this.page.getByPlaceholder(/search teams, coach/i);
	}

	get clearFiltersButton() {
		return this.page.getByRole("button", { name: /clear filters/i });
	}

	get tableRows() {
		return this.page.getByRole("row");
	}

	statusChip(status: string) {
		return this.page
			.locator("button")
			.filter({ hasText: new RegExp(`^${status}$`, "i") });
	}

	// Create dialog
	get createDialogTitle() {
		return this.page.getByRole("heading", { name: /add team/i });
	}

	get nameInput() {
		return this.page.getByLabel(/team name/i);
	}

	get coachNameInput() {
		return this.page.getByLabel(/coach name/i);
	}

	get coachEmailInput() {
		return this.page.getByLabel(/coach email/i);
	}

	get coachPhoneInput() {
		return this.page.getByLabel(/coach phone/i);
	}

	get tournamentSelect() {
		return this.page.getByLabel(/tournament/i);
	}

	get submitCreateButton() {
		return this.page.getByRole("button", { name: /^create team$/i });
	}

	get successToast() {
		return this.page.getByText(/team (created|updated) successfully/i);
	}

	async goto() {
		await this.page.goto("/teamspage");
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