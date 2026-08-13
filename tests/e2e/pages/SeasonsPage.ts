import type { Page } from "@playwright/test";
import { TablePage } from "./TablePage";

export class SeasonsPage extends TablePage {
	constructor(page: Page) {
		super(page, {
			route: "/seasonspage",
			headingPattern: /seasons/i,
			searchPlaceholder: /search seasons/i,
			itemName: "seasons",
		});
	}

	get description() {
		return this.page.getByText("Browse and manage seasons");
	}

	get table() {
		return this.page.getByRole("table");
	}

	get createSeasonButton() {
		return this.page.getByRole("button", { name: /create season/i });
	}

	seasonLink(name: string) {
		return this.page.getByRole("link", { name: new RegExp(name, "i") });
	}
}