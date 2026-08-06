import type {Page} from "@playwright/test";

export class SeasonsPage {
    constructor(private page: Page) {}

    get heading() {
        return this.page.getByRole("heading", { name: /seasons/i });
    }

    get description() {
        return this.page.getByText("Browse and manage seasons");
    }

    get createSeasonButton() {
        return this.page.getByRole("button", { name: /create season/i });
    }

    get table() {
        return this.page.getByRole("table");
    }

    get tableRows() {
        return this.page.getByRole("row");
    }

    seasonLink(name: string) {
        return this.page.getByRole("link", { name: new RegExp(name, "i") });
    }

    get searchInput() {
        return this.page.getByPlaceholder(/search seasons/i);
    }

    get statusFilterChips() {
        return this.page.locator("button").filter({ hasText: /all|planning|active|complete/i });
    }

    statusChip(status: string) {
        return this.page.locator("button").filter({ hasText: new RegExp(`^${status}$`, "i") });
    }

    get clearFiltersButton() {
        return this.page.getByRole("button", { name: /clear filters/i });
    }

    async goto() {
        await this.page.goto("/seasonspage");
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
}
