import type { Page } from "@playwright/test";
import { TabbedDetailPage } from "./TabbedDetailPage";

export class SeasonDetailPage extends TabbedDetailPage {
	constructor(page: Page) {
		super(page, {
			backPattern: /back to seasons/i,
			tabs: ["Overview", "Schedule", "Standings"],
		});
	}

	get generateScheduleButton() {
		return this.page.getByRole("button", { name: /generate schedule/i });
	}

	get scheduleTypeSelect() {
		return this.page.getByLabel(/schedule type/i);
	}

	get weeksInput() {
		return this.page.getByLabel(/regular season weeks/i);
	}

	get gamesPerWeekInput() {
		return this.page.getByLabel(/games per week/i);
	}

	get generateButtonInDialog() {
		return this.page.getByRole("button", { name: /^generate schedule$/i });
	}

	get cancelButton() {
		return this.page.getByRole("button", { name: /cancel/i });
	}

	get dialogTitle() {
		return this.page.getByRole("heading", {
			name: /generate season schedule/i,
		});
	}

	get bracketButton() {
		return this.page.getByRole("button", {
			name: /generate tournament bracket/i,
		});
	}

	gameDayCheckbox(day: string) {
		return this.page.getByLabel(day);
	}

	get summaryBox() {
		return this.page.getByText(/summary/i);
	}

	get scheduleTable() {
		return this.page.getByRole("table");
	}

	get scheduleStatusInfo() {
		return this.page.getByText(/schedule:.*weeks/i);
	}

	async gotoSeason(id: string) {
		await this.page.goto(`/seasons/${id}`);
	}

	async clickScheduleTab() {
		await this.clickTab("schedule");
	}

	async clickStandingsTab() {
		await this.clickTab("standings");
	}

	async clickGenerateSchedule() {
		await this.generateScheduleButton.click();
	}

	async clickGenerateBracket() {
		await this.bracketButton.click();
	}

	async fillWeeks(weeks: string) {
		await this.weeksInput.fill(weeks);
	}

	async fillGamesPerWeek(count: string) {
		await this.gamesPerWeekInput.fill(count);
	}

	async selectGameDay(day: string) {
		await this.gameDayCheckbox(day).click();
	}

	async submitGenerateSchedule() {
		await this.generateButtonInDialog.click();
	}

	async waitForGenerateDialog() {
		await this.dialogTitle.waitFor({ state: "visible", timeout: 10000 });
	}

	async waitForScheduleTab() {
		await this.waitForTab("schedule");
	}
}