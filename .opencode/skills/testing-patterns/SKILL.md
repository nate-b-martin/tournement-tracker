---
name: testing-patterns
description: Testing patterns for TanStack Tournament Tracker - Vitest component tests with React Testing Library, Playwright E2E with Clerk auth, Convex mocking
metadata:
  audience: developers
  stack: vitest-playwright-react-testing-library
---

## Test Commands

```bash
npm run test              # Run all Vitest tests
npm run test <file>       # Run single test file (e.g., src/components/Button.test.tsx)
npm run test:watch        # Run tests in watch mode
npx playwright test       # Run all E2E tests
npx playwright test --ui  # Run E2E tests with UI mode
```

## Vitest + React Testing Library

### Test File Location
All unit tests go in `tests/unit/` following the source directory structure:
```
tests/unit/
  components/     # Tests for src/components/
  hooks/          # Tests for src/hooks/
```

### DataTable Test Pattern (from `tests/unit/components/DataTable.test.tsx`)
Reference the existing DataTable tests for patterns:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataTable } from "@/components/DataTable/DataTable";
import type { ColumnDef } from "@/components/DataTable/types";
```

Test categories to cover:
1. **Sortable header clicks** — click headers, verify sort callback fires with correct field
2. **Empty message** — render with empty data, verify empty message text
3. **Loading state** — pass `isLoading={true}`, verify loading indicator
4. **Search input** — placeholder text, value display, onChange callback, special characters, whitespace trimming
5. **Filter chips** — rendering labels, active/inactive styling, independent onClick handlers
6. **Action columns** — edit/delete button rendering and routing
7. **Pagination controls** — page navigation buttons, page size selector
8. **Toolbar layout** — responsive class behavior

### Player Table Test Pattern

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlayersTable } from "@/components/PlayersTable";
```

Tests to write for table components:
- Renders columns with correct headers
- Handles empty data gracefully
- Shows loading state
- Filter chip clicks trigger correct filtering
- Search input filters data
- Pagination controls respond to clicks

### Hook Test Pattern (from `tests/unit/hooks/usePagination.test.ts`)

```typescript
import { describe, it, expect } from "vitest";
import { usePagination } from "@/hooks/usePagination";

describe("usePagination", () => {
  it("calculates basic pagination values", () => {
    const result = usePagination(100, 0, 10);
    expect(result.startIndex).toBe(1);
    expect(result.endIndex).toBe(10);
    expect(result.totalPages).toBe(10);
  });

  it("handles empty dataset", () => {
    const result = usePagination(0, 0, 10);
    expect(result.totalPages).toBe(1); // minimum 1 page
    expect(result.startIndex).toBe(0);
  });
});
```

### Mocking Convex Queries
Use the mock data in `src/mocks/` for isolated component tests:

```typescript
// Use mock data in your tests
import { mockTeams } from "@/mocks/data/mockTeams";
import { mockPlayers } from "@/mocks/data/mockPlayers";

// For hooks that call Convex, mock the convex/react module
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}));
```

### Testing Auth-Protected Components

```typescript
// Mock the auth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    isLoading: false,
    isSignedIn: true,
    isAdmin: true,
    user: { id: "test-user" },
    isOrganizer: false,
    isPlayer: false,
    isSpectator: false,
  })),
}));
```

## Playwright E2E Tests

### Test Location
E2E tests live in `tests/e2e/`:
```
tests/e2e/
  auth.spec.ts                 # Auth flow tests
  navigation.spec.ts           # Navigation tests
  seasons.spec.ts              # Season list/CRUD tests
  schedule-autogeneration.spec.ts  # Schedule generation E2E
  pages/                       # Page object models
    AuthPage.ts
    ClerkLogin.ts
    Navigation.ts
    ProtectedPage.ts
    SeasonsPage.ts
    SeasonDetailPage.ts
    SetupWizardPage.ts
  fixtures/
    auth.ts                    # Re-exports test/expect from @playwright/test
  global-setup.ts              # Clerk auth + storage state persistence
```

