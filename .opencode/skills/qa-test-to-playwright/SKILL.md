---
name: qa-test-to-playwright
description: Converts Gherkin-based test tickets into executable Playwright E2E tests by using the Playwright MCP browser to explore real pages, discover locators, and map user interactions to test code
metadata:
  audience: developers
  stack: playwright-gherkin-mcp
---

## Purpose

Bridge the gap between a **test ticket** (Gherkin scenarios + acceptance criteria) and a **working Playwright test**. This skill:

1. Parses the ticket's Gherkin scenarios into a step-by-step action plan
2. Uses the Playwright MCP browser tools to explore the actual pages and discover reliable locators
3. Generates the Playwright spec file and any needed page objects
4. Validates by running the test

## Workflow Overview

```
[Test Ticket] ──→ Step 1: Parse ──→ [Step Map]
                                     │
                    Step 2: Explore ←┘ (Playwright MCP browser)
                         │
                         ↓
                    [Element Map: Gherkin step → Playwright locator]
                         │
                    Step 3: Generate
                         │
                         ↓
                    [Playwright spec + Page Objects]
                         │
                    Step 4: Validate (CLI run)
```

## Step 1: Parse the Test Ticket

Extract these fields from the ticket:

| Field | Source | Example |
|-------|--------|---------|
| **Feature** | Ticket title or `Feature:` header | "Team Creation" |
| **Scenarios** | Each `Scenario:` block | "Create a team successfully" |
| **Roles** | `Given the user is signed in as [role]` | admin, spectator |
| **Route** | `When the user navigates to "[route]"` | /teams |
| **Actions** | `When` steps (clicks, types, submits) | click "Create Team" button |
| **Assertions** | `Then` steps (visibility, text, URL) | see "Team created" toast |
| **Auth state** | Based on roles in scenarios | authenticated vs not |

Produce a **Step Map** like this:

```markdown
## Step Map: [Feature Name]

### Scenario: [Scenario Name]
| Line | Source | Type | Detail |
|------|--------|------|--------|
| 1 | Given | Auth | signed in as admin |
| 2 | Given | Navigate | /teams |
| 3 | When  | Click | button "Create Team" |
| 4 | When  | Type  | "Alpha" into "Team Name" |
| 5 | When  | Click | button "Save" |
| 6 | Then  | Toast | "Team created successfully" |
| 7 | Then  | Assert| row "Alpha" visible in table |
```

## Step 2: Explore with Playwright MCP Browser

For each unique `When` and `Then` in your Step Map, use the Playwright MCP browser tools to find real locators.

### 2a: Navigate to the Page

```typescript
// Use the playwright_browser_navigate tool
// Target: http://localhost:3000/[route]
```

### 2b: Capture Page Snapshot

Use `playwright_browser_snapshot` with `boxes: true` to get element names, roles, and bounding boxes. This reveals what Playwright's accessibility tree sees — which maps directly to `getByRole` locators.

Example snapshot output for a "Create Team" button:
```
button "Create Team" [box=120,340,140,40]
  - name: "Create Team"
  - role: button
```

### 2c: Determine Locator Strategy

Map each Gherkin action to the most reliable Playwright locator. Prefer in this order:

| Priority | Strategy | Example |
|----------|----------|---------|
| 1 | `getByRole` + name | `page.getByRole("button", { name: /create team/i })` |
| 2 | `getByLabel` | `page.getByLabel(/team name/i)` |
| 3 | `getByText` | `page.getByText("No teams found")` |
| 4 | `getByPlaceholder` | `page.getByPlaceholder(/search/i)` |
| 5 | `getByTestId` (last resort) | `page.getByTestId("team-row")` |

### 2d: Interaction Matrices

This table maps each Gherkin step type to the Playwright MCP browser tool and assertion pattern:

| Gherkin Step | MCP Tool | Playwright Code Pattern |
|-------------|----------|-------------------------|
| `navigates to "[route]"` | `playwright_browser_navigate` | `page.goto("/route")` |
| `clicks the "[label]" [element]` | `playwright_browser_click` | `page.getByRole("button", { name: /label/i }).click()` |
| `types "[value]" into the "[label]" field` | `playwright_browser_type` + `playwright_browser_fill_form` | `page.getByLabel(/label/i).fill("value")` |
| `selects "[option]" from the "[label]" dropdown` | `playwright_browser_select_option` | `page.getByLabel(/label/i).selectOption("option")` |
| `confirms the dialog` | `playwright_browser_handle_dialog` | `page.on("dialog", d => d.accept())` |
| `should see [text]` | `playwright_browser_snapshot` | `expect(page.getByText("text")).toBeVisible()` |
| `should see [element] [visible|hidden]` | `playwright_browser_snapshot` | `expect(locator).toBeVisible()` / `toBeHidden()` |
| `URL should be "[path]"` | `playwright_browser_snapshot` | `expect(page).toHaveURL(/path/)` |
| `toast should appear with "[message]"` | `playwright_browser_snapshot` | `expect(page.getByText("message")).toBeVisible()` |
| `"[element]" should contain [N] items` | `playwright_browser_snapshot` | `expect(locator).toHaveCount(N)` |

