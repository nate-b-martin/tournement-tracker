import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class SetupWizardPage {
	constructor(private page: Page) {}

	// ── Homepage ──────────────────────────────────────────────

	get setupWizardButton(): Locator {
		return this.page.getByRole("button", { name: /setup wizard/i });
	}

	get adminQuickActions(): Locator {
		return this.page.getByText("Admin Quick Actions");
	}

	get launchSetupWizardButton(): Locator {
		return this.page.getByRole("button", { name: /launch setup wizard/i });
	}

	// ── Dialog ────────────────────────────────────────────────

	get dialog(): Locator {
		return this.page.getByRole("dialog");
	}

	get dialogTitle(): Locator {
		return this.page.getByRole("heading", { name: /setup season wizard/i });
	}

	get dialogDescription(): Locator {
		return this.page.getByText(/you have selected/i);
	}

	get nextButton(): Locator {
		return this.page.getByRole("button", { name: /next/i });
	}

	get backButton(): Locator {
		return this.page.getByRole("button", { name: /back/i });
	}

	get createAllButton(): Locator {
		return this.page.getByRole("button", { name: /create all/i });
	}

	// ── Wizard Stepper ────────────────────────────────────────

	get stepper(): Locator {
		return this.page.getByLabel("Setup progress");
	}

	stepperStep(stepNumber: number): Locator {
		return this.stepper.getByRole("button").nth(stepNumber - 1);
	}

	// ── Step 1: Select Teams ─────────────────────────────────

	get step1Heading(): Locator {
		return this.page.getByRole("heading", { name: /select teams/i });
	}

	get searchInput(): Locator {
		return this.page.getByLabel(/search teams/i);
	}

	existingTeam(name: string): Locator {
		return this.page.locator("button").filter({ hasText: name }).first();
	}

	get createNewTeamButton(): Locator {
		return this.page.getByRole("button", { name: /create new team/i });
	}

	get newTeamNameInput(): Locator {
		return this.page.getByLabel(/team name/i);
	}

	get newTeamCoachNameInput(): Locator {
		return this.page.getByLabel(/coach/i).first();
	}

	get newTeamCoachEmailInput(): Locator {
		return this.page.getByLabel(/email/i).first();
	}

	get newTeamCoachPhoneInput(): Locator {
		return this.page.getByLabel(/phone/i);
	}

	get newTeamCityInput(): Locator {
		return this.page.getByLabel(/city/i);
	}

	get addTeamButton(): Locator {
		return this.page.getByRole("button", { name: /add team/i });
	}

	get cancelNewTeamButton(): Locator {
		return this.page.getByRole("button", { name: /cancel/i });
	}

	selectedTeamChip(name: string): Locator {
		return this.page.locator("button").filter({ hasText: name });
	}

	// ── Step 2: Manage Rosters ───────────────────────────────

	get step2Heading(): Locator {
		return this.page.getByRole("heading", { name: /manage rosters/i });
	}

	teamTab(name: string): Locator {
		return this.page.locator("button").filter({ hasText: name });
	}

	get playerFirstNameInput(): Locator {
		return this.page.getByLabel(/first name/i);
	}

	get playerLastNameInput(): Locator {
		return this.page.getByLabel(/last name/i);
	}

	get playerJerseyInput(): Locator {
		return this.page.getByRole("spinbutton", { name: /#/i });
	}

	get addPlayerButton(): Locator {
		return this.page.getByRole("button", { name: /add player/i });
	}

	playerInRoster(firstName: string, lastName: string): Locator {
		return this.page.getByText(`${firstName} ${lastName}`);
	}

	removePlayerButton(firstName: string, lastName: string): Locator {
		return this.playerInRoster(firstName, lastName)
			.locator("..")
			.getByRole("button", { name: /remove/i });
	}

	// ── Step 3: Create Season ────────────────────────────────

	get step3Heading(): Locator {
		return this.page.getByRole("heading", { name: /create season/i });
	}

	get seasonNameInput(): Locator {
		return this.page.getByLabel(/season name/i);
	}

	get sportInput(): Locator {
		return this.page.getByLabel(/sport/i).first();
	}

	get startDateInput(): Locator {
		return this.page.getByLabel(/start date/i);
	}

	get endDateInput(): Locator {
		return this.page.getByLabel(/end date/i);
	}

	get descriptionTextarea(): Locator {
		return this.page.getByLabel(/description/i);
	}

	// ── Step 4: Configure Tournament ─────────────────────────

	get step4Heading(): Locator {
		return this.page.getByRole("heading", { name: /configure tournament/i });
	}

	get tournamentNameInput(): Locator {
		return this.page.getByLabel(/tournament name/i);
	}

	get locationInput(): Locator {
		return this.page.getByLabel(/location/i);
	}

	get bracketTypeSelect(): Locator {
		return this.page.getByLabel(/bracket type/i);
	}

	get seedingTypeSelect(): Locator {
		return this.page.getByLabel(/seeding type/i);
	}

	get maxTeamsInput(): Locator {
		return this.page.getByRole("spinbutton", { name: /max teams/i });
	}

	get minTeamsInput(): Locator {
		return this.page.getByRole("spinbutton", { name: /min teams/i });
	}

	get fieldsAvailableInput(): Locator {
		return this.page.getByRole("spinbutton", { name: /fields available/i });
	}

	get gameDurationInput(): Locator {
		return this.page.getByRole("spinbutton", { name: /game duration/i });
	}

	get breakInput(): Locator {
		return this.page.getByRole("spinbutton", { name: /break between games/i });
	}

	get registrationDeadlineInput(): Locator {
		return this.page.getByLabel(/registration deadline/i);
	}

	// ── Step 5: Review & Create ──────────────────────────────

	get step5Heading(): Locator {
		return this.page.getByRole("heading", { name: /review & create/i });
	}

	summaryCard(title: string): Locator {
		return this.page.locator("h4").filter({ hasText: title });
	}

	// ── Dialog Close ─────────────────────────────────────────

	get dialogCloseButton(): Locator {
		return this.page.getByRole("button", { name: /close/i });
	}

	// ── Discard Confirmation Dialog ──────────────────────────

	get discardDialogTitle(): Locator {
		return this.page.getByRole("heading", { name: /discard progress/i });
	}

	get discardButton(): Locator {
		return this.page.getByRole("button", { name: /discard/i });
	}

	get cancelDiscardButton(): Locator {
		return this.page.getByRole("button", { name: /cancel/i });
	}

	// ── Actions ──────────────────────────────────────────────

	async goto() {
		await this.page.goto("/");
	}

	async openWizard() {
		await this.setupWizardButton.click();
	}

	async launchFromDashboard() {
		await this.launchSetupWizardButton.click();
	}

	async waitForDialog() {
		await expect(this.dialogTitle).toBeVisible({ timeout: 10000 });
	}

	async waitForDialogClose() {
		await expect(this.dialog).not.toBeVisible({ timeout: 10000 });
	}

	async goNext() {
		await this.nextButton.click();
	}

	async goBack() {
		await this.backButton.click();
	}

	async clickCreateAll() {
		await this.createAllButton.click();
	}

	async selectTeams(...teamNames: string[]) {
		for (const name of teamNames) {
			await this.existingTeam(name).click();
		}
	}

	async createNewTeam(
		name: string,
		coachName: string,
		coachEmail: string,
		coachPhone: string,
		city?: string,
	) {
		await this.createNewTeamButton.click();
		await this.newTeamNameInput.fill(name);
		await this.newTeamCoachNameInput.fill(coachName);
		await this.newTeamCoachEmailInput.fill(coachEmail);
		await this.newTeamCoachPhoneInput.fill(coachPhone);
		if (city) {
			await this.newTeamCityInput.fill(city);
		}
		await this.addTeamButton.click();
	}

	async addPlayer(
		firstName: string,
		lastName: string,
		jersey?: string,
	) {
		await this.playerFirstNameInput.fill(firstName);
		await this.playerLastNameInput.fill(lastName);
		if (jersey) {
			await this.playerJerseyInput.fill(jersey);
		}
		await this.addPlayerButton.click();
	}

	async fillSeason(
		name: string,
		sport: string,
		startDate: string,
		endDate: string,
		description?: string,
	) {
		await this.seasonNameInput.fill(name);
		await this.sportInput.fill(sport);
		await this.startDateInput.fill(startDate);
		await this.endDateInput.fill(endDate);
		if (description) {
			await this.descriptionTextarea.fill(description);
		}
	}

	async fillTournament(name: string, location: string) {
		await this.tournamentNameInput.fill(name);
		await this.locationInput.fill(location);
	}

	async clickStepperStep(stepNumber: number) {
		await this.stepperStep(stepNumber).click();
	}

	async expectStep(stepNumber: number) {
		const headings: Locator[] = [
			this.step1Heading,
			this.step2Heading,
			this.step3Heading,
			this.step4Heading,
			this.step5Heading,
		];
		await expect(headings[stepNumber - 1]).toBeVisible();
	}

	async expectStepHeading(text: string) {
		await expect(
			this.page.getByRole("heading", { name: new RegExp(text, "i") }),
		).toBeVisible();
	}

	async discardWizard() {
		await this.dialog.getByRole("button").first().click();
		await expect(this.discardDialogTitle).toBeVisible();
		await this.discardButton.click();
	}

	async expectUnauthenticated() {
		await expect(this.setupWizardButton).not.toBeVisible();
	}

	async expectWizardClosed() {
		await expect(this.dialog).not.toBeVisible();
	}
}
