---
name: qa-playwright-workflow-explorer
description: Explores user workflows using Playwright MCP browser tools and Playwright CLI. Takes Gherkin scenarios or feature-ticket context, navigates through the actual app to discover elements, verifies the flow works, creates tests, and generates debug tickets on failure.
metadata:
  audience: developers
  stack: playwright-gherkin-mcp
---

## Purpose

Bridge the gap between **user-facing Gherkin scenarios** (or feature-ticket descriptions) and **validated, running Playwright tests**. This skill:

1. **Parses** Gherkin scenarios or feature-ticket context into an action plan
2. **Explores** the actual application using Playwright MCP browser tools to discover real locators
3. **Verifies** the flow works by running through it with Playwright CLI
4. **Generates** Playwright spec files and page objects following project standards
5. **On failure**, creates a debug ticket in `feature-tickets/debug/` for later triage

## Workflow Overview

```
[Gherkin Scenario / Feature Ticket]
         │
         ▼
Step 1: Parse ──→ [Action Plan: step-by-step actions + assertions]
         │
         ▼
Step 2: Explore (Playwright MCP browser tools)
   - Navigate pages
   - Discover locators via snapshot
   - Verify elements exist
         │
         ▼
Step 3: Verify (Playwright CLI)
   - Run `npx playwright test --headed` for the flow
   - Assertions must pass
         │
     ┌───┴───┐
     ▼       ▼
  PASS      FAIL
     │       │
     ▼       ▼
Step 4a:     Step 4b:
Generate     Create Debug Ticket
Test Code    in feature-tickets/debug/
     │
     ▼
Step 5: Validate
   - npm run check
   - npx playwright test
```

## Step 1: Parse Input

### Input Type A — Gherkin Scenario

```gherkin
Given user is admin
When the user is on a season details page
Then user can view the schedule
```

Parse this into an **Action Plan**:

| Step | Gherkin | Type | Detail |
|------|---------|------|--------|
| 1 | Given | Role | admin |
| 2 | Given | Navigate | season details page → /seasons/{id} |
| 3 | Then | Assert | schedule section is visible |

### Input Type B — Feature Ticket Reference

If given a feature ticket path (e.g., `feature-tickets/complete/19-season-detail-page.md`):

1. Read the ticket file
2. Extract any existing Gherkin scenarios from it
3. If no Gherkin exists, read the Acceptance Criteria and Implementation Steps to derive implicit scenarios
4. Build an Action Plan from those

### Action Plan Format

```markdown
## Action Plan: [Feature / Scenario Name]

### Auth State
- [ ] Unauthenticated
- [ ] Authenticated as admin
- [ ] Authenticated as spectator
- [ ] Authenticated as organizer
- [ ] Authenticated as player

### Navigation Chain
1. Start at: [route]
2. Navigate to: [route] via [click / direct URL]
3. Expected URL after: [route]

### Element Interactions
| # | Type | Element Description | Expected State |
|---|------|-------------------|----------------|
| 1 | Click | button "Create Team" | Modal opens |
| 2 | Type | field "Team Name" → "My Team" | Value filled |
| 3 | Assert | toast "Team created" | Visible |

### Assertions
- [ ] Element X is visible
- [ ] Element Y contains text "Z"
- [ ] URL is "/expected/path"
- [ ] Element count is N
```

## Step 2: Explore with Playwright MCP Browser

For each unique element and assertion in your Action Plan, use Playwright MCP browser tools to discover real locators.

### 2a: Resolve Route

Map Gherkin page descriptions to actual routes by checking the codebase:

```bash
# Find route components
grep -r "route\|path" src/routes/ --include="*.tsx" -l
```

| Gherkin Page Description | Likely Route |
|--------------------------|-------------|
| season details page | /seasons/{id} or /seasonspage/{id} |
| teams page | /teams |
| tournament page | /tournaments or /tournamentspage |
| dashboard | /dashboard or / |

### 2b: Navigate and Capture Snapshot

```typescript
// Navigate to the page
// Use playwright_browser_navigate tool
// Target: http://localhost:3000/[resolved-route]

// Capture snapshot to discover elements
// Use playwright_browser_snapshot with boxes: true
```

### 2c: Build Element Map

Map each Gherkin step to a Playwright locator, following project conventions:

