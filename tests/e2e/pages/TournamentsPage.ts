import type { Page } from "@playwright/test";

export class TournamentsPage {
	constructor(private page: Page) {}

	get heading() {
		return this.page.getByRole("heading", { name: /tournaments/i });
	}

	get newTournamentButton() {
		return this.page.getByRole("button", { name: /new tournament/i });
	}

	get searchInput() {
		return this.page.getByPlaceholder(/search tournaments/i);
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

	tournamentLink(name: string) {
		return this.page.getByRole("link", { name: new RegExp(name, "i") });
	}

	rowActions(name: string) {
		return this.page.getByRole("row").filter({ hasText: name });
	}

	editButton(name: string) {
		return this.rowActions(name).getByRole("button", { name: /edit/i });
	}

	deleteButton(name: string) {
		return this.rowActions(name).getByRole("button", { name: /delete/i });
	}

	// Create dialog
	get createDialogTitle() {
		return this.page.getByRole("heading", { name: /create tournament/i });
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

	// Delete confirm dialog
	get deleteConfirmTitle() {
		return this.page.getByRole("heading", { name: /are you sure/i });
	}

	get confirmDeleteButton() {
		return this.page.getByRole("button", { name: /^delete$/i });
	}

	async goto() {
		await this.page.goto("/tournamentspage");
	}

	async waitForPageLoad() {
		await this.heading.waitFor({ state: "visible", timeout: 15000 });
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

	async search(query: string) {
		await this.searchInput.fill(query);
	}

	async filterByStatus(status: string) {
		await this.statusChip(status).click();
	}

	async clearFilters() {
		await this.clearFiltersButton.click();
	}
}