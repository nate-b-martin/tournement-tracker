---
name: qa-e2e-playwright
description: Playwright E2E test execution and authoring for TanStack Tournament Tracker - uses Playwright MCP browser tools for interactive testing and Playwright CLI for test runs, debugging, and reporting
metadata:
  audience: developers
  stack: playwright-clerk
---

## Purpose

Execute, debug, and author Playwright E2E tests using both the **Playwright MCP browser tools** (for interactive exploration and debugging) and the **Playwright CLI** (for full test runs and reporting).

## Available Tools

| Tool | When to use |
|------|-------------|
| **Playwright MCP browser tools** (`playwright_browser_*`) | Step through pages interactively, inspect elements, debug selectors, verify UI state during development |
| **Playwright CLI** (`npx playwright test`) | Run full test suites, CI, generate reports, catch regressions |

## Quick Reference

```bash
# Run all E2E tests
npm run test:e2e

# Run with visible browser
npm run test:e2e:headed

# Run with Playwright UI mode (timeline + selector picker)
npm run test:e2e:ui

# Run a single test file
npx playwright test tests/e2e/auth.spec.ts

# Run tests matching a name pattern
npx playwright test -g "sign in"            # tests with "sign in" in name
npx playwright test -g "^(Authenticated)"   # tests in "Authenticated" describe block

# Debug mode (step through with Playwright inspector)
npx playwright test --debug

# Generate last test results only
npx playwright test --last-failed
```

## Interactive Debugging Workflow

Use the Playwright MCP browser tools when you need to:

### 1. Explore Pages & Inspect Selectors
```typescript
// Navigate to a page
await page.goto("http://localhost:3000/teams");

// Check page structure with snapshot
// (use playwright_browser_snapshot tool)

// Get text content of elements
const heading = await page.textContent("h1");

// Check element visibility
await expect(page.getByRole("button", { name: /create team/i })).toBeVisible();
```

### 2. Trace Element Locations
Use the `playwright_browser_snapshot` tool with `boxes: true` to get element bounding boxes for verifying layout.

### 3. Check Console & Network
```typescript
// Monitor console for errors
page.on("console", msg => console.log(msg.text()));

// Wait for specific network response
await page.waitForResponse("**/api/**");
```

### 4. Verify Page State
```typescript
// Take screenshot for visual diff
await page.screenshot({ path: "debug-state.png" });

// Get URL after navigation
const url = page.url();
```

## Writing New Tests

### Test File Template

```typescript
import { test, expect } from "./fixtures/auth";
import { AuthPage } from "./pages/AuthPage";

test.describe("Teams Management", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("shows sign in button on teams page when unauthenticated", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto("/teams");
    await expect(authPage.signInButton).toBeVisible();
  });
});
```

### Page Object Template

```typescript
import type { Page, Locator } from "@playwright/test";

export class TeamsPage {
  constructor(private page: Page) {}

  get createTeamButton(): Locator {
    return this.page.getByRole("button", { name: /create team/i });
  }

  get teamNameInput(): Locator {
    return this.page.getByLabel(/team name/i);
  }

  get saveButton(): Locator {
    return this.page.getByRole("button", { name: /save/i });
  }

  async goto() {
    await this.page.goto("/teams");
  }

  async createTeam(name: string) {
    await this.createTeamButton.click();
    await this.teamNameInput.fill(name);
    await this.saveButton.click();
  }

  async teamRow(name: string): Promise<Locator> {
    return this.page.getByRole("row").filter({ hasText: name });
  }
}
```

### Test Pattern: Access Denied (from existing auth tests)

```typescript
test("redirects from /teams when signed out", async ({ page }) => {
  const protectedPage = new ProtectedPage(page);
  await protectedPage.goto();
  await protectedPage.waitForAccessDenied();
});
```

### Test Pattern: Role-Based UI Differences

