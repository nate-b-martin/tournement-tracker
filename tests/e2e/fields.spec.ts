import { expect, test } from "./fixtures/auth";
import { TournamentDetailPage } from "./pages/TournamentDetailPage";

test.describe("Fields Management", () => {
	test.describe("Unauthenticated", () => {
		test.use({ storageState: { cookies: [], origins: [] } });

test("redirects from tournament detail when not signed in", async ({ page }) => {
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

	test.describe("Authenticated", () => {
		test("fields tab shows empty state when no fields exist", async ({ page }) => {
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
			await detailPage.clickFieldsTab();
			await detailPage.waitForFieldsTab();

			await expect(
				page.getByText(/no fields set up for this tournament/i),
			).toBeVisible();
		});

		test("admin sees Add Field button", async ({ page }) => {
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
			await detailPage.clickFieldsTab();
			await detailPage.waitForFieldsTab();

			await expect(detailPage.addFieldButton).toBeVisible();
		});

		test("create field dialog opens with required fields", async ({ page }) => {
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
			await detailPage.clickFieldsTab();
			await detailPage.waitForFieldsTab();

			await detailPage.addFieldButton.click();
			await expect(detailPage.fieldDialogTitle).toBeVisible();
			await expect(detailPage.fieldNameInput).toBeVisible();
			await expect(detailPage.fieldLocationInput).toBeVisible();
			await expect(detailPage.fieldStatusSelect).toBeVisible();
		});

		test("shows validation error when field name is missing", async ({ page }) => {
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
			await detailPage.clickFieldsTab();
			await detailPage.waitForFieldsTab();

			await detailPage.addFieldButton.click();
			await detailPage.fieldSubmitButton.click();

			await expect(page.getByText(/field name is required/i)).toBeVisible();
		});

		test("creates a field successfully", async ({ page }) => {
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
			await detailPage.clickFieldsTab();
			await detailPage.waitForFieldsTab();

			const fieldName = `E2E Field ${Date.now()}`;
			await detailPage.createField(fieldName, "Main Complex", "Available");

			await expect(detailPage.fieldCard(fieldName)).toBeVisible();
			await expect(page.getByText("Main Complex")).toBeVisible();
			await expect(page.getByText("Available")).toBeVisible();
		});

		test("edits an existing field", async ({ page }) => {
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
			await detailPage.clickFieldsTab();
			await detailPage.waitForFieldsTab();

			const originalName = `E2E Field ${Date.now()}`;
			await detailPage.createField(originalName, "Main Complex", "Available");

			const newName = `${originalName} Updated`;
			await detailPage.editField(originalName, newName);

			await expect(detailPage.fieldCard(newName)).toBeVisible();
		});

		test("deletes an existing field", async ({ page }) => {
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
			await detailPage.clickFieldsTab();
			await detailPage.waitForFieldsTab();

			const fieldName = `E2E Field ${Date.now()}`;
			await detailPage.createField(fieldName, "Main Complex", "Available");

			await detailPage.deleteField(fieldName);

			await expect(detailPage.fieldCard(fieldName)).toBeHidden();
		});
	});
});