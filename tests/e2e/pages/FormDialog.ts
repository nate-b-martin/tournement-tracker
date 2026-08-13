import type { Page } from "@playwright/test";

export interface FormDialogConfig {
	/** Regex matching the create-mode dialog title, e.g. /create tournament/i */
	createTitlePattern: RegExp;
	/** Regex matching the edit-mode dialog title, e.g. /edit tournament/i */
	editTitlePattern: RegExp;
	/** Regex matching the create-mode submit button, e.g. /^create tournament$/i */
	submitCreatePattern?: RegExp;
	/** Regex matching the edit-mode submit button, e.g. /^save changes$/i */
	submitEditPattern?: RegExp;
}

/**
 * Base page object for the create/edit form dialogs used across the CRUD
 * pages. The dialogs share a header (create vs edit title) and footer (Cancel
 * + submit). Feature pages extend this and add their specific form fields.
 */
export class FormDialog {
	constructor(protected page: Page, protected config: FormDialogConfig) {}

	get dialog() {
		return this.page.getByRole("dialog");
	}

	get createTitle() {
		return this.page.getByRole("heading", { name: this.config.createTitlePattern });
	}

	get editTitle() {
		return this.page.getByRole("heading", { name: this.config.editTitlePattern });
	}

	get cancelButton() {
		return this.page.getByRole("button", { name: /cancel/i });
	}

	get submitCreateButton() {
		return this.page.getByRole("button", {
			name: this.config.submitCreatePattern ?? /save/i,
		});
	}

	get submitEditButton() {
		return this.page.getByRole("button", {
			name: this.config.submitEditPattern ?? /save/i,
		});
	}

	async waitForCreate() {
		await this.createTitle.waitFor({ state: "visible", timeout: 10000 });
	}

	async waitForEdit() {
		await this.editTitle.waitFor({ state: "visible", timeout: 10000 });
	}

	async cancel() {
		await this.cancelButton.click();
	}
}