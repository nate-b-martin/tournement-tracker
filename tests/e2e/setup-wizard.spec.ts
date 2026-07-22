import { test, expect } from "./fixtures/auth";
import { SetupWizardPage } from "./pages/SetupWizardPage";

test.describe("Setup Wizard", () => {
	test.describe("Flow 1: Admin launches setup wizard from homepage", () => {
		test("shows setup wizard button on admin homepage", async ({ page }) => {
			const wizard = new SetupWizardPage(page);
			await wizard.goto();
			await expect(wizard.setupWizardButton).toBeVisible();
		});

		test("opens wizard dialog when button is clicked", async ({ page }) => {
			const wizard = new SetupWizardPage(page);
			await wizard.goto();
			await wizard.openWizard();
			await wizard.waitForDialog();
			await expect(wizard.step1Heading).toBeVisible();
		});
	});

	test.describe("Flow 2: Admin navigates through all 5 wizard steps", () => {
		test("back button is hidden on step 1", async ({ page }) => {
			const wizard = new SetupWizardPage(page);
			await wizard.goto();
			await wizard.openWizard();
			await wizard.waitForDialog();
			await expect(wizard.backButton).not.toBeVisible();
		});

		test("next button is disabled until 2 teams selected", async ({ page }) => {
			const wizard = new SetupWizardPage(page);
			await wizard.goto();
			await wizard.openWizard();
			await wizard.waitForDialog();
			await expect(wizard.nextButton).toBeDisabled();
		});

		test("select 2 teams enables next button", async ({ page }) => {
			const wizard = new SetupWizardPage(page);
			await wizard.goto();
			await wizard.openWizard();
			await wizard.waitForDialog();

			const teamButton1 = wizard.existingTeam("Diamond Divas");
			const teamButton2 = wizard.existingTeam("Swing Sisters");
			const team1Exists = await teamButton1.isVisible().catch(() => false);
			const team2Exists = await teamButton2.isVisible().catch(() => false);

			test.skip(!team1Exists || !team2Exists, "Seeded teams not available");

			await teamButton1.click();
			await teamButton2.click();
			await expect(wizard.nextButton).toBeEnabled();
		});

		test("navigates through all 5 steps", async ({ page }) => {
			const wizard = new SetupWizardPage(page);
			await wizard.goto();
			await wizard.openWizard();
			await wizard.waitForDialog();

			const teams = [
				wizard.existingTeam("Diamond Divas"),
				wizard.existingTeam("Swing Sisters"),
			];
			const bothTeamsVisible = (
				await Promise.all(
					teams.map((t) => t.isVisible().catch(() => false)),
				)
			).every(Boolean);
			test.skip(!bothTeamsVisible, "Seeded teams not available");

			// Step 1 → Select 2 teams
			for (const team of teams) {
				await team.click();
			}
			await wizard.goNext();
			await expect(wizard.step2Heading).toBeVisible();

			// Step 2 → Skip players, go next
			await wizard.goNext();
			await expect(wizard.step3Heading).toBeVisible();

			// Step 3 → Fill season
			await wizard.fillSeason(
				"E2E Test Season",
				"Baseball",
				"2026-08-01",
				"2026-09-30",
			);
			await wizard.goNext();
			await expect(wizard.step4Heading).toBeVisible();

			// Step 4 → Fill tournament
			await wizard.fillTournament("E2E Test Tournament", "Test City");
			await wizard.goNext();
			await expect(wizard.step5Heading).toBeVisible();

			// Step 5 → Verify "Create All" button
			await expect(wizard.createAllButton).toBeVisible();
		});

		test("can go back to previous steps", async ({ page }) => {
			const wizard = new SetupWizardPage(page);
			await wizard.goto();
			await wizard.openWizard();
			await wizard.waitForDialog();

			const teamButton = wizard.existingTeam("Diamond Divas");
			const teamExists = await teamButton.isVisible().catch(() => false);
			test.skip(!teamExists, "Seeded teams not available");

			await teamButton.click();
			await wizard.existingTeam("Swing Sisters").click();
			await wizard.goNext();
			await expect(wizard.step2Heading).toBeVisible();

			await wizard.goBack();
			await expect(wizard.step1Heading).toBeVisible();
		});
	});

	test.describe("Flow 3: Admin creates a new team inline", () => {
		test("shows and hides create new team form", async ({ page }) => {
			const wizard = new SetupWizardPage(page);
			await wizard.goto();
			await wizard.openWizard();
			await wizard.waitForDialog();

			await expect(wizard.createNewTeamButton).toBeVisible();
			await wizard.createNewTeamButton.click();
			await expect(wizard.newTeamNameInput).toBeVisible();

			await wizard.cancelNewTeamButton.click();
			await expect(wizard.newTeamNameInput).not.toBeVisible();
		});

		test("creates a new team and adds a player", async ({ page }) => {
			const wizard = new SetupWizardPage(page);
			await wizard.goto();
			await wizard.openWizard();
			await wizard.waitForDialog();

			await wizard.createNewTeam(
				"E2E New Team",
				"Coach E2E",
				"e2e@example.com",
				"555-0000",
				"E2E City",
			);
			await expect(wizard.selectedTeamChip("E2E New Team")).toBeVisible();

			const selectTeamsDone = await wizard.selectedTeamChip("E2E New Team").isVisible();
			test.skip(!selectTeamsDone, "Team not added");

			// Select another existing team to meet minimum 2 teams
			const existingTeam = wizard.existingTeam("Diamond Divas");
			const teamExists = await existingTeam.isVisible().catch(() => false);
			test.skip(!teamExists, "Seeded team not available");

			await existingTeam.click();
			await wizard.goNext();
			await expect(wizard.step2Heading).toBeVisible();

			// Add a player to new team
			await wizard.teamTab("E2E New Team").click();
			await wizard.addPlayer("Jane", "Player", "99");
			await expect(wizard.playerInRoster("Jane", "Player")).toBeVisible();

			// Go to review
			await wizard.goNext();
			await wizard.fillSeason("E2E Season", "Baseball", "2026-08-01", "2026-09-30");
			await wizard.goNext();
			await wizard.fillTournament("E2E Tournament", "E2E City");
			await wizard.goNext();
			await expect(wizard.step5Heading).toBeVisible();

			// Verify new team appears in review
			await expect(wizard.summaryCard("Teams")).toBeVisible();
			await expect(
				wizard.page.getByText("E2E New Team").first(),
			).toBeVisible();
		});
	});

	test.describe("Flow 4: Admin discards wizard with unsaved data", () => {
		test("shows discard confirmation dialog", async ({ page }) => {
			const wizard = new SetupWizardPage(page);
			await wizard.goto();
			await wizard.openWizard();
			await wizard.waitForDialog();

			// Create a new team to add unsaved data to wizard state
			await wizard.createNewTeam(
				"Unsaved Team",
				"Coach",
				"coach@example.com",
				"555-0100",
			);
			await expect(wizard.selectedTeamChip("Unsaved Team")).toBeVisible();

			// Try to close dialog via the X close button
			await wizard.dialogCloseButton.click();
			await expect(wizard.discardDialogTitle).toBeVisible();
		});

		test("cancelling discard keeps wizard open", async ({ page }) => {
			const wizard = new SetupWizardPage(page);
			await wizard.goto();
			await wizard.openWizard();
			await wizard.waitForDialog();

			await wizard.createNewTeam(
				"Unsaved Team",
				"Coach",
				"coach@example.com",
				"555-0100",
			);
			await wizard.dialogCloseButton.click();
			await expect(wizard.discardDialogTitle).toBeVisible();

			await wizard.cancelDiscardButton.click();
			await expect(wizard.discardDialogTitle).not.toBeVisible();
			await expect(wizard.dialogTitle).toBeVisible();
		});

		test("confirming discard resets and closes wizard", async ({ page }) => {
			const wizard = new SetupWizardPage(page);
			await wizard.goto();
			await wizard.openWizard();
			await wizard.waitForDialog();

			await wizard.createNewTeam(
				"Unsaved Team",
				"Coach",
				"coach@example.com",
				"555-0100",
			);
			await wizard.dialogCloseButton.click();
			await expect(wizard.discardDialogTitle).toBeVisible();

			await wizard.discardButton.click();
			await wizard.expectWizardClosed();
		});
	});

	test.describe("Flow 5: Unauthenticated user cannot see wizard", () => {
		test.use({ storageState: { cookies: [], origins: [] } });

		test("setup wizard button is not visible", async ({ page }) => {
			const wizard = new SetupWizardPage(page);
			await wizard.goto();
			await expect(wizard.setupWizardButton).not.toBeVisible();
		});

		test("admin quick actions section is not visible", async ({ page }) => {
			const wizard = new SetupWizardPage(page);
			await wizard.goto();
			await expect(wizard.adminQuickActions).not.toBeVisible();
		});
	});
});
