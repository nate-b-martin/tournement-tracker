import type { Page } from "@playwright/test";
import { CrudTablePage } from "./TablePage";

export class TeamsPage extends CrudTablePage {
	constructor(page: Page) {
		super(page, {
			route: "/teamspage",
			headingPattern: /teams/i,
			searchPlaceholder: /search teams, coach/i,
			itemName: "teams",
		});
	}

	get addTeamButton() {
		return this.page.getByRole("button", { name: /add team/i });
	}

	get createDialogTitle() {
		return this.page.getByRole("heading", { name: /add team/i });
	}

	get nameInput() {
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

	get tournamentSelect() {
		return this.page.getByLabel(/tournament/i);
	}

	get submitCreateButton() {
		return this.page.getByRole("button", { name: /^create team$/i });
	}

	get successToast() {
		return this.page.getByText(/team (created|updated) successfully/i);
	}
}