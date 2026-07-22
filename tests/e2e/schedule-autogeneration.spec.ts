import { expect, test } from "./fixtures/auth";
import { SeasonDetailPage } from "./pages/SeasonDetailPage";

test.describe("Schedule Auto-Generation", () => {
	test.describe("Authenticated", () => {
		test("happy path: generate round-robin schedule from season detail page", async ({
			page,
		}) => {
			const detailPage = new SeasonDetailPage(page);

			// Navigate to seasons page to find a season link
			await page.goto("/seasonspage");
			await page.waitForLoadState("networkidle");

			// Find a season link to navigate to a detail page
			const seasonLink = page.getByRole("link").filter({
				has: page.locator("text="),
			});
			const linkCount = await seasonLink.count().catch(() => 0);

			// Skip test if no seasons exist
			test.skip(linkCount === 0, "No seasons available for testing");

			// Click the first season link
			await seasonLink.first().click();
			await page.waitForURL(/\/seasons\//);
			await detailPage.waitForScheduleTab();

			// Switch to Schedule tab
			await detailPage.clickScheduleTab();
			await page.waitForTimeout(500);

			// Check if Generate Schedule button is visible (admin with teams)
			const generateBtnVisible = await detailPage.generateScheduleButton
				.isVisible()
				.catch(() => false);

			if (!generateBtnVisible) {
				test.skip(true, "Generate Schedule not visible — not admin or no teams");
			}

			// Open the generate schedule dialog
			await detailPage.clickGenerateSchedule();
			await detailPage.waitForGenerateDialog();

			// Verify dialog title
			await expect(detailPage.dialogTitle).toBeVisible();

			// Configure schedule: double round-robin, 8 weeks, 2 games/week
			// Select "Double Round-Robin" from schedule type dropdown
			const typeSelect = page.getByRole("combobox", { name: /schedule type/i });
			await typeSelect.click();
			await page.getByRole("option", { name: /double round-robin/i }).click();
			await page.waitForTimeout(200);

			// Set weeks
			await detailPage.fillWeeks("8");
			await page.waitForTimeout(200);

			// Set games per week (keep default 2)
			await detailPage.fillGamesPerWeek("2");
			await page.waitForTimeout(200);

			// Verify summary shows expected info
			await expect(detailPage.summaryBox).toBeVisible();

			// Submit schedule generation
			await detailPage.submitGenerateSchedule();

			// Verify success toast appears
			const successToast = page.getByText(/schedule generated/i);
			await expect(successToast).toBeVisible({ timeout: 10000 });

			// After generation, the dialog closes and the schedule table should show games
			await page.waitForTimeout(1000);
			const tableVisible = await detailPage.scheduleTable
				.isVisible()
				.catch(() => false);

			if (tableVisible) {
				const rows = await page.getByRole("row").count();
				expect(rows).toBeGreaterThanOrEqual(1);
			}
		});

		test("schedule dialog shows validation when teams < 2", async ({
			page,
		}) => {
			const detailPage = new SeasonDetailPage(page);

			await page.goto("/seasonspage");
			await page.waitForLoadState("networkidle");

			const seasonLink = page.getByRole("link").filter({
				has: page.locator("text="),
			});
			const linkCount = await seasonLink.count().catch(() => 0);
			test.skip(linkCount === 0, "No seasons available for testing");

			await seasonLink.first().click();
			await page.waitForURL(/\/seasons\//);
			await detailPage.waitForScheduleTab();
			await detailPage.clickScheduleTab();
			await page.waitForTimeout(500);

			const generateBtnVisible = await detailPage.generateScheduleButton
				.isVisible()
				.catch(() => false);

			if (!generateBtnVisible) {
				test.skip(
					true,
					"Generate Schedule not visible — not admin or no teams",
				);
			}

			await detailPage.clickGenerateSchedule();
			await detailPage.waitForGenerateDialog();

			// Set weeks too low to trigger slot validation
			await detailPage.fillWeeks("1");
			await detailPage.fillGamesPerWeek("1");

			// The generate button should be disabled when not enough slots
			const generateBtn = detailPage.generateButtonInDialog;
			const isDisabled = await generateBtn.isDisabled().catch(() => false);
			expect(isDisabled).toBe(true);
		});

		test("navigates to standings tab and shows bracket button when games completed", async ({
			page,
		}) => {
			const detailPage = new SeasonDetailPage(page);

			await page.goto("/seasonspage");
			await page.waitForLoadState("networkidle");

			const seasonLink = page.getByRole("link").filter({
				has: page.locator("text="),
			});
			const linkCount = await seasonLink.count().catch(() => 0);
			test.skip(linkCount === 0, "No seasons available for testing");

			await seasonLink.first().click();
			await page.waitForURL(/\/seasons\//);
			await page.waitForTimeout(1000);

			// Click standings tab
			await detailPage.clickStandingsTab();
			await page.waitForTimeout(500);

			// Check if standings table is visible
			const standingsTable = page.getByRole("table");
			const standingsVisible = await standingsTable
				.isVisible()
				.catch(() => false);

			if (standingsVisible) {
				const rows = await page.getByRole("row").count();
				expect(rows).toBeGreaterThanOrEqual(1);
			}

			// Check if Generate Tournament Bracket button is visible
			const bracketBtnVisible = await detailPage.bracketButton
				.isVisible()
				.catch(() => false);

			if (bracketBtnVisible) {
				await detailPage.clickGenerateBracket();
				// Verify bracket dialog opens
				const bracketDialog = page.getByRole("heading", {
					name: /generate tournament bracket/i,
				});
				await expect(bracketDialog).toBeVisible({ timeout: 5000 });
			}
		});
	});

	test.describe("Unauthenticated", () => {
		test.use({ storageState: { cookies: [], origins: [] } });

		test("redirects from seasons detail when not signed in", async ({
			page,
		}) => {
			await page.goto("/seasons/test-id");
			await page.waitForLoadState("networkidle");
			const accessDenied = page.getByText(/please sign in to access/i);
			await expect(accessDenied).toBeVisible({ timeout: 10000 });
		});
	});
});
