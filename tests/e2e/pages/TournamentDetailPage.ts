import type { Page } from "@playwright/test";
import { TabbedDetailPage } from "./TabbedDetailPage";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

export class TournamentDetailPage extends TabbedDetailPage {
	constructor(page: Page) {
		super(page, {
			backPattern: /back to tournaments/i,
			tabs: ["Teams", "Games", "Bracket", "Standings", "Fields"],
		});
	}

	get addTeamButton() {
		return this.page.getByRole("button", { name: /add team/i });
	}

	get teamDialogTitle() {
		return this.page.getByRole("heading", { name: /add team/i });
	}

	get teamNameInput() {
		return this.page.getByLabel(/team name/i);
	}

	get coachNameInput() {
		return this.page.getByLabel(/coach name/i);
	}

	get coachEmailInput() {
		return this.page.getByLabel(/coach email/i);
	}

	get coachPhoneInput() {
		return this.page.getByLabel(/coach phone/i);
	}

	get submitCreateButton() {
		return this.page.getByRole("button", { name: /^create team$/i });
	}

	get successToast() {
		return this.page.getByText(/team (created|updated|removed) successfully/i);
	}

	// Fields tab
	async clickFieldsTab() {
		await this.clickTab("fields");
	}

	async waitForFieldsTab() {
		await this.waitForTab("fields");
	}

	get addFieldButton() {
		return this.page.getByRole("button", { name: /add field/i });
	}

	get fieldDialogTitle() {
		return this.page.getByRole("heading", { name: /add field/i });
	}

	get fieldNameInput() {
		return this.page.getByLabel(/field name/i);
	}

	get fieldLocationInput() {
		return this.page.getByLabel(/location/i);
	}

	get fieldStatusSelect() {
		return this.page.getByLabel(/status/i);
	}

	get fieldSubmitButton() {
		return this.page.getByRole("button", { name: /^create field$/i });
	}

	async clickGamesTab() {
		await this.clickTab("games");
	}

	async waitForGamesTab() {
		await this.waitForTab("games");
	}

	async clickBracketTab() {
		await this.clickTab("bracket");
	}

	async waitForBracketTab() {
		await this.waitForTab("bracket");
	}

	async clickStandingsTab() {
		await this.clickTab("standings");
	}

	async waitForStandingsTab() {
		await this.waitForTab("standings");
	}

	async clickTeamsTab() {
		await this.clickTab("teams");
	}

	async waitForTeamsTab() {
		await this.waitForTab("teams");
	}

	// Games tab - games table is embedded
	get gamesTable() {
		return this.page.getByRole("table");
	}

	get addGameButton() {
		return this.page.getByRole("button", { name: /add game/i });
	}

	get gameDialogTitle() {
		return this.page.getByRole("heading", { name: /add game/i });
	}

	get gameSubmitButton() {
		return this.page.getByRole("button", { name: /^create game$/i });
	}

	get gameRoundInput() {
		return this.page.getByLabel(/round/i);
	}

	get gameGameNumberInput() {
		return this.page.getByLabel(/game number/i);
	}

	get gameTeam1Select() {
		return this.page.getByLabel(/team 1/i);
	}

	get gameTeam2Select() {
		return this.page.getByLabel(/team 2/i);
	}

	get gameFieldSelect() {
		return this.page.getByLabel(/field/i);
	}

	get gameScheduledTimeInput() {
		return this.page.getByLabel(/scheduled time/i);
	}

	get gameStatusSelect() {
		return this.page.getByLabel(/status/i);
	}

	// Stats sheet
	get statsSheetTitle() {
		return this.page.getByRole("heading", { name: /game stats/i });
	}

	get statsCloseButton() {
		return this.page.getByRole("button", { name: /close/i });
	}

	// Bracket view
	get bracketView() {
		return this.page.locator('[data-testid="bracket-view"], .bracket-view').first();
	}

	// Field card by name
	fieldCard(name: string) {
		return this.page
			.getByRole("article")
			.filter({ hasText: name })
			.first();
	}

	fieldEditButton(name: string) {
		return this.fieldCard(name).getByRole("button", { name: /edit/i });
	}

	fieldDeleteButton(name: string) {
		return this.fieldCard(name).getByRole("button", { name: /delete/i });
	}

	// Game row by round/gameNumber
	gameRow(round: number, gameNumber: number) {
		return this.page
			.getByRole("row")
			.filter({ hasText: `Round ${round}` })
			.filter({ hasText: `Game ${gameNumber}` })
			.first();
	}

