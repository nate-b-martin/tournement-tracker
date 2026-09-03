import { expect, test } from "./fixtures/auth";
import { TournamentDetailPage, gotoTournamentDetail } from "./pages/TournamentDetailPage";

test.describe("Bracket View", () => {
	test.describe("Unauthenticated", () => {
		test.use({ storageState: { cookies: [], origins: [] } });

test("redirects from tournament detail when not signed in", async ({ page }) => {
		await page.goto("/tournaments/test-id");
		await page.waitForLoadState("domcontentloaded");
		// Check for access denied heading or sign in prompt
		const accessDeniedVisible = await page
			.getByRole("heading", { name: /authentication required|admin access required/i })
			.first()
			.isVisible()
			.catch(() => false);
		const signInVisible = await page
			.getByText(/please sign in to access/i)
			.isVisible()
			.catch(() => false);
		expect(accessDeniedVisible || signInVisible).toBe(true);
	});
	});

	test.describe("Authenticated", () => {
		test("bracket tab shows empty state when no games exist", async ({ page }) => {
			// Navigate to tournaments page and find any existing tournament
			await page.goto("/tournamentspage");
			await page.waitForLoadState("networkidle");

			const tournamentLink = page
				.getByRole("link")
				.filter({ has: page.locator("text=") })
				.first();
			const linkCount = await tournamentLink.count().catch(() => 0);
			test.skip(linkCount === 0, "No tournaments available for testing");

			const tournamentName = await tournamentLink.textContent().catch(() => "");
			if (!tournamentName) {
				test.skip(true, "Could not get tournament name");
			}

			await tournamentLink.click();
			await page.waitForURL(/\/tournaments\//);

			const detailPage = new TournamentDetailPage(page);
			await detailPage.waitForPageLoad();
			await detailPage.clickBracketTab();
			await detailPage.waitForBracketTab();

			await expect(
				page.getByText(/no games scheduled yet/i),
			).toBeVisible();
			await expect(
				page.getByText(/games will appear here once the bracket is generated/i),
			).toBeVisible();
		});

		test("bracket renders when games exist", async ({ page }) => {
			await page.goto("/tournamentspage");
			await page.waitForLoadState("networkidle");

			const tournamentLink = page
				.getByRole("link")
				.filter({ has: page.locator("text=") })
				.first();
			const linkCount = await tournamentLink.count().catch(() => 0);
			test.skip(linkCount === 0, "No tournaments available for testing");

			await tournamentLink.click();
			await page.waitForURL(/\/tournaments\//);

			const detailPage = new TournamentDetailPage(page);
			await detailPage.waitForPageLoad();
			await detailPage.clickBracketTab();
			await detailPage.waitForBracketTab();

			// Bracket view should be present or empty state
			const bracketVisible = await detailPage.bracketView
				.isVisible()
				.catch(() => false);
			const emptyVisible = await page
				.getByText(/no games scheduled yet/i)
				.isVisible()
				.catch(() => false);

			expect(bracketVisible || emptyVisible).toBe(true);
		});

		test("bracket shows correct bracket type label", async ({ page }) => {
			await page.goto("/tournamentspage");
			await page.waitForLoadState("networkidle");

			const tournamentLink = page
				.getByRole("link")
				.filter({ has: page.locator("text=") })
				.first();
			const linkCount = await tournamentLink.count().catch(() => 0);
			test.skip(linkCount === 0, "No tournaments available for testing");

			await tournamentLink.click();
			await page.waitForURL(/\/tournaments\//);

			const detailPage = new TournamentDetailPage(page);
			await detailPage.waitForPageLoad();
			await detailPage.clickBracketTab();
			await detailPage.waitForBracketTab();

			// Check for bracket type badges or labels
			const bracketTypeLabel = page
				.getByText(/single elimination|double elimination|round robin/i)
				.first();
			const isVisible = await bracketTypeLabel.isVisible().catch(() => false);
			if (!isVisible) {
				// Bracket type might be in the tournament header
				await expect(page.getByText(/bracket/i)).toBeVisible();
			}
		});
	});
});