| Gherkin | Playwright Locator | Priority |
|---------|-------------------|----------|
| button "Create Team" | `page.getByRole("button", { name: /create team/i })` | 1 |
| field "Team Name" | `page.getByLabel(/team name/i)` | 2 |
| text "No teams found" | `page.getByText("No teams found")` | 3 |
| link "Seasons" | `page.getByRole("link", { name: /seasons/i })` | 1 |
| heading "Schedule" | `page.getByRole("heading", { name: /schedule/i })` | 1 |

Document the element map:

```markdown
## Element Map
| Alias | Gherkin Name | Locator | Notes |
|-------|-------------|---------|-------|
| seasonDetailsLink | link "Season 1" | `getByRole("link", { name: /season 1/i })` | Navigates to season detail |
| scheduleHeading | heading "Schedule" | `getByRole("heading", { name: /schedule/i })` | On season detail page |
| scheduleTable | table "Schedule" | `getByRole("table", { name: /schedule/i })` | Shows scheduled games |
| emptySchedule | text "No games scheduled" | `getByText("No games scheduled")` | Visible when no games |
```

### 2d: MCP Browser Tool Reference

| Action | MCP Tool | Notes |
|--------|----------|-------|
| Navigate to page | `playwright_browser_navigate` | Use full URL: `http://localhost:3000/route` |
| Click element | `playwright_browser_click` | Pass `target` from snapshot |
| Type into field | `playwright_browser_type` or `playwright_browser_fill_form` | Prefer fill_form for multiple fields |
| Select dropdown | `playwright_browser_select_option` | Pass `values` array |
| Read page state | `playwright_browser_snapshot` | With `boxes: true` for bounding boxes |
| Check console | `playwright_browser_console_messages` | Pass `level: "error"` for errors |
| Check network | `playwright_browser_network_requests` | Pass `filter: "/api/"` for relevant requests |
| Wait for text | `playwright_browser_wait_for` | Use `text` or `textGone` |
| Handle dialog | `playwright_browser_handle_dialog` | Pass `accept: true/false` |
| Drag element | `playwright_browser_drag` | Requires start/end targets |
| Screenshot | `playwright_browser_take_screenshot` | For visual verification |
| Evaluate JS | `playwright_browser_evaluate` | For complex state checks |
| Resize window | `playwright_browser_resize` | For responsive testing |
| Press key | `playwright_browser_press_key` | For keyboard interactions |

## Step 3: Verify with Playwright CLI

Before generating final test code, verify the flow works end-to-end using Playwright CLI.

### 3a: Write a Quick Verification Script

Create a minimal inline test to validate the flow:

```typescript
// tests/e2e/verify-[feature].spec.ts (TEMPORARY — delete after verification)
import { test, expect } from "./fixtures/auth";
import { AuthPage } from "./pages/AuthPage";

test.describe("Verify: [Feature Name]", () => {
  test("verifies the workflow works", async ({ page }) => {
    // Step through the action plan
    await page.goto("/seasons");
    await page.getByRole("link", { name: /season 1/i }).click();
    await expect(page).toHaveURL(/\/seasons\//);
    await expect(
      page.getByRole("heading", { name: /schedule/i })
    ).toBeVisible();
  });
});
```

### 3b: Run the Verification

```bash
# Run with headed browser to watch the flow
npx playwright test tests/e2e/verify-[feature].spec.ts --headed

# Or run headless
npx playwright test tests/e2e/verify-[feature].spec.ts
```

### 3c: Interpret Results

| Result | Action |
|--------|--------|
| ✅ All assertions pass | Proceed to Step 4a (Generate Test Code) |
| ❌ Test fails | Proceed to Step 4b (Create Debug Ticket) |
| ⚠️ Test hangs/times out | Check dev server, auth state, or add `--debug` to investigate |

### 3d: Clean Up

Delete the verification file after the flow is confirmed:

```bash
rm tests/e2e/verify-[feature].spec.ts
```

## Step 4a: Generate Test Code (on PASS)

### Determine Auth Fixture

| Scenario Role | Playwright Setup |
|---------------|------------------|
| `not signed in` / `unauthenticated` | `test.use({ storageState: { cookies: [], origins: [] } })` |
| `signed in as admin` | Use default fixture (authenticated as admin) |
| `signed in as spectator` | Requires custom storage state or fixture |
| `signed in as organizer` | Requires custom storage state or fixture |

