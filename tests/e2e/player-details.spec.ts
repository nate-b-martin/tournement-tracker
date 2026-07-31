import { expect, test } from "./fixtures/auth";
import { PlayerDetailsPage } from "./pages/PlayerDetailsPage";

test.describe("Player Details", () => {
	test.describe("Authenticated", () => {
		test("navigates from players page via player name click", async ({
			page,
		}) => {
			await page.goto("/playerspage");
			await page.waitForLoadState("networkidle");

			// Find a clickable player name in the table
			const playerNameButton = page
				.locator("tbody button")
				.filter({ hasText: /./ })
				.first();
			const count = await playerNameButton.count().catch(() => 0);
			test.skip(count === 0, "No players available for testing");

			const expectedName = await playerNameButton.textContent();

			await playerNameButton.click();
			await page.waitForURL(/\/players\//);

			// Verify the details page shows the player's name in the header
			const headerName = page.locator("h1");
			await expect(headerName).toContainText(expectedName?.trim() ?? "");
		});

		test("renders player details header, info cards, and tabs", async ({
			page,
		}) => {
			const detailsPage = new PlayerDetailsPage(page);

			await page.goto("/playerspage");
			await page.waitForLoadState("networkidle");

			const playerNameButton = page
				.locator("tbody button")
				.filter({ hasText: /./ })
				.first();
			const count = await playerNameButton.count().catch(() => 0);
			test.skip(count === 0, "No players available for testing");

			await playerNameButton.click();
			await page.waitForURL(/\/players\//);
			await page.waitForTimeout(1000);

			// Header info
			await expect(page.locator("h1")).toBeVisible();
			await expect(detailsPage.backButton).toBeVisible();

			// Tabs render
			await expect(detailsPage.overviewTab).toBeVisible();
			await expect(detailsPage.gameStatsTab).toBeVisible();

			// Info cards render
			await expect(page.getByText("Profile", { exact: true })).toBeVisible();
			await expect(page.getByText("Team", { exact: true })).toBeVisible();
			await expect(page.getByText("Stats", { exact: true })).toBeVisible();
		});

		test("navigates back to players page", async ({ page }) => {
			const detailsPage = new PlayerDetailsPage(page);

			await page.goto("/playerspage");
			await page.waitForLoadState("networkidle");

			const playerNameButton = page
				.locator("tbody button")
				.filter({ hasText: /./ })
				.first();
			const count = await playerNameButton.count().catch(() => 0);
			test.skip(count === 0, "No players available for testing");

			await playerNameButton.click();
			await page.waitForURL(/\/players\//);

			await detailsPage.backButton.click();
			await page.waitForURL(/\/playerspage\//);
			await expect(
				page.getByRole("heading", { name: /players/i }),
			).toBeVisible();
		});

		test("shows game stats tab content", async ({ page }) => {
			const detailsPage = new PlayerDetailsPage(page);

			await page.goto("/playerspage");
			await page.waitForLoadState("networkidle");

			const playerNameButton = page
				.locator("tbody button")
				.filter({ hasText: /./ })
				.first();
			const count = await playerNameButton.count().catch(() => 0);
			test.skip(count === 0, "No players available for testing");

			await playerNameButton.click();
			await page.waitForURL(/\/players\//);
			await page.waitForTimeout(1000);

			await detailsPage.clickGameStatsTab();
			await page.waitForTimeout(500);

			// Stats area renders (empty state or table)
			const statsArea = page.getByText(/game stats recorded|^loading stats/i);
			const table = page.getByRole("table");
			const hasStatsContent = (await statsArea.count()) > 0 ||
				(await table.isVisible().catch(() => false));
			expect(hasStatsContent).toBe(true);
		});
	});

	test.describe("Unauthenticated", () => {
		test.use({ storageState: { cookies: [], origins: [] } });

		test("shows sign-in prompt when visiting player details", async ({
			page,
		}) => {
			await page.goto("/players/some-player-id");
			await page.waitForLoadState("networkidle");
			const accessDenied = page.getByText(/please sign in to access/i);
			await expect(accessDenied).toBeVisible({ timeout: 10000 });
		});
	});
});