	gameEditButton(round: number, gameNumber: number) {
		return this.gameRow(round, gameNumber).getByRole("button", { name: /edit/i });
	}

	gameDeleteButton(round: number, gameNumber: number) {
		return this.gameRow(round, gameNumber).getByRole("button", { name: /delete/i });
	}

	gameStatsButton(round: number, gameNumber: number) {
		return this.gameRow(round, gameNumber).getByRole("button", { name: /stats/i });
	}

	async waitForPageLoad() {
		await this.page.waitForLoadState("networkidle");
		await this.page
			.getByRole("heading", { name: /tournament/i })
			.waitFor({ state: "visible", timeout: 15000 });
	}

	async openTeamDialog() {
		await this.addTeamButton.click();
		await this.teamDialogTitle.waitFor({ state: "visible" });
	}

	async createTeam(
		name: string,
		coachName: string,
		coachEmail: string,
		coachPhone: string,
	) {
		await this.openTeamDialog();
		await this.teamNameInput.fill(name);
		await this.coachNameInput.fill(coachName);
		await this.coachEmailInput.fill(coachEmail);
		await this.coachPhoneInput.fill(coachPhone);
		await this.submitCreateButton.click();
		await this.successToast.waitFor({ state: "visible", timeout: 10000 });
	}

	async openFieldDialog() {
		await this.addFieldButton.click();
		await this.fieldDialogTitle.waitFor({ state: "visible" });
	}

	async createField(name: string, location: string, status: string) {
		await this.openFieldDialog();
		await this.fieldNameInput.fill(name);
		await this.fieldLocationInput.fill(location);
		await this.fieldStatusSelect.click();
		await this.page.getByRole("option", { name: new RegExp(status, "i") }).click();
		await this.fieldSubmitButton.click();
		await this.successToast.waitFor({ state: "visible", timeout: 10000 });
	}

	async editField(name: string, newName: string) {
		await this.fieldEditButton(name).click();
		await this.fieldDialogTitle.waitFor({ state: "visible" });
		await this.fieldNameInput.fill(newName);
		await this.fieldSubmitButton.click();
		await this.successToast.waitFor({ state: "visible", timeout: 10000 });
	}

	async deleteField(name: string) {
		await this.fieldDeleteButton(name).click();
		await this.confirmDeleteDialog.waitForDialog();
		await this.confirmDeleteDialog.confirm();
		await this.successToast.waitFor({ state: "visible", timeout: 10000 });
	}

	async openGameDialog() {
		await this.addGameButton.click();
		await this.gameDialogTitle.waitFor({ state: "visible" });
	}

	async createGame(
		round: string,
		gameNumber: string,
		team1: string,
		team2: string,
		field: string,
		scheduledTime: string,
		status: string,
	) {
		await this.openGameDialog();
		await this.gameRoundInput.fill(round);
		await this.gameGameNumberInput.fill(gameNumber);
		await this.gameTeam1Select.click();
		await this.page.getByRole("option", { name: new RegExp(team1, "i") }).click();
		await this.gameTeam2Select.click();
		await this.page.getByRole("option", { name: new RegExp(team2, "i") }).click();
		if (field) {
			await this.gameFieldSelect.click();
			await this.page.getByRole("option", { name: new RegExp(field, "i") }).click();
		}
		await this.gameScheduledTimeInput.fill(scheduledTime);
		await this.gameStatusSelect.click();
		await this.page.getByRole("option", { name: new RegExp(status, "i") }).click();
		await this.gameSubmitButton.click();
		await this.successToast.waitFor({ state: "visible", timeout: 10000 });
	}

	async viewGameStats(round: number, gameNumber: number) {
		await this.gameStatsButton(round, gameNumber).click();
		await this.statsSheetTitle.waitFor({ state: "visible", timeout: 10000 });
	}

	async closeStatsSheet() {
		await this.statsCloseButton.click();
	}

	confirmDeleteDialog = new ConfirmDeleteDialog(this.page);
}

export async function gotoTournamentDetail(
	page: Page,
	tournamentName: string,
): Promise<TournamentDetailPage> {
	const tournamentsPage = await import("./TournamentsPage");
	const tp = new tournamentsPage.TournamentsPage(page);
	await tp.goto();
	await tp.waitForPageLoad();

	const link = tp.tournamentLink(tournamentName);
	if (await link.isVisible().catch(() => false)) {
		await link.click();
		await page.waitForURL(/\/tournaments\//);
	} else {
		throw new Error(`Tournament "${tournamentName}" not found`);
	}

	return new TournamentDetailPage(page);
}