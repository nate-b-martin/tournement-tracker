import type {Page} from "@playwright/test";

export class Navigation {
    constructor(private page: Page) {}

    get sidebar() {
        return this.page.locator("aside").first();
    }

    get hamburgerButton() {
        return this.page.getByRole('button', { name: 'Open menu' });
    }

    get signInButton() {
        return this.page.getByRole('button', { name: /sign in/i });
    }

    get closeMenuButton() {
        return this.page.getByRole('button', { name: 'Close menu' });
    }

    async openMenu() {
        await this.hamburgerButton.click();
    }

    async closeMenu() {
        await this.closeMenuButton.click();
    }


}