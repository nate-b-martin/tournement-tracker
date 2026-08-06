import { createClerkClient } from "@clerk/backend";
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
const CLERK_TEST_PASSWORD = process.env.CLERK_TEST_PASSWORD;

// Debug logging
console.log(`DEBUG: CLERK_PUBLISHABLE_KEY exists: ${!!CLERK_PUBLISHABLE_KEY}`);
console.log(`DEBUG: CLERK_SECRET_KEY exists: ${!!CLERK_SECRET_KEY}`);
console.log(`DEBUG: CLERK_TEST_EMAIL exists: ${!!CLERK_TEST_EMAIL}`);
console.log(`DEBUG: CLERK_TEST_PASSWORD exists: ${!!CLERK_TEST_PASSWORD}`);

// Idempotently create the Clerk test user via the Backend API so the UI
// sign-in always has a valid account to authenticate with in CI (previously
// "No user found with email" aborted the run on fresh instances).
async function ensureTestUserExists(): Promise<void> {
	if (!CLERK_SECRET_KEY || !CLERK_TEST_EMAIL) return;
	const client = createClerkClient({ secretKey: CLERK_SECRET_KEY });

	try {
		const matching = await client.users.getUserList({
			emailAddress: [CLERK_TEST_EMAIL],
		});
		if (matching && matching.data && matching.data.length > 0) {
			console.log(`✓ Clerk test user already exists: ${CLERK_TEST_EMAIL}`);
			return;
		}
	} catch (error) {
		console.warn("Failed to query Clerk test user; will attempt to create:", error);
	}

	await client.users.createUser({
		emailAddress: [CLERK_TEST_EMAIL],
		...((CLERK_TEST_PASSWORD && { password: CLERK_TEST_PASSWORD }) ?? {}),
		firstName: "E2E",
		lastName: "Tester",
		skipPasswordRequirement: !CLERK_TEST_PASSWORD,
	});
	console.log(`✓ Created Clerk test user: ${CLERK_TEST_EMAIL}`);
}

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

		// Ensure the test account exists before attempting UI sign-in.
		await ensureTestUserExists();

		// Configure Playwright with Clerk
		await clerkSetup({
			publishableKey: CLERK_PUBLISHABLE_KEY,
			secretKey: CLERK_SECRET_KEY,
		});

		// Navigate to app
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Sign in with test credentials (email-based sign-in auto-creates a
		// backend sign-in ticket, so no password is required)
		await clerk.signIn({
			page,
			emailAddress: CLERK_TEST_EMAIL,
		});

		await clerk.loaded({ page });
		await page.waitForFunction(
			() => {
				const clerk = (window as unknown as { Clerk: Record<string, unknown> }).Clerk;
				return Boolean(clerk?.loaded && (clerk?.session || clerk?.user));
			},
			undefined,
			{ timeout: 20_000 },
		);

		await page.goto("/dashboard");
		await page.waitForURL(/\/dashboard\/?$/, { timeout: 15_000 });
		await page.waitForLoadState("networkidle");

		const authDeniedVisible = await page
			.getByText(/please sign in to access this content\./i)
			.isVisible()
			.catch(() => false);

		if (authDeniedVisible) {
			throw new Error(
				"Authenticated setup reached /dashboard but rendered unauthenticated access-denied content",
			);
		}

		await page
			.getByRole("heading", { name: /dashboard overview/i })
			.waitFor({ timeout: 15_000 })
			.catch(() => {
				console.log(
					"ℹ️ Dashboard heading did not render within timeout; auth session is still valid, proceeding with saved storage state",
				);
			});

		// Save the authenticated state
		await context.storageState({ path: authFile });
		console.log("✓ Auth state saved to", authFile);
	} catch (error) {
		const currentUrl = page.url();
		const pageTitle = await page.title().catch(() => "(unavailable)");
		const authDeniedVisible = await page
			.getByText(/please sign in to access this content\./i)
			.isVisible()
			.catch(() => false);

		console.error("Global setup diagnostics:", {
			currentUrl,
			pageTitle,
			authDeniedVisible,
		});
		console.error("Failed to authenticate during global setup:", error);
		throw error;
	}
});
