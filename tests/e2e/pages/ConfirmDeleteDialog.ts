import type { Page } from "@playwright/test";

/**
 * Reusable delete-confirmation dialog. Rendered by the shared
 * `ConfirmDelete` component, so it is identical across all CRUD pages.
 */
export class ConfirmDeleteDialog {
	constructor(protected page: Page) {}

	get title() {
		return this.page.getByRole("heading", { name: /are you sure/i });
	}

	get confirmButton() {
		return this.page.getByRole("button", { name: /^delete$/i });
	}

	get cancelButton() {
		return this.page.getByRole("button", { name: /^cancel$/i });
	}

	get loadingButton() {
		return this.page.getByRole("button", { name: /deleting/i });
	}

	async confirm() {
		await this.confirmButton.click();
	}

	async cancel() {
		await this.cancelButton.click();
	}

	async waitForDialog() {
		await this.title.waitFor({ state: "visible", timeout: 10000 });
	}
}