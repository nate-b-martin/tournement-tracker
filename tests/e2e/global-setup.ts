import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env.local (if it exists)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envLocalPath = path.resolve(__dirname, "../../.env.local");
if (fs.existsSync(envLocalPath)) {
	dotenv.config({ path: envLocalPath });
} else {
	console.log("ℹ️  .env.local not found (expected in CI), using process.env from GitHub Actions");
}

const CLERK_PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_TEST_EMAIL = process.env.CLERK_TEST_EMAIL;

// Debug logging
console.log(`DEBUG: CLERK_PUBLISHABLE_KEY exists: ${!!CLERK_PUBLISHABLE_KEY}`);
console.log(`DEBUG: CLERK_SECRET_KEY exists: ${!!CLERK_SECRET_KEY}`);
console.log(`DEBUG: CLERK_TEST_EMAIL exists: ${!!CLERK_TEST_EMAIL}`);

const authFile = path.join(__dirname, "../../playwright/.clerk/user.json");
const authDir = path.dirname(authFile);

setup.describe.configure({ mode: "serial" });
setup.setTimeout(60_000);

// Authenticate user and save auth state
setup("authenticate user and save auth state", async ({ page, context }) => {
	if (!CLERK_PUBLISHABLE_KEY || !CLERK_SECRET_KEY) {
		throw new Error(
			"Missing Clerk keys. Required: VITE_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY",
		);
	}

	if (!CLERK_TEST_EMAIL) {
		throw new Error(
			"Missing Clerk test credential. Required: CLERK_TEST_EMAIL",
		);
	}

	try {
		if (!fs.existsSync(authDir)) {
			fs.mkdirSync(authDir, { recursive: true });
		}

		// Configure Playwright with Clerk
		await clerkSetup({
			publishableKey: CLERK_PUBLISHABLE_KEY,
			secretKey: CLERK_SECRET_KEY,
		});

		// Navigate to app
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Sign in with test credentials
		await clerk.signIn({
			page,
			emailAddress: CLERK_TEST_EMAIL,
		});

		await clerk.loaded({ page });
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		await page.goto("/dashboard");
		await page.waitForLoadState("networkidle");
		await page.getByRole("heading", { name: /dashboard overview/i }).waitFor({
			timeout: 15_000,
		});

		// Save the authenticated state
		await context.storageState({ path: authFile });
		console.log("✓ Auth state saved to", authFile);
	} catch (error) {
		console.error("Failed to authenticate during global setup:", error);
		throw error;
	}
});
