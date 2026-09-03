import { expect, test } from "./fixtures/auth";
import { GamesPage } from "./pages/GamesPage";
import { TournamentDetailPage } from "./pages/TournamentDetailPage";

test.describe("Games Management", () => {
	test.describe("Unauthenticated", () => {
		test.use({ storageState: { cookies: [], origins: [] } });

		test("redirects from gamespage when not signed in", async ({ page }) => {
			await page.goto("/gamespage");
			await expect(
				page.getByText(/please sign in to access this content/i),
			).toBeVisible();
		});

		test("redirects from tournament detail games tab when not signed in", async ({
			page,
		}) => {
			await page.goto("/tournaments/test-id");
			await page.waitForLoadState("domcontentloaded");
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

	test.describe("Games Page (/gamespage)", () => {
		test("page heading is visible", async ({ page }) => {
			const gamesPage = new GamesPage(page);
			await gamesPage.goto();
			await gamesPage.waitForPageLoad();
			await expect(gamesPage.heading).toBeVisible();
		});

		test("displays games data table or empty state", async ({ page }) => {
			const gamesPage = new GamesPage(page);
			await gamesPage.goto();
			await gamesPage.waitForPageLoad();

			expect(await gamesPage.expectTableOrEmpty()).toBe(true);
		});

		test("search filters games", async ({ page }) => {
			const gamesPage = new GamesPage(page);
			await gamesPage.goto();
			await gamesPage.waitForPageLoad();

			await gamesPage.search("Warriors");
			await page.waitForTimeout(500);

			const emptyVisible = await page
				.getByText(/no games found/i)
				.isVisible()
				.catch(() => false);
			if (!emptyVisible) {
				const count = await gamesPage.tableRows.count();
				expect(count).toBeGreaterThanOrEqual(1);
			}
		});

		test("status filter chips are interactive", async ({ page }) => {
			const gamesPage = new GamesPage(page);
			await gamesPage.goto();
			await gamesPage.waitForPageLoad();

			const chip = gamesPage.statusChip("Scheduled");
			if (await chip.isVisible().catch(() => false)) {
				await chip.click();
				await page.waitForTimeout(500);
			}
		});

		test("clear filters resets search", async ({ page }) => {
			const gamesPage = new GamesPage(page);
			await gamesPage.goto();
			await gamesPage.waitForPageLoad();

			await gamesPage.search("Warriors");
			await page.waitForTimeout(300);

			if (await gamesPage.clearFiltersButton.isVisible().catch(() => false)) {
				await gamesPage.clearFilters();
				await page.waitForTimeout(300);
				await expect(gamesPage.searchInput).toHaveValue("");
			}
		});
	});

	test.describe("Tournament Detail - Games Tab", () => {
		test("games tab shows empty state when no games exist", async ({ page }) => {
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

			await expect(page.getByText(/no games found/i)).toBeVisible();
		});

		test("admin sees Add Game button", async ({ page }) => {
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

			await expect(detailPage.addGameButton).toBeVisible();
		});

		test("create game dialog opens with required fields", async ({ page }) => {
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

			await detailPage.addGameButton.click();
			await expect(detailPage.gameDialogTitle).toBeVisible();
			await expect(detailPage.gameRoundInput).toBeVisible();
			await expect(detailPage.gameGameNumberInput).toBeVisible();
			await expect(detailPage.gameTeam1Select).toBeVisible();
			await expect(detailPage.gameTeam2Select).toBeVisible();
			await expect(detailPage.gameScheduledTimeInput).toBeVisible();
			await expect(detailPage.gameStatusSelect).toBeVisible();
		});

		test("shows validation error when round is missing", async ({ page }) => {
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

			await detailPage.addGameButton.click();
			await detailPage.gameSubmitButton.click();

			await expect(page.getByText(/round is required/i)).toBeVisible();
		});

		test("shows validation error when game number is missing", async ({ page }) => {
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

			await detailPage.addGameButton.click();
			await detailPage.gameRoundInput.fill("1");
			await detailPage.gameSubmitButton.click();

			await expect(page.getByText(/game number is required/i)).toBeVisible();
		});

		test("shows validation error when team 1 is missing", async ({ page }) => {
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

			await detailPage.addGameButton.click();
			await detailPage.gameRoundInput.fill("1");
			await detailPage.gameGameNumberInput.fill("1");
			await detailPage.gameSubmitButton.click();

			await expect(page.getByText(/team 1 is required/i)).toBeVisible();
		});
	});
});