### Determine File Locations

| Type | Location | Convention |
|------|----------|------------|
| New feature spec | `tests/e2e/<feature>.spec.ts` | `seasons.spec.ts`, `schedule.spec.ts` |
| Add to existing spec | `tests/e2e/<feature>.spec.ts` | Append new `test.describe` block |
| New page object | `tests/e2e/pages/<Name>Page.ts` | `SeasonDetailPage.ts` |
| New auth fixture | `tests/e2e/fixtures/auth.ts` | Add new role-based fixtures |

### Generate Page Object

From the Element Map, generate a page object following existing patterns (see `tests/e2e/pages/AuthPage.ts` for reference):

```typescript
import type { Page, Locator } from "@playwright/test";

export class SeasonDetailPage {
  constructor(private page: Page) {}

  // Element locators (from Element Map)
  get scheduleHeading(): Locator {
    return this.page.getByRole("heading", { name: /schedule/i });
  }

  get scheduleTable(): Locator {
    return this.page.getByRole("table", { name: /schedule/i });
  }

  get emptyScheduleMessage(): Locator {
    return this.page.getByText("No games scheduled");
  }

  // Navigation
  async goto(seasonId: string) {
    await this.page.goto(`/seasons/${seasonId}`);
  }

  // Wait for page to load
  async waitForPageLoad() {
    await expect(this.scheduleHeading).toBeVisible({ timeout: 10000 });
  }
}
```

### Generate Spec File

Map each Action Plan item to Playwright code:

| Action Plan Item | Playwright Code |
|-----------------|-----------------|
| Role: admin | `test.describe("Feature Name - Admin", ...)` with default fixture |
| Role: unauthenticated | `test.use({ storageState: { cookies: [], origins: [] } })` |
| Navigate to "/route" | `await pageObject.goto()` |
| Click button "X" | `await pageObject.element.click()` |
| Type "Y" into "Z" | `await pageObject.input.fill("Y")` |
| Assert element visible | `await expect(pageObject.element).toBeVisible()` |
| Assert URL contains | `await expect(page).toHaveURL(/pattern/)` |
| Assert toast appears | `await expect(page.getByText("message")).toBeVisible()` |
| Assert text present | `await expect(page.getByText("text")).toBeVisible()` |

```typescript
import { test, expect } from "./fixtures/auth";
import { SeasonDetailPage } from "./pages/SeasonDetailPage";

test.describe("Season Details - Admin", () => {
  test("admin can view the schedule on season details page", async ({ page }) => {
    const seasonDetailPage = new SeasonDetailPage(page);
    await seasonDetailPage.goto("test-season-id");
    await seasonDetailPage.waitForPageLoad();
    await expect(seasonDetailPage.scheduleHeading).toBeVisible();
    // Schedule table or empty state should be visible
    if (await seasonDetailPage.scheduleTable.isVisible()) {
      await expect(seasonDetailPage.scheduleTable).toBeVisible();
    } else {
      await expect(seasonDetailPage.emptyScheduleMessage).toBeVisible();
    }
  });
});

test.describe("Season Details - Authenticated", () => {
  test("schedule section loads without errors", async ({ page }) => {
    const seasonDetailPage = new SeasonDetailPage(page);
    await seasonDetailPage.goto("test-season-id");
    await seasonDetailPage.waitForPageLoad();
    // Verify no error toasts or error states
    await expect(page.getByText(/error/i)).not.toBeVisible();
  });
});
```

### Default Test Templates

**Simple page visit + element visible:**
```typescript
import { test, expect } from "./fixtures/auth";
import { SeasonDetailPage } from "./pages/SeasonDetailPage";

test.describe("Season Details", () => {
  test("schedule section is visible", async ({ page }) => {
    const pageObject = new SeasonDetailPage(page);
    await pageObject.goto("some-id");
    await expect(pageObject.scheduleHeading).toBeVisible();
  });
});
```