```typescript
test("spectator cannot see create button", async ({ page }) => {
  const teamsPage = new TeamsPage(page);
  await teamsPage.goto();
  await expect(teamsPage.createTeamButton).not.toBeVisible();
});
```

### Test Pattern: CRUD Flow

```typescript
test("admin creates a new team", async ({ page }) => {
  const teamsPage = new TeamsPage(page);
  await teamsPage.goto();
  await teamsPage.createTeam("Test Team");
  const row = await teamsPage.teamRow("Test Team");
  await expect(row).toBeVisible();
});
```

## Debugging Flaky Tests

### Checklist
1. **Check selectors** — Are they specific enough? Prefer `getByRole`, `getByLabel`, `getByText` over CSS.
2. **Check waits** — Avoid `page.waitForTimeout()`. Use auto-waiting assertions like `toBeVisible()`.
3. **Check parallel conflicts** — Tests sharing auth state can clash. Each test should have isolated state.
4. **Check test isolation** — `test.use({ storageState: ... })` per block if auth state differs.
5. **Check retries** — `--retries 2` for CI. Use `trace: "on-first-retry"` to capture flaky failures.

### Using Trace Viewer
```bash
# After running tests, open the HTML report
npx playwright show-report
```
The trace viewer shows DOM snapshots, console logs, network requests, and timing for each action. Look for:
- Unexpected navigation or redirect
- Timing issues (action took too long)
- Missing elements (selector timed out)
- Console errors before the failure

## Test Organization

```
tests/e2e/
  auth.spec.ts                 # Authentication flow tests
  navigation.spec.ts           # Navigation/sidebar tests
  seasons.spec.ts              # Season list/CRUD tests
  schedule-autogeneration.spec.ts  # Schedule auto-generation tests
  teams/                       # (future) Team CRUD tests
  tournaments/                 # (future) Tournament management tests
  pages/                       # Page Object Models
    AuthPage.ts
    ProtectedPage.ts
    Navigation.ts
    ClerkLogin.ts
    SeasonsPage.ts             # Season list page (search, filter, create)
    SeasonDetailPage.ts         # Season detail page (tabs: Overview/Schedule/Standings)
    SetupWizardPage.ts         # First-run setup wizard
  fixtures/
    auth.ts                    # Re-exports test/expect from @playwright/test
  global-setup.ts              # Clerk auth setup + storage state persistence
```

## CLI Command Reference

| Command | Use case |
|---------|----------|
| `npx playwright test` | Run all tests |
| `npx playwright test --project=chromium` | Run a specific browser project |
| `npx playwright test --workers=1` | Run tests serially (avoid auth conflicts) |
| `npx playwright test --reporter=list` | Detailed test output per file |
| `npx playwright test --retries=3` | Retry failed tests up to 3 times |
| `npx playwright show-report` | Open HTML report after run |
| `npx playwright test --grep @smoke` | Run tests tagged with @smoke |

## Environment Verification

Before running tests, verify:
```bash
# Check env vars are set
echo $VITE_CLERK_PUBLISHABLE_KEY  # Should start with pk_test_
echo $CLERK_SECRET_KEY             # Should start with sk_test_
echo $CLERK_TEST_EMAIL             # Required by global-setup.ts (NOT CLERK_EMAIL)
echo $CLERK_TEST_PASSWORD          # Required by global-setup.ts

# Check auth state file exists (after global-setup)
ls -la playwright/.clerk/user.json

# Check dev server is running
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Should return 200
```

### Known Issues

- **Orphaned Vite dev server**: Playwright's `webServer` config runs `npm run dev` and can leave the Vite dev server running after tests complete, spiking CPU. Kill it with `pkill -f "vite"` if it gets orphaned.
- **Missing CLERK_TEST_EMAIL**: The global setup (`tests/e2e/global-setup.ts:40`) requires `CLERK_TEST_EMAIL` and `CLERK_TEST_PASSWORD` in `.env.local`. The existing env vars `CLERK_EMAIL` and `ADMIN_CLERK_EMAIL` are NOT used by the global setup — add a `CLERK_TEST_EMAIL` entry explicitly.

