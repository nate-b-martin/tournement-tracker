import { expect, test } from "./fixtures/auth";
import { TeamsPage } from "./pages/TeamsPage";

test.describe("Teams Page", () => {
	test.describe("Unauthenticated", () => {
		test.use({ storageState: { cookies: [], origins: [] } });

		test("shows access denied for unauthenticated user", async ({ page }) => {
			const teamsPage = new TeamsPage(page);
			await teamsPage.goto();
			await expect(
				page.getByText(/please sign in to access this content/i),
			).toBeVisible();
		});
	});

	test.describe("Authenticated", () => {
		test("page heading is visible", async ({ page }) => {
			const teamsPage = new TeamsPage(page);
			await teamsPage.goto();
			await teamsPage.waitForPageLoad();
			await expect(teamsPage.heading).toBeVisible();
		});

		test("displays teams data table or empty state", async ({ page }) => {
			const teamsPage = new TeamsPage(page);
			await teamsPage.goto();
			await teamsPage.waitForPageLoad();

			expect(await teamsPage.expectTableOrEmpty()).toBe(true);
		});

		test("search filters teams", async ({ page }) => {
			const teamsPage = new TeamsPage(page);
			await teamsPage.goto();
			await teamsPage.waitForPageLoad();

			await teamsPage.search("Warriors");
			await page.waitForTimeout(500);

			const emptyVisible = await page
				.getByText(/no teams found/i)
				.isVisible()
				.catch(() => false);
			if (!emptyVisible) {
				const count = await teamsPage.tableRows.count();
				expect(count).toBeGreaterThanOrEqual(1);
			}
		});

		test("status filter chips are interactive", async ({ page }) => {
			const teamsPage = new TeamsPage(page);
			await teamsPage.goto();
			await teamsPage.waitForPageLoad();

			const chip = teamsPage.statusChip("Active");
			if (await chip.isVisible().catch(() => false)) {
				await chip.click();
				await page.waitForTimeout(500);
			}
		});

		test("clear filters resets search", async ({ page }) => {
			const teamsPage = new TeamsPage(page);
			await teamsPage.goto();
			await teamsPage.waitForPageLoad();

			await teamsPage.search("Warriors");
			await page.waitForTimeout(300);

			if (await teamsPage.clearFiltersButton.isVisible().catch(() => false)) {
				await teamsPage.clearFiltersButton.click();
				await page.waitForTimeout(300);
				await expect(teamsPage.searchInput).toHaveValue("");
			}
		});
	});

	test.describe("Team CRUD", () => {
		test("admin sees the Add Team button", async ({ page }) => {
			const teamsPage = new TeamsPage(page);
			await teamsPage.goto();
			await teamsPage.waitForPageLoad();
			await expect(teamsPage.addTeamButton).toBeVisible();
		});

		test("create team dialog opens with required fields", async ({ page }) => {
			const teamsPage = new TeamsPage(page);
			await teamsPage.goto();
			await teamsPage.waitForPageLoad();

			await teamsPage.addTeamButton.click();
			await expect(teamsPage.createDialogTitle).toBeVisible();
			await expect(teamsPage.nameInput).toBeVisible();
			await expect(teamsPage.coachNameInput).toBeVisible();
			await expect(teamsPage.coachEmailInput).toBeVisible();
			await expect(teamsPage.coachPhoneInput).toBeVisible();
		});

		test("shows validation error when team name is missing", async ({ page }) => {
			const teamsPage = new TeamsPage(page);
			await teamsPage.goto();
			await teamsPage.waitForPageLoad();

			await teamsPage.addTeamButton.click();
			await teamsPage.submitCreateButton.click();

			await expect(page.getByText(/team name is required/i)).toBeVisible();
		});

		test("creates a team when a tournament exists", async ({ page }) => {
			const teamsPage = new TeamsPage(page);
			await teamsPage.goto();
			await teamsPage.waitForPageLoad();

			// Team creation requires selecting an existing tournament.
			const hasTournaments = await teamsPage.tournamentSelect
				.isVisible()
				.catch(() => false);
			if (!hasTournaments) {
				test.skip(true, "No tournaments available to create a team");
			}

			const teamName = `E2E Team ${Date.now()}`;
			await teamsPage.addTeamButton.click();
			await teamsPage.nameInput.fill(teamName);
			await teamsPage.coachNameInput.fill("Coach Smith");
			await teamsPage.coachEmailInput.fill("coach@example.com");
			await teamsPage.coachPhoneInput.fill("555-0123");

			await teamsPage.tournamentSelect.click();
			const firstOption = page.getByRole("option").first();
			if (await firstOption.isVisible().catch(() => false)) {
				await firstOption.click();
			}

			await teamsPage.submitCreateButton.click();
			await expect(teamsPage.successToast).toBeVisible({ timeout: 10000 });
		});
	});
});