### 2e: Record Element Aliases

For each discovered locator, note it for code generation:

```markdown
## Element Map
| Alias | Gherkin Name | Locator | Notes |
|-------|-------------|---------|-------|
| createTeamBtn | button "Create Team" | `getByRole("button", { name: /create team/i })` | Visible for admin, hidden for spectator |
| teamNameInput | field "Team Name" | `getByLabel(/team name/i)` | Also has placeholder |
| saveBtn | button "Save" | `getByRole("button", { name: /save/i })` | Inside form dialog |
| successToast | toast "Team created" | `getByText("Team created successfully")` | Sonner toast, auto-dismisses |
| teamRow | entity "Alpha" in list | `getByRole("row").filter({ hasText: "Alpha" })` | After team creation |
| emptyMessage | text "No teams found" | `getByText("No teams found")` | Visible when list empty |
```

## Step 3: Generate Playwright Test Code

### 3a: Determine Auth Fixture Setup

| Gherkin Role | Playwright Setup |
|-------------|------------------|
| `not signed in` | `test.use({ storageState: { cookies: [], origins: [] } })` |
| `signed in as [role]` | No change needed (default auth from global setup) |
| Multiple roles in one file | Isolate with `test.describe` blocks, each with its own `test.use` |

### 3b: Determine File Locations

| Test type | Location | Convention |
|-----------|----------|------------|
| New feature spec | `tests/e2e/<feature>.spec.ts` | `auth.spec.ts`, `teams.spec.ts` |
| Add to existing spec | `tests/e2e/<feature>.spec.ts` | Append new `test.describe` block |
| New page object | `tests/e2e/pages/<Name>Page.ts` | `TeamsPage.ts`, `TournamentPage.ts` |

### 3c: Generate Page Object (if needed)

Use the Element Map to generate a page object class:

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

  get successToast(): Locator {
    return this.page.getByText("Team created successfully");
  }

  get emptyStateMessage(): Locator {
    return this.page.getByText("No teams found");
  }

  teamRow(name: string): Locator {
    return this.page.getByRole("row").filter({ hasText: name });
  }

  async goto() {
    await this.page.goto("/teams");
  }

  async createTeam(name: string) {
    await this.createTeamButton.click();
    await this.teamNameInput.fill(name);
    await this.saveButton.click();
  }
}
```

### 3d: Generate Spec File

Use the Step Map to produce the spec. Each Gherkin scenario maps to a `test(...)` block. Map Gherkin steps like this:

| Gherkin Step | Playwright Code |
|-------------|-----------------|
| `Given the user is [role]` | `test.use({ storageState: ... })` or default |
| `Given the user is on the [page] page` | `await pageObject.goto()` |
| `Given [N] [entity] exist(s)` | Test seed data or Convex setup — comment as precondition |
| `Given the [entity] list is empty` | Comment: "ensure empty state" |
| `When the user clicks the "[label]" [element]` | `await pageObject.element.click()` or `await page.getByRole(...).click()` |
| `When the user types "[value]" into the "[label]" field` | `await pageObject.input.fill("value")` |
| `Then the user should see [text]` | `await expect(page.getByText("text")).toBeVisible()` |
| `Then the "[element]" should contain [N] items` | `await expect(locator).toHaveCount(N)` |

Full generated spec example:

```typescript
import { test, expect } from "./fixtures/auth";
import { TeamsPage } from "./pages/TeamsPage";

test.describe("Team Creation", () => {
  test("creates a team successfully", async ({ page }) => {
    const teamsPage = new TeamsPage(page);
    await teamsPage.goto();
    await teamsPage.createTeam("Alpha Squadron");
    await expect(teamsPage.successToast).toBeVisible();
    await expect(teamsPage.teamRow("Alpha Squadron")).toBeVisible();
  });

  test("shows validation error for empty name", async ({ page }) => {
    const teamsPage = new TeamsPage(page);
    await teamsPage.goto();
    await teamsPage.createTeamButton.click();
    await teamsPage.saveButton.click();
    await expect(page.getByText("Name is required")).toBeVisible();
  });
});

