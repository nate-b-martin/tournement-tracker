import type { Page } from "@playwright/test";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

export interface TablePageConfig {
	/** Absolute route, e.g. "/teamspage" */
	route: string;
	/** Regex matching the page heading, e.g. /teams/i */
	headingPattern: RegExp;
	/** Regex matching the search input placeholder */
	searchPlaceholder?: RegExp;
	/** Singular/plural item name used in the empty state, e.g. "teams" */
	itemName: string;
}

/**
 * Base page object for the shared `DataTable` list pages (Teams, Players,
 * Tournaments, Seasons). Parameterize with a `TablePageConfig` to reuse the
 * common toolbar (search, status filter chips, clear filters) and table.
 */
export class TablePage {
	constructor(protected page: Page, protected config: TablePageConfig) {}

	get heading() {
		return this.page.getByRole("heading", { name: this.config.headingPattern });
	}

	get tableRows() {
		return this.page.getByRole("row");
	}

	get searchInput() {
		return this.page.getByPlaceholder(
			this.config.searchPlaceholder ?? /search/i,
		);
	}

	get clearFiltersButton() {
		return this.page.getByRole("button", { name: /clear filters/i });
	}

	get emptyStateMessage() {
		return this.page.getByText(
			new RegExp(`no ${this.config.itemName} found`, "i"),
		);
	}

	statusChip(status: string) {
		return this.page
			.locator("button")
			.filter({ hasText: new RegExp(`^${status}$`, "i") });
	}

	async goto() {
		await this.page.goto(this.config.route);
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

	async clearFilters() {
		await this.clearFiltersButton.click();
	}

	async expectTableOrEmpty() {
		const tableVisible = await this.tableRows
			.first()
			.isVisible()
			.catch(() => false);
		const emptyVisible = await this.emptyStateMessage
			.isVisible()
			.catch(() => false);
		return tableVisible || emptyVisible;
	}
}

/**
 * CRUD table page: adds the shared per-row ActionsCell (Edit/Delete) and the
 * `ConfirmDelete` dialog on top of the base `TablePage`.
 */
export class CrudTablePage extends TablePage {
	readonly confirmDeleteDialog = new ConfirmDeleteDialog(this.page);

	row(name: string) {
		return this.page.getByRole("row").filter({ hasText: name });
	}

	editButton(name: string) {
		return this.row(name).getByRole("button", { name: /edit/i });
	}

	deleteButton(name: string) {
		return this.row(name).getByRole("button", { name: /delete/i });
	}

	async openDeleteDialog(name: string) {
		await this.deleteButton(name).click();
		await this.confirmDeleteDialog.waitForDialog();
	}

	async confirmDelete() {
		await this.confirmDeleteDialog.confirm();
	}
}