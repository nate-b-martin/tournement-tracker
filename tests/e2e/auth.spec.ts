import { test, expect } from "./fixtures/auth";
import { AuthPage } from "./pages/AuthPage";
import { Navigation } from "./pages/Navigation";
import { ProtectedPage } from "./pages/ProtectedPage";

test.describe("Authentication", () => {
	test.describe("Unauthenticated", () => {
		test.use({ storageState: { cookies: [], origins: [] } });

		test("shows sign in button on home", async ({ page }) => {
			const authPage = new AuthPage(page);
			await authPage.goto("/");
			await expect(authPage.signInButton).toBeVisible();
		});

		test(
			"redirects from protected route when signed out",
			async ({ page }) => {
				const protectedPage = new ProtectedPage(page);
				await protectedPage.goto();
				await protectedPage.waitForAccessDenied();
			},
		);

		test(
			"shows access denied message on protected route",
			async ({ page }) => {
				const protectedPage = new ProtectedPage(page);
				await protectedPage.goto();
				await protectedPage.waitForAccessDenied();
				await expect(protectedPage.accessDeniedTitle).toContainText(
					/authentication required/i,
				);
			},
		);
	});

	test.describe("Authenticated", () => {
		test("shows user button when signed in", async ({ page }) => {
			const authPage = new AuthPage(page);
			await authPage.goto("/");

			const navigation = new Navigation(page);
			await navigation.openMenu();
			await expect(authPage.userButton).toBeVisible();
		});

		test("can access protected route when signed in", async ({ page }) => {
			const protectedPage = new ProtectedPage(page);
			await protectedPage.goto();
			await protectedPage.waitForLoader();
		});

		test("can sign out", async ({ page }) => {
			const authPage = new AuthPage(page);
			await authPage.goto("/");
			const navigation = new Navigation(page);
			await navigation.openMenu();
			await authPage.signOut();
			await expect(authPage.signInButton).toBeVisible();
		});
	});
});