**Unauthenticated access check:**
```typescript
import { test, expect } from "./fixtures/auth";
import { SeasonDetailPage } from "./pages/SeasonDetailPage";

test.describe("Season Details - Unauthenticated", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("redirects unauthenticated user", async ({ page }) => {
    const protectedPage = new (await import("./pages/ProtectedPage")).ProtectedPage(page);
    await protectedPage.goto();
    await protectedPage.waitForAccessDenied();
  });
});
```

## Step 4b: Create Debug Ticket (on FAILURE)

### Debug Ticket Directory

```
feature-tickets/debug/<timestamp>-<feature-name>-<issue-description>.md
```

Example: `feature-tickets/debug/2026-07-20-season-schedule-not-found.md`

### Debug Ticket Template

```markdown
---
created: 2026-07-20
source: qa-playwright-workflow-explorer
sourceTicket: [optional reference to feature ticket]
priority: P1
status: open
---

# Debug: [Feature] — [Issue Description]

## Scenario Attempted

```gherkin
[The original Gherkin scenario]
```

## Action Plan

[The action plan that was generated]

## Failure Evidence

### Test Output

```
[paste the failure output from playwright CLI]
```

### Console Errors

```
[paste any console errors found in the browser]
```

### Network Errors

```
[paste any network request failures]
```

### Page Snapshot at Failure

[Include the playwright_browser_snapshot output or note the file path]

## Investigation Notes

### What Works
- [ ] Step 1: [detail]
- [ ] Step 2: [detail]

### What Fails
- [ ] Step N: [detail of failing step]
- [ ] Expected: [what should happen]
- [ ] Actual: [what actually happens]

## Suspected Root Causes

- [ ] **Route mismatch**: Expected route doesn't exist or has changed
- [ ] **Auth issue**: Different auth state than expected
- [ ] **Missing element**: Component not rendered or renamed
- [ ] **Data dependency**: Page requires seeded data that doesn't exist
- [ ] **Timing**: Element not ready when Playwright tries to interact
- [ ] **Selector**: Locator strategy doesn't match actual DOM
- [ ] **Role/permission**: User role doesn't have access to this feature
- [ ] **Bug**: Actual application bug exposed by the test

## Next Steps

1. [ ] Fix the root cause
2. [ ] Re-run verification with Playwright CLI
3. [ ] Generate the test once verification passes
```

### Creating the Debug Ticket

```bash
mkdir -p feature-tickets/debug
```

Write the debug ticket with all gathered evidence:

1. Capture test output from the failed `npx playwright test` run
2. Capture browser console messages with `playwright_browser_console_messages`
3. Capture network requests at time of failure with `playwright_browser_network_requests`
4. Capture page snapshot at failure point with `playwright_browser_snapshot`
5. Note the suspected root cause category
6. Set appropriate priority:
   - **P0**: Core flow completely broken, affects multiple features
   - **P1**: Feature flow broken, blocks test creation
   - **P2**: Edge case failure, workaround possible
   - **P3**: Minor issue, cosmetic or rare

## Step 5: Validate Generated Tests

### Format Check
```bash
npm run check
```

### Run the New Tests
```bash
# Run just the new test file
npx playwright test tests/e2e/<feature>.spec.ts

# Run with visible browser to watch
npx playwright test tests/e2e/<feature>.spec.ts --headed

# Run matching specific test name
npx playwright test tests/e2e/<feature>.spec.ts -g "<test description>"
```

### Full Validation
```bash
npm run check
npx playwright test tests/e2e/<feature>.spec.ts
```

## Complete Working Example

### Input
```gherkin
Given user is admin
When the user is on a season details page
Then user can view the schedule
```

### Step 1: Parse → Action Plan

| # | Type | Detail |
|---|------|--------|
| 1 | Role | admin |
| 2 | Navigate | /seasons/{id} |
| 3 | Assert | heading "Schedule" visible |
| 4 | Assert | schedule table or "No games scheduled" visible |

### Step 2: Explore with MCP Browser

```typescript
// playwright_browser_navigate: http://localhost:3000/seasons
// → Snapshot shows:
//   - link "Spring 2026" [box=100,200,200,40]
//   - link "Fall 2025" [box=100,250,200,40]

// playwright_browser_click: link "Spring 2026"
// → Navigated to /seasons/abc123

// playwright_browser_snapshot with boxes: true
// → Snapshot shows:
//   - heading "Season: Spring 2026" [box=100,50,400,40]
//   - heading "Schedule" [box=100,100,200,30]
//   - table "Schedule" [box=100,150,800,400]
//     - rows: Game, Date, Team A, Team B, Status
```

