import type { Page } from "@playwright/test";

export class ProtectedPage {
  readonly path = "/dashboard";

  constructor(private page: Page) {}

  get loader() {
    return this.page.locator(".animate-spin");
  }

  get accessDeniedTitle() {
    return this.page.getByRole("heading", { name: /authentication required|admin access required/i });
  }

  get signInPrompt() {
    return this.page.getByText(/please sign in to access/i);
  }

  async goto() {
    await this.page.goto(this.path);
  }

  async waitForLoader() {
    await this.loader.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    await this.loader.first().waitFor({ state: "hidden", timeout: 10000 });
  }

  async waitForAccessDenied() {
    await this.waitForLoader();
    await this.accessDeniedTitle.first().waitFor({ timeout: 5000 });
  }
}
