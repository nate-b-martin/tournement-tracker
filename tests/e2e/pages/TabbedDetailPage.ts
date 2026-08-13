import type { Page } from "@playwright/test";

export interface TabbedDetailConfig {
	/** Regex matching the back button, e.g. /back to players/i */
	backPattern: RegExp;
	/** Tab names rendered by the page, e.g. ["Overview", "Game Stats"] */
	tabs: string[];
}

/**
 * Base page object for tabbed detail pages (player details, season detail).
 * Provides tab navigation keyed by tab name.
 */
export class TabbedDetailPage {
	constructor(protected page: Page, protected config: TabbedDetailConfig) {}

	get backButton() {
		return this.page.getByRole("button", { name: this.config.backPattern });
	}

	tab(name: string) {
		return this.page.getByRole("tab", { name: new RegExp(name, "i") });
	}

	async clickTab(name: string) {
		await this.tab(name).click();
	}

	async waitForTab(name: string) {
		await this.tab(name).waitFor({ state: "visible", timeout: 10000 });
	}

	async goBack() {
		await this.backButton.click();
	}
}