test.describe("Team Creation - Permission", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("redirects unauthenticated user from /teams", async ({ page }) => {
    const teamsPage = new TeamsPage(page);
    await teamsPage.goto();
    await expect(page.getByText(/authentication required/i)).toBeVisible();
  });
});
```

### Resilient Skip Pattern for Seed Data Dependencies

When a Gherkin scenario depends on seed data (existing seasons, teams, etc.), use `test.skip()` to handle missing preconditions gracefully:

```typescript
test("generates schedule for existing season", async ({ page }) => {
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

  // Check admin-only action button
  const btnVisible = await detailPage.generateScheduleButton
    .isVisible()
    .catch(() => false);
  if (!btnVisible) {
    test.skip(true, "Generate Schedule not visible — not admin or no teams");
  }

  // Happy path: fill dialog, submit, verify toast
  await detailPage.clickGenerateSchedule();
  await detailPage.waitForGenerateDialog();
  await detailPage.selectScheduleType("Double Round-Robin");
  await detailPage.fillWeeks("8");
  await detailPage.submitGenerateSchedule();
  await expect(page.getByText(/schedule generated/i)).toBeVisible({ timeout: 10000 });
});
```

Key patterns:
- `await locator.count().catch(() => 0)` — safe count check
- `await locator.isVisible().catch(() => false)` — safe visibility check
- `test.skip(condition, reason)` — skip instead of fail when data isn't available

### 3e: Default Test Code Templates

**Basic page visit + assertion:**
```typescript
import { test, expect } from "./fixtures/auth";
import { TeamsPage } from "./pages/TeamsPage";

test.describe("[Feature]", () => {
  test("[scenario description]", async ({ page }) => {
    const featurePage = new TeamsPage(page);
    await featurePage.goto();
    await expect(featurePage.someElement).toBeVisible();
  });
});
```

**Authenticated CRUD flow:**
```typescript
import { test, expect } from "./fixtures/auth";
import { TeamsPage } from "./pages/TeamsPage";

test.describe("[Feature] CRUD", () => {
  test("[scenario description]", async ({ page }) => {
    const featurePage = new TeamsPage(page);
    await featurePage.goto();
    await featurePage.createTeam("Test Name");
    await expect(featurePage.successToast).toBeVisible();
    const row = featurePage.teamRow("Test Name");
    await expect(row).toBeVisible();
  });
});
```

**Role-based visibility:**
```typescript
import { test, expect } from "./fixtures/auth";
import { TeamsPage } from "./pages/TeamsPage";

test.describe("[Feature] - Admin", () => {
  test("admin sees create button", async ({ page }) => {
    const featurePage = new TeamsPage(page);
    await featurePage.goto();
    await expect(featurePage.createTeamButton).toBeVisible();
  });
});

test.describe("[Feature] - Unauthenticated", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("redirects when not signed in", async ({ page }) => {
    const featurePage = new TeamsPage(page);
    await featurePage.goto();
    await expect(page.getByText(/authentication required/i)).toBeVisible();
  });
});
```

**Empty state:**
```typescript
import { test, expect } from "./fixtures/auth";
import { TeamsPage } from "./pages/TeamsPage";

test.describe("[Feature] Empty State", () => {
  test("shows empty message when no data", async ({ page }) => {
    const featurePage = new TeamsPage(page);
    await featurePage.goto();
    // Assumes database has no teams for this test user
    await expect(featurePage.emptyStateMessage).toBeVisible();
    await expect(featurePage.createTeamButton).toBeVisible();
  });
});
```

## Step 4: Validate

### 4a: Check Formatting
```bash
npm run check
```

### 4b: Run the Generated Test
```bash
# Run just the new test file
npx playwright test tests/e2e/<feature>.spec.ts

# Or run with visible browser for debugging
npx playwright test tests/e2e/<feature>.spec.ts --headed

# Or filter to just the new test
npx playwright test tests/e2e/<feature>.spec.ts -g "<scenario name>"
```

### 4c: Debug Failures
If the test fails:
1. Run with `--debug` to step through: `npx playwright test --debug tests/e2e/<feature>.spec.ts`
2. Use MCP browser snapshot on the failing page to re-check locators
3. Check that the locator strategy matches the actual DOM (use `getByRole` with correct name pattern)
4. Verify auth state: are you authenticated when you expect to be?
5. Check that test data preconditions are met (empty database, seeded data, etc.)

## Complete Walkthrough Example

### Input Ticket
```gherkin
Feature: Team Creation
  As an admin
  I want to create new teams
  So that they can participate in tournaments

  Background:
    Given the user is signed in as "admin"
    Given the user is on the teams page

  Scenario: Create a team successfully
    When the user clicks the "Create Team" button
    And the user types "Alpha Squadron" into the "Team Name" field
    And the user clicks the "Save" button
    Then a toast should appear with "Team created successfully"
    And the teams list should contain "Alpha Squadron"
