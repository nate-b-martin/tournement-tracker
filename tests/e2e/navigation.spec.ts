import { test, expect } from "./fixtures/auth";
import { Navigation } from "./pages/Navigation";

test.describe("Navigation", () => {
    test.describe("Unauthenticated", () => {
        test.use({ storageState: { cookies: [], origins: [] } });

        test("shows sign in button when menu is opened", async ({ page }) => {
            await page.goto("/");
            const navigation = new Navigation(page);
            await navigation.openMenu();
            await expect(navigation.signInButton).toBeVisible();
        });
    });

    test.describe("Authenticated", () => {
        test("can open and close menu", async ({ page }) => {
            await page.goto("/");
        const navigation = new Navigation(page);
        await navigation.openMenu();
        await expect(navigation.sidebar).toHaveClass(/translate-x-0/);
        await expect(navigation.closeMenuButton).toBeVisible();
        await navigation.closeMenu();
        await expect(navigation.sidebar).toHaveClass(/-translate-x-full/);
        });
    });
});