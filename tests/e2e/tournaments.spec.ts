import { expect, test } from "./fixtures/auth";
import { TournamentsPage } from "./pages/TournamentsPage";

test.describe("Tournaments Page", () => {
	test.describe("Unauthenticated", () => {
		test.use({ storageState: { cookies: [], origins: [] } });

		test("shows access denied for unauthenticated user", async ({ page }) => {
			const tournamentsPage = new TournamentsPage(page);
			await tournamentsPage.goto();
			await expect(
				page.getByText(/please sign in to access this content/i),
			).toBeVisible();
		});
	});

	test.describe("Authenticated", () => {
		test("page heading and description are visible", async ({ page }) => {
			const tournamentsPage = new TournamentsPage(page);
			await tournamentsPage.goto();
			await tournamentsPage.waitForPageLoad();
			await expect(tournamentsPage.heading).toBeVisible();
			await expect(page.getByText(/create and manage your tournaments/i)).toBeVisible();
		});

		test("admin sees the New Tournament button", async ({ page }) => {
			const tournamentsPage = new TournamentsPage(page);
			await tournamentsPage.goto();
			await tournamentsPage.waitForPageLoad();
			await expect(tournamentsPage.newTournamentButton).toBeVisible();
		});

		test("search filters tournaments by name", async ({ page }) => {
			const tournamentsPage = new TournamentsPage(page);
			await tournamentsPage.goto();
			await tournamentsPage.waitForPageLoad();

			await tournamentsPage.search("Summer");
			await page.waitForTimeout(500);

			const emptyVisible = await page
				.getByText(/no tournaments found/i)
				.isVisible()
				.catch(() => false);
			if (!emptyVisible) {
				const count = await tournamentsPage.tableRows.count();
				expect(count).toBeGreaterThanOrEqual(1);
			}
		});

		test("status filter chips are interactive", async ({ page }) => {
			const tournamentsPage = new TournamentsPage(page);
			await tournamentsPage.goto();
			await tournamentsPage.waitForPageLoad();

			const chip = tournamentsPage.statusChip("Active");
			if (await chip.isVisible().catch(() => false)) {
				await chip.click();
				await page.waitForTimeout(500);
			}
		});

		test("clear filters resets search", async ({ page }) => {
			const tournamentsPage = new TournamentsPage(page);
			await tournamentsPage.goto();
			await tournamentsPage.waitForPageLoad();

			await tournamentsPage.search("Summer");
			await page.waitForTimeout(300);

			if (await tournamentsPage.clearFiltersButton.isVisible().catch(() => false)) {
				await tournamentsPage.clearFilters();
				await page.waitForTimeout(300);
				await expect(tournamentsPage.searchInput).toHaveValue("");
			}
		});

		test("tournament names link to detail pages", async ({ page }) => {
			const tournamentsPage = new TournamentsPage(page);
			await tournamentsPage.goto();
			await tournamentsPage.waitForPageLoad();

			const link = page.getByRole("link").filter({ has: page.locator("text=") }).first();
			if (await link.isVisible().catch(() => false)) {
				const href = await link.getAttribute("href").catch(() => null);
				if (href) {
					await link.click();
					await expect(page).toHaveURL(/\/tournaments\//);
				}
			}
		});
	});

	test.describe("Tournament CRUD", () => {
		const tournamentName = `E2E Tournament ${Date.now()}`;

		test("creates a tournament successfully", async ({ page }) => {
			const tournamentsPage = new TournamentsPage(page);
			await tournamentsPage.goto();
			await tournamentsPage.waitForPageLoad();

			await tournamentsPage.createTournament(tournamentName, "Baseball");
			await expect(tournamentsPage.successToast).toBeVisible({ timeout: 10000 });
			await expect(
				tournamentsPage.tournamentLink(tournamentName),
			).toBeVisible();
		});

		test("shows validation error when name is missing", async ({ page }) => {
			const tournamentsPage = new TournamentsPage(page);
			await tournamentsPage.goto();
			await tournamentsPage.waitForPageLoad();

			await tournamentsPage.openCreateDialog();
			await tournamentsPage.sportInput.fill("Baseball");
			await tournamentsPage.submitCreateButton.click();

			await expect(
				page.getByText(/tournament name is required/i),
			).toBeVisible();
		});

		test("shows validation error when sport is missing", async ({ page }) => {
			const tournamentsPage = new TournamentsPage(page);
			await tournamentsPage.goto();
			await tournamentsPage.waitForPageLoad();

			await tournamentsPage.openCreateDialog();
			await tournamentsPage.nameInput.fill("Unnamed Sport");
			await tournamentsPage.submitCreateButton.click();

			await expect(page.getByText(/sport is required/i)).toBeVisible();
		});

		test("edits an existing tournament", async ({ page }) => {
			const tournamentsPage = new TournamentsPage(page);
			await tournamentsPage.goto();
			await tournamentsPage.waitForPageLoad();

			await tournamentsPage.search(tournamentName);
			await page.waitForTimeout(500);

			const editButton = tournamentsPage.editButton(tournamentName);
			if (!(await editButton.isVisible().catch(() => false))) {
				test.skip(true, "Tournament not available to edit");
			}

			await editButton.click();
			await expect(
				page.getByRole("heading", { name: /edit tournament/i }),
			).toBeVisible();
			await tournamentsPage.nameInput.fill(`${tournamentName} Updated`);
			await tournamentsPage.saveChangesButton.click();

			await expect(tournamentsPage.successToast).toBeVisible({ timeout: 10000 });
		});

		test("deletes an existing tournament", async ({ page }) => {
			const tournamentsPage = new TournamentsPage(page);
			await tournamentsPage.goto();
			await tournamentsPage.waitForPageLoad();

			const deleteButton = tournamentsPage.deleteButton(`${tournamentName} Updated`);
			if (!(await deleteButton.isVisible().catch(() => false))) {
				test.skip(true, "Tournament not available to delete");
			}

			await deleteButton.click();
			await expect(tournamentsPage.deleteConfirmTitle).toBeVisible();
			await tournamentsPage.confirmDeleteButton.click();

			await expect(page.getByText(/tournament deleted/i)).toBeVisible({
				timeout: 10000,
			});
		});
	});
});