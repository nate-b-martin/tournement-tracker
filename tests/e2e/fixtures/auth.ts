import { clerk } from "@clerk/testing/playwright";
import { test as base, expect } from "@playwright/test";

const CLERK_TEST_EMAIL = process.env.CLERK_TEST_EMAIL ?? "test@example.com";
const CLERK_TEST_PASSWORD = process.env.CLERK_TEST_PASSWORD ?? "testpassword";

const hasClerkKeys = !!(
	process.env.VITE_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

interface AuthFixtures {
	authenticatedPage: { page: import("@playwright/test").Page };
	unauthenticatedPage: { page: import("@playwright/test").Page };
}

export const test = base.extend<AuthFixtures>({
	authenticatedPage: async ({ page }, use) => {
		if (!hasClerkKeys) {
			base.skip(true, "Missing Clerk keys");
			return;
		}
		await page.goto("/");
		await clerk.signIn({
			page,
			signInParams: {
				strategy: "password",
				identifier: CLERK_TEST_EMAIL,
				password: CLERK_TEST_PASSWORD,
			},
		});
		await use({ page });
	},

	unauthenticatedPage: async ({ page }, use) => {
		await page.goto("/");
		await use({ page });
	},
});

export { expect };
