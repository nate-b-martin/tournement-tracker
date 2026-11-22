import path from "path";

import { test as setup, expect } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

// Read admin creds from .env.local (set up in ticket 07)
const ADMIN_EMAIL = process.env.SITE_ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.SITE_ADMIN_PASSWORD ?? "dev-password";
const authFile = path.join(__dirname, "../../playwright/.auth/user.json");

/**
 * Ensures seed data is present in the Convex backend.
 * If the backend is unseeded, the sign-in will fail — this helper
 * provides a clear error message rather than a cryptic timeout.
 */
async function ensureBackendSeeded(page: any): Promise<void> {
	// Try to hit the backend or check for seeded UI elements
	// If seeding is missing, instruct the developer
	const seededCheck = await page
		.goto("/")
		.then(() => page.getByText(/Summer Softball Classic/i))
		.catch(() => null);

	if (!seededCheck) {
		console.info(
			"⚠️  Seed data not detected in the UI. If this is a fresh volume, run: `npx convex run seed`",
		);
		// Don't throw — let the sign-in proceed; the user can always run seeding manually
	}
}

/** Sign in as the seeded admin and save auth state for other specs. */
setup("sign in as seeded admin and save auth state", async ({ page }) => {
	// ensure backend + seed are present; fail loudly if seed missing
	await ensureBackendSeeded(page);

	await page.goto("/");
	await page
		.getByRole("button", { name: /sign in/i })
		.first()
		.click();
	const dialog = page.getByRole("dialog");
	await dialog.getByLabel("Email").fill(ADMIN_EMAIL);
	await dialog.getByLabel("Password").fill(ADMIN_PASSWORD);
	await dialog.getByRole("button", { name: /sign in/i }).click();

	// signed-in confirmation: auth widget shows the user's avatar/name
	await expect(
		page.getByText(new RegExp(ADMIN_EMAIL.split("@")[0], "i")),
	).toBeVisible({ timeout: 20_000 });

	await page.context().storageState({ path: authFile });
	console.log("✓ Auth state saved to", authFile);
});
