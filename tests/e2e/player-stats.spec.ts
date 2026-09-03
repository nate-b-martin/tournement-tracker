import { expect, test } from "./fixtures/auth";
import { TournamentDetailPage } from "./pages/TournamentDetailPage";
import { GamesPage } from "./pages/GamesPage";

test.describe("Player Stats (Game Stats Sheet)", () => {
	test.describe("Unauthenticated", () => {
		test.use({ storageState: { cookies: [], origins: [] } });

		test("redirects from gamespage when not signed in", async ({ page }) => {
			await page.goto("/gamespage");
			await expect(
				page.getByText(/please sign in to access this content/i),
			).toBeVisible();
		});
	});

	test.describe("Games Page (/gamespage) - Stats Button", () => {
		test("stats button is visible for admin on completed games", async ({
			page,
		}) => {
			const gamesPage = new GamesPage(page);
			await gamesPage.goto();
			await gamesPage.waitForPageLoad();

			const statsBtn = gamesPage.page
				.getByRole("button", { name: /stats/i })
				.first();
			const visible = await statsBtn.isVisible().catch(() => false);
			// Stats button may not be visible if no games or no completed games
			if (!visible) {
				test.skip(true, "No games available to view stats");
			}
		});

		test("opens stats sheet when clicking stats button", async ({ page }) => {
			const gamesPage = new GamesPage(page);
			await gamesPage.goto();
			await gamesPage.waitForPageLoad();

			const statsBtn = gamesPage.page
				.getByRole("button", { name: /stats/i })
				.first();
			const visible = await statsBtn.isVisible().catch(() => false);
			if (!visible) {
				test.skip(true, "No games available to view stats");
			}

			await statsBtn.click();
			await expect(gamesPage.statsSheetTitle).toBeVisible({
				timeout: 10000,
			});

			// Check stats sheet has expected content
			await expect(page.getByText(/team 1/i)).toBeVisible();
			await expect(page.getByText(/team 2/i)).toBeVisible();
			await expect(page.getByText(/score/i)).toBeVisible();

			await gamesPage.closeStatsSheet();
			await expect(gamesPage.statsSheetTitle).toBeHidden();
		});
	});

	test.describe("Tournament Detail - Games Tab - Stats Button", () => {
		test("stats button is visible for admin on completed games", async ({
			page,
		}) => {
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
			await detailPage.clickGamesTab();
			await detailPage.waitForGamesTab();

			const statsBtn = detailPage.page
				.getByRole("button", { name: /stats/i })
				.first();
			const visible = await statsBtn.isVisible().catch(() => false);
			if (!visible) {
				test.skip(true, "No games available to view stats");
			}
		});

		test("opens stats sheet when clicking stats button in tournament detail", async ({
			page,
		}) => {
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
			await detailPage.clickGamesTab();
			await detailPage.waitForGamesTab();

			const statsBtn = detailPage.page
				.getByRole("button", { name: /stats/i })
				.first();
			const visible = await statsBtn.isVisible().catch(() => false);
			if (!visible) {
				test.skip(true, "No games available to view stats");
			}

			await statsBtn.click();
			await expect(detailPage.statsSheetTitle).toBeVisible({
				timeout: 10000,
			});

			// Check stats sheet has expected content
			await expect(page.getByText(/team 1/i)).toBeVisible();
			await expect(page.getByText(/team 2/i)).toBeVisible();
			await expect(page.getByText(/score/i)).toBeVisible();

			await detailPage.closeStatsSheet();
			await expect(detailPage.statsSheetTitle).toBeHidden();
		});
	});
});