
import type {Page} from "@playwright/test";

export class ClerkLogin{
    constructor(private page: Page) {}

    get emailInput() {
        return this.page.getByRole('textbox', { name: 'Email address' });
    }

    get continueButton() {
        return this.page.getByRole('button', { name: 'Continue', exact:true });
    }

    get passwordInput() {
        return this.page.getByRole('textbox', { name: 'Password' });
    }

    signIn = async (email: string, password: string) => {
        await this.emailInput.fill(email);
        await this.continueButton.click();
        await this.passwordInput.fill(password);
        await this.continueButton.click();
    }


}