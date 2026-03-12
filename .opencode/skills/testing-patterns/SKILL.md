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
  auth.spec.ts        # Auth flow tests
  navigation.spec.ts  # Navigation tests
  page-objects/       # Page object models
    AuthPage.ts
    ClerkLogin.ts
    Navigation.ts
    ProtectedPage.ts
  fixtures/           # Test fixtures
    auth.ts
  global-setup.ts     # Clerk auth + storage state persistence
```

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

### Global Setup Pattern (from `tests/e2e/global-setup.ts`)
The global setup file handles Clerk authentication and saves storage state for reuse across tests.

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
