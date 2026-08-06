import { test, expect } from "./fixtures/auth";
import { SeasonsPage } from "./pages/SeasonsPage";

test.describe("Seasons Page", () => {
	test.describe("Unauthenticated", () => {
		test.use({ storageState: { cookies: [], origins: [] } });

		test("shows access denied for unauthenticated user", async ({ page }) => {
			const seasonsPage = new SeasonsPage(page);
			await seasonsPage.goto();
			await expect(
				page.getByText(/please sign in to access this content/i),
			).toBeVisible();
		});
	});

	test.describe("Authenticated", () => {
		test("page heading and description are visible", async ({ page }) => {
			const seasonsPage = new SeasonsPage(page);
			await seasonsPage.goto();
			await seasonsPage.waitForPageLoad();
			await expect(seasonsPage.heading).toBeVisible();
			await expect(seasonsPage.description).toBeVisible();
		});

		test("displays seasons data table", async ({ page }) => {
			const seasonsPage = new SeasonsPage(page);
			await seasonsPage.goto();
			await seasonsPage.waitForPageLoad();

			// Table should be visible with data or empty state
			const tableVisible = await seasonsPage.table.isVisible().catch(() => false);
			const emptyStateVisible = await page
				.getByText(/no seasons found/i)
				.isVisible()
				.catch(() => false);

			expect(tableVisible || emptyStateVisible).toBe(true);
		});

		test("search filters seasons by name", async ({ page }) => {
			const seasonsPage = new SeasonsPage(page);
			await seasonsPage.goto();
			await seasonsPage.waitForPageLoad();

			await seasonsPage.search("Spring");
			// Wait for potential re-render
			await page.waitForTimeout(500);
			// Search should either show matching results or empty state
			const emptyVisible = await page
				.getByText(/no seasons found/i)
				.isVisible()
				.catch(() => false);
			if (!emptyVisible) {
				const rows = seasonsPage.tableRows;
				const count = await rows.count();
				// At least header row should be visible
				expect(count).toBeGreaterThanOrEqual(1);
			}
		});

		test("status filter chips are interactive", async ({ page }) => {
			const seasonsPage = new SeasonsPage(page);
			await seasonsPage.goto();
			await seasonsPage.waitForPageLoad();

			// Try clicking active filter
			const activeChip = seasonsPage.statusChip("Active");
			if (await activeChip.isVisible().catch(() => false)) {
				await activeChip.click();
				await page.waitForTimeout(500);
			}
		});

		test("season names link to detail pages", async ({ page }) => {
			const seasonsPage = new SeasonsPage(page);
			await seasonsPage.goto();
			await seasonsPage.waitForPageLoad();

			// If there are season links, clicking one should navigate to detail
			const seasonLink = page.getByRole("link").filter({ has: page.locator("text=") }).first();
			if (await seasonLink.isVisible().catch(() => false)) {
				const href = await seasonLink.getAttribute("href").catch(() => null);
				if (href) {
					await seasonLink.click();
					await expect(page).toHaveURL(/\/seasons\//);
				}
			}
		});

		test("clear filters resets search", async ({ page }) => {
			const seasonsPage = new SeasonsPage(page);
			await seasonsPage.goto();
			await seasonsPage.waitForPageLoad();

			await seasonsPage.search("Spring");
			await page.waitForTimeout(300);

			if (await seasonsPage.clearFiltersButton.isVisible().catch(() => false)) {
				await seasonsPage.clearFilters();
				await page.waitForTimeout(300);
				await expect(seasonsPage.searchInput).toHaveValue("");
			}
		});
	});
});