### Element Map

| Alias | Gherkin Name | Locator |
|-------|-------------|---------|
| seasonLink | link "Spring 2026" | `getByRole("link", { name: /spring 2026/i })` |
| scheduleHeading | heading "Schedule" | `getByRole("heading", { name: /schedule/i })` |
| scheduleTable | table "Schedule" | `getByRole("table", { name: /schedule/i })` |

### Step 3: Verify with CLI

```bash
npx playwright test tests/e2e/verify-season-schedule.spec.ts --headed
# ✅ PASS: All assertions passed
```

### Step 4a: Generate Test

**`tests/e2e/pages/SeasonDetailPage.ts`:**
```typescript
import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class SeasonDetailPage {
  constructor(private page: Page) {}

  get scheduleHeading(): Locator {
    return this.page.getByRole("heading", { name: /schedule/i });
  }

  get scheduleTable(): Locator {
    return this.page.getByRole("table", { name: /schedule/i });
  }

  get emptyScheduleMessage(): Locator {
    return this.page.getByText(/no games scheduled/i);
  }

  async goto(seasonId: string) {
    await this.page.goto(`/seasons/${seasonId}`);
  }

  async waitForPageLoad() {
    await expect(this.page.getByRole("heading", { name: /season:/i })).toBeVisible({ timeout: 10000 });
  }

  async isScheduleVisible(): Promise<boolean> {
    if (await this.scheduleTable.isVisible()) {
      return true;
    }
    return await this.emptyScheduleMessage.isVisible();
  }

  async getScheduleRowCount(): Promise<number> {
    if (await this.scheduleTable.isVisible()) {
      const rows = this.scheduleTable.locator("tbody tr");
      return await rows.count();
    }
    return 0;
  }
}
```

**`tests/e2e/seasons.spec.ts`:**
```typescript
import { test, expect } from "./fixtures/auth";
import { SeasonDetailPage } from "./pages/SeasonDetailPage";

test.describe("Season Details", () => {
  test("admin can view the schedule on season details page", async ({ page }) => {
    // Navigate to seasons list first, then pick first season
    await page.goto("/seasons");
    const seasonLink = page.getByRole("link", { name: /spring 2026/i });
    await expect(seasonLink).toBeVisible();

    // Click into season details
    await seasonLink.click();
    await expect(page).toHaveURL(/\/seasons\//);

    // Verify schedule section
    const seasonDetailPage = new SeasonDetailPage(page);
    await seasonDetailPage.waitForPageLoad();
    await expect(seasonDetailPage.scheduleHeading).toBeVisible();
    expect(await seasonDetailPage.isScheduleVisible()).toBe(true);
  });
});
```

### Step 5: Validate
```bash
# Run format check
npm run check

# Run the test
npx playwright test tests/e2e/seasons.spec.ts
```

## Failure Example (for reference)

### Input That Fails
```gherkin
Given user is admin
When the user is on a season details page
Then user can see a "Create Game" button
```

### Step 3: Verify Output
```
FAIL tests/e2e/verify-season-create-game.spec.ts
  Error: page.getByRole('button', { name: /create game/i }).toBeVisible()
  Timeout 5000ms exceeded.
  → Button "Create Game" not found in DOM
```

### Step 4b: Debug Ticket Created

`feature-tickets/debug/2026-07-20-season-create-game-button-missing.md`

Evidence collected:
- Console errors: none
- Network errors: none
- Page snapshot at failure point shows schedule table but no create button
- Suspected root cause: "Create Game" button may be behind a permission check, or doesn't exist on season detail page (might be on tournament detail page instead)

## Related Skills
- `qa-e2e-playwright` — CLI commands, debugging, trace viewer
- `qa-test-to-playwright` — Structured Gherkin→test conversion
- `qa-edge-case-analysis` — Identify edge cases to add as test scenarios
- `qa-test-ticket-creation` — Create Gherkin tickets for new feature areas
- `testing-patterns` — Unit test patterns for parallel coverage
- `feature-ticket-workflow` — Ingest and implement feature tickets
- `frontend-engineer` — Code style and project conventions
