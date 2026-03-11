import { test, expect } from "./fixtures/auth";
import { AuthPage } from "./pages/AuthPage";
import { ProtectedPage } from "./pages/ProtectedPage";

test.describe("Authentication", () => {
	test.describe("Unauthenticated", () => {
		test("shows sign in button on home", async ({ unauthenticatedPage }) => {
			const authPage = new AuthPage(unauthenticatedPage.page);
			await authPage.goto("/");
			await expect(authPage.signInButton).toBeVisible();
		});

		test("shows user button when signed in", async ({ authenticatedPage }) => {
			const authPage = new AuthPage(authenticatedPage.page);
			await authPage.goto("/");
			await expect(authPage.userButton).toBeVisible();
		});

		test(
			"redirects from protected route when signed out",
			async ({ unauthenticatedPage }) => {
				const protectedPage = new ProtectedPage(unauthenticatedPage.page);
				await protectedPage.goto();
				await protectedPage.waitForAccessDenied();
			},
		);

		test(
			"shows access denied message on protected route",
			async ({ unauthenticatedPage }) => {
				const protectedPage = new ProtectedPage(unauthenticatedPage.page);
				await protectedPage.goto();
				await protectedPage.waitForAccessDenied();
				await expect(protectedPage.accessDeniedTitle).toContainText(
					/authentication required/i,
				);
			},
		);
	});

	test.describe("Authenticated", () => {
		test("can access protected route when signed in", async ({ authenticatedPage }) => {
			const protectedPage = new ProtectedPage(authenticatedPage.page);
			await protectedPage.goto();
			await protectedPage.waitForLoader();
		});

		test("can sign out", async ({ authenticatedPage }) => {
			const authPage = new AuthPage(authenticatedPage.page);
			await authPage.goto("/");
			await authPage.signOut();
			await expect(authPage.signInButton).toBeVisible();
		});
	});
});
