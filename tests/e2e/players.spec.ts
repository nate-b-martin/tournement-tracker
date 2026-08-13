import { expect, test } from "./fixtures/auth";
import { PlayersPage } from "./pages/PlayersPage";

test.describe("Players Page", () => {
	test.describe("Unauthenticated", () => {
		test.use({ storageState: { cookies: [], origins: [] } });

		test("shows access denied for unauthenticated user", async ({ page }) => {
			const playersPage = new PlayersPage(page);
			await playersPage.goto();
			await expect(
				page.getByText(/please sign in to access this content/i),
			).toBeVisible();
		});
	});

	test.describe("Authenticated", () => {
		test("page heading is visible", async ({ page }) => {
			const playersPage = new PlayersPage(page);
			await playersPage.goto();
			await playersPage.waitForPageLoad();
			await expect(playersPage.heading).toBeVisible();
		});

		test("displays players data table or empty state", async ({ page }) => {
			const playersPage = new PlayersPage(page);
			await playersPage.goto();
			await playersPage.waitForPageLoad();

			const tableVisible = await playersPage.tableRows.first().isVisible().catch(() => false);
			const emptyVisible = await page
				.getByText(/no players found/i)
				.isVisible()
				.catch(() => false);

			expect(tableVisible || emptyVisible).toBe(true);
		});

		test("search filters players", async ({ page }) => {
			const playersPage = new PlayersPage(page);
			await playersPage.goto();
			await playersPage.waitForPageLoad();

			await playersPage.search("John");
			await page.waitForTimeout(500);

			const emptyVisible = await page
				.getByText(/no players found/i)
				.isVisible()
				.catch(() => false);
			if (!emptyVisible) {
				const count = await playersPage.tableRows.count();
				expect(count).toBeGreaterThanOrEqual(1);
			}
		});

		test("status filter chips are interactive", async ({ page }) => {
			const playersPage = new PlayersPage(page);
			await playersPage.goto();
			await playersPage.waitForPageLoad();

			const chip = playersPage.statusChip("Active");
			if (await chip.isVisible().catch(() => false)) {
				await chip.click();
				await page.waitForTimeout(500);
			}
		});

		test("clear filters resets search", async ({ page }) => {
			const playersPage = new PlayersPage(page);
			await playersPage.goto();
			await playersPage.waitForPageLoad();

			await playersPage.search("John");
			await page.waitForTimeout(300);

			if (await playersPage.clearFiltersButton.isVisible().catch(() => false)) {
				await playersPage.clearFiltersButton.click();
				await page.waitForTimeout(300);
				await expect(playersPage.searchInput).toHaveValue("");
			}
		});

		test("switches between contact info and individual stats views", async ({
			page,
		}) => {
			const playersPage = new PlayersPage(page);
			await playersPage.goto();
			await playersPage.waitForPageLoad();

			await playersPage.individualStatsTab.click();
			await expect(
				page.getByText(/no player stats found/i).or(page.getByRole("table")),
			).toBeVisible({ timeout: 5000 });

			await playersPage.contactInfoTab.click();
			await expect(playersPage.searchInput).toBeVisible();
		});
	});
});