## Resilient Test Pattern (Missing Preconditions)

Use `test.skip()` for E2E tests that need seed data (existing seasons, teams, etc.):

```typescript
test("happy path: generate round-robin schedule", async ({ page }) => {
  const detailPage = new SeasonDetailPage(page);
  await page.goto("/seasonspage");
  await page.waitForLoadState("networkidle");

  // Find a season link to navigate to
  const seasonLink = page.getByRole("link").filter({ has: page.locator("text=") });
  const linkCount = await seasonLink.count().catch(() => 0);
  test.skip(linkCount === 0, "No seasons available for testing");

  await seasonLink.first().click();
  await page.waitForURL(/\/seasons\//);
  await detailPage.waitForScheduleTab();
  await detailPage.clickScheduleTab();
  await page.waitForTimeout(500);

  // Check if the action button is visible (admin-only or data-dependent)
  const btnVisible = await detailPage.generateScheduleButton
    .isVisible()
    .catch(() => false);
  if (!btnVisible) {
    test.skip(true, "Generate Schedule not visible — not admin or no teams");
  }

  // Now run the happy path...
  await detailPage.clickGenerateSchedule();
  await detailPage.waitForGenerateDialog();
  // ... continue with assertions
});
```

This avoids test failures from missing seed data by gracefully skipping when preconditions aren't met.

## Page Object: Tab Navigation Pattern

For pages with tab navigation (like Season Detail with Overview/Schedule/Standings):

```typescript
export class SeasonDetailPage {
  constructor(private page: Page) {}

  get scheduleTab() {
    return this.page.getByRole("tab", { name: /schedule/i });
  }
  get standingsTab() {
    return this.page.getByRole("tab", { name: /standings/i });
  }
  get overviewTab() {
    return this.page.getByRole("tab", { name: /overview/i });
  }

  async clickScheduleTab() {
    await this.scheduleTab.click();
  }

  async waitForScheduleTab() {
    await this.scheduleTab.waitFor({ state: "visible", timeout: 10000 });
  }
}
```

## Page Object: Dialog with Form Fields Pattern

For dialogs with forms (like Generate Schedule):

```typescript
export class SeasonDetailPage {
  // Dialog-level locators
  get dialogTitle() {
    return this.page.getByRole("heading", { name: /generate season schedule/i });
  }
  get generateButtonInDialog() {
    return this.page.getByRole("button", { name: /^generate schedule$/i });
  }
  get cancelButton() {
    return this.page.getByRole("button", { name: /cancel/i });
  }

  // Form field locators (use getByLabel for form inputs)
  get scheduleTypeSelect() {
    return this.page.getByLabel(/schedule type/i);
  }
  get weeksInput() {
    return this.page.getByLabel(/regular season weeks/i);
  }

  // Dropdown selection helper (combobox pattern)
  async selectScheduleType(type: string) {
    const typeSelect = this.page.getByRole("combobox", { name: /schedule type/i });
    await typeSelect.click();
    await this.page.getByRole("option", { name: new RegExp(type, "i") }).click();
  }

  // Dialog interaction methods
  async waitForGenerateDialog() {
    await this.dialogTitle.waitFor({ state: "visible", timeout: 10000 });
  }
  async submitGenerateSchedule() {
    await this.generateButtonInDialog.click();
  }
}
```

## Related Skills
- `qa-edge-case-analysis` — Use to generate test cases before writing E2E tests
- `qa-test-ticket-creation` — Convert scenarios into structured tickets
- `qa-test-to-playwright` — Convert Gherkin tickets into spec files + page objects
- `testing-patterns` — Unit test patterns for parallel coverage
- `ui-enhancements` — Test dark mode, responsive, and visual features