```

### Step Map
| Line | Type | Detail |
|------|------|--------|
| B1 | Auth | authenticated as admin |
| B2 | Navigate | /teams |
| 1 | Click | button "Create Team" |
| 2 | Type | "Alpha Squadron" into "Team Name" |
| 3 | Click | button "Save" |
| 4 | Toast | "Team created successfully" |
| 5 | Assert | row "Alpha Squadron" visible |

### MCP Browser Exploration Output
```
Navigating to http://localhost:3000/teams
→ Snapshot shows:
  - heading "Teams" [box=100,50,200,30]
  - button "Create Team" [box=300,50,120,36]
  - table "Teams list" [box=100,100,800,400]
  - within table: rows with columns: Name, Status

Clicking "Create Team" button
→ Modal opens with:
  - textbox "Team Name" [box=200,200,400,36]
  - button "Cancel" [box=200,250,100,36]
  - button "Save" [box=310,250,100,36]

Filling "Team Name" with "Alpha Squadron"
→ textbox now has value "Alpha Squadron"

Clicking "Save" button
→ Toast appears: "Team created successfully" [box=400,20,300,40]
→ Modal closes
→ Table now shows row: "Alpha Squadron"
```

### Generated Output

**`tests/e2e/pages/TeamsPage.ts`:**
```typescript
import type { Page, Locator } from "@playwright/test";

export class TeamsPage {
  constructor(private page: Page) {}

  get createTeamButton(): Locator {
    return this.page.getByRole("button", { name: /create team/i });
  }

  get teamNameInput(): Locator {
    return this.page.getByRole("textbox", { name: /team name/i });
  }

  get saveButton(): Locator {
    return this.page.getByRole("button", { name: /save/i });
  }

  get successToast(): Locator {
    return this.page.getByText("Team created successfully");
  }

  teamRow(name: string): Locator {
    return this.page.getByRole("row").filter({ hasText: name });
  }

  async goto() {
    await this.page.goto("/teams");
  }

  async createTeam(name: string) {
    await this.createTeamButton.click();
    await this.teamNameInput.fill(name);
    await this.saveButton.click();
  }
}
```

**`tests/e2e/teams.spec.ts`:**
```typescript
import { test, expect } from "./fixtures/auth";
import { TeamsPage } from "./pages/TeamsPage";

test.describe("Team Creation", () => {
  test("creates a team successfully", async ({ page }) => {
    const teamsPage = new TeamsPage(page);
    await teamsPage.goto();
    await teamsPage.createTeam("Alpha Squadron");
    await expect(teamsPage.successToast).toBeVisible();
    await expect(teamsPage.teamRow("Alpha Squadron")).toBeVisible();
  });
});
```

## Existing Page Objects Reference

Use these existing locator patterns from the project to stay consistent:

| Page Object | File | Key Locators |
|-------------|------|-------------|
| `AuthPage` | `tests/e2e/pages/AuthPage.ts` | `signInButton` (`getByRole("button", { name: /sign in/i })`), `userButton` (`getByRole("button", { name: /open user menu/i })`) |
| `Navigation` | `tests/e2e/pages/Navigation.ts` | Menu open/close, sign-in button visibility |
| `ProtectedPage` | `tests/e2e/pages/ProtectedPage.ts` | Access denied title, wait methods |
| `ClerkLogin` | `tests/e2e/pages/ClerkLogin.ts` | Clerk-specific login flow |
| `SeasonsPage` | `tests/e2e/pages/SeasonsPage.ts` | `heading`, `createSeasonButton`, `table`, `searchInput`, `statusFilterChips`, `clearFiltersButton` |
| `SeasonDetailPage` | `tests/e2e/pages/SeasonDetailPage.ts` | Tabs (Overview/Schedule/Standings), Generate Schedule dialog, bracket generation |
| `SetupWizardPage` | `tests/e2e/pages/SetupWizardPage.ts` | First-run setup wizard elements |

## Related Skills
- `qa-test-ticket-creation` — Source skill that produces the Gherkin tickets consumed here
- `qa-e2e-playwright` — Skill for running and debugging the generated tests
- `qa-edge-case-analysis` — Skill for identifying the edge cases tested here
- `testing-patterns` — Unit test patterns for parallel Vitest coverage