### E2E Env Requirements
The global setup (`tests/e2e/global-setup.ts`) requires these env vars:
- `CLERK_TEST_EMAIL` — Clerk test user email (NOT `CLERK_EMAIL` or `ADMIN_CLERK_EMAIL`)
- `CLERK_TEST_PASSWORD` — Clerk test user password
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key (starts with `pk_test_`)
- `CLERK_SECRET_KEY` — Clerk secret key (starts with `sk_test_`)

Without `CLERK_TEST_EMAIL`/`CLERK_TEST_PASSWORD`, all E2E tests fail at the global setup step.

### Page Object Pattern
```typescript
// tests/e2e/page-objects/AuthPage.ts
import type { Page } from "@playwright/test";

export class AuthPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  async clickSignIn() {
    await this.page.getByRole("button", { name: "Sign In" }).click();
  }

  async isSignInVisible() {
    return this.page.getByRole("button", { name: "Sign In" }).isVisible();
  }
}
```

### E2E Test Pattern (from `tests/e2e/auth.spec.ts`)
```typescript
import { test, expect } from "@playwright/test";
import { AuthPage } from "./page-objects/AuthPage";

test.describe("Authentication", () => {
  test("shows sign-in button when not authenticated", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });
});
```

### Resilient Skip Pattern (Missing Preconditions)

When testing features that depend on seed data (seasons, teams, tournaments), use `test.skip()` instead of failing:

```typescript
test("generates schedule for existing season", async ({ page }) => {
  await page.goto("/seasonspage");
  await page.waitForLoadState("networkidle");

  const seasonLink = page.getByRole("link").filter({ has: page.locator("text=") });
  const linkCount = await seasonLink.count().catch(() => 0);
  test.skip(linkCount === 0, "No seasons available");

  // Continue with test...
  const adminBtn = await page.getByRole("button", { name: /generate/i })
    .isVisible().catch(() => false);
  if (!adminBtn) {
    test.skip(true, "Admin-only button not visible");
  }
});
```

This avoids CI noise from missing seed data. Always use `.catch(() => false)` on `.isVisible()` to avoid unhandled rejections.

### Tab Navigation Page Object Pattern

```typescript
export class SeasonDetailPage {
  constructor(private page: Page) {}

  get scheduleTab() { return this.page.getByRole("tab", { name: /schedule/i }); }
  get standingsTab() { return this.page.getByRole("tab", { name: /standings/i }); }

  async clickScheduleTab() { await this.scheduleTab.click(); }
  async waitForScheduleTab() {
    await this.scheduleTab.waitFor({ state: "visible", timeout: 10000 });
  }
}
```

### Dialog + Form Fill Page Object Pattern

```typescript
export class SeasonDetailPage {
  get dialogTitle() {
    return this.page.getByRole("heading", { name: /generate season schedule/i });
  }
  get weeksInput() { return this.page.getByLabel(/regular season weeks/i); }
  get generateButtonInDialog() {
    return this.page.getByRole("button", { name: /^generate schedule$/i });
  }

  async selectScheduleType(type: string) {
    await this.page.getByRole("combobox", { name: /schedule type/i }).click();
    await this.page.getByRole("option", { name: new RegExp(type, "i") }).click();
  }

  async submitGenerateSchedule() {
    await this.generateButtonInDialog.click();
  }
}
```

## Key Files to Reference
- `tests/unit/components/DataTable.test.tsx` — 637 lines of DataTable test patterns
- `tests/unit/components/PaginationControls.test.tsx` — 123 lines of pagination tests
- `tests/unit/hooks/usePagination.test.ts` — 54 lines of hook tests
- `src/mocks/data/mockTeams.ts` — 6 mock teams with realistic data
- `src/mocks/data/mockPlayers.ts` — 25 mock players across 6 teams
- `src/mocks/hooks/useMockPlayers.ts` — Mock player hook implementation
- `tests/e2e/` — Full E2E test suite with auth flows

## Test Coverage Checklist
- [ ] All table components render data correctly
- [ ] Empty states display proper messages
- [ ] Loading states show spinners/text
- [ ] Filter chips toggle correctly
- [ ] Search input filters data
- [ ] Pagination controls work (first/prev/next/last)
- [ ] Page size changes work
- [ ] Sort clicks trigger correct callbacks
- [ ] Edit/Delete buttons render conditionally based on auth
- [ ] E2E auth flow: unauthenticated → sign-in → protected route access
