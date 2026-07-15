---
name: qa-edge-case-analysis
description: Systematic edge case identification for TanStack Tournament Tracker - covers boundary states, error conditions, permission scenarios, async failures, and data edge cases to ensure comprehensive test coverage
metadata:
  audience: developers
  stack: playwright-vitest-gherkin
---

## Purpose

Systematically identify edge cases across the application before writing tests or filing tickets. This skill ensures you don't miss boundary states, error paths, permission gaps, or data-driven edge conditions.

## Edge Case Categories

When analyzing a feature, page, or component, check each category below:

### 1. Data Boundary States
| State | What to check |
|-------|---------------|
| Empty | Zero items, null/undefined data, missing optional fields |
| Single | Exactly one item (edge of pagination, single-select behavior) |
| Maximum | Pagination boundary (e.g., page 1 of 1 vs page 2 of 2), max-length inputs |
| Overflow | Data exceeding container size, text truncation, long names |
| Whitespace | Trailing/leading whitespace in inputs, empty strings |
| Special chars | Unicode, emoji, HTML entities, SQL injection patterns |

### 2. UI States
| State | What to check |
|-------|---------------|
| Loading | Skeleton/spinner visibility, interaction disabled during load |
| Empty | Empty state message, CTA button visibility |
| Error | Error message display, retry mechanism |
| Success | Confirmation toast, navigation after success |
| Transition | Loading → Empty, Loading → Error, Error → Data, Data → Empty |

### 3. Permission & Role Scenarios
| Role | What to check |
|------|---------------|
| Unauthenticated | Redirect to sign-in, access denied message |
| Spectator (read-only) | View-only: no edit/delete buttons, no create forms |
| Player | Team roster access, match history view |
| Organizer | Tournament management: create/edit/delete matches |
| Admin | Full access: user management, system settings |
| Degraded | Clerk token expiry, missing Convex data for a user |

### 4. Network & Async Failures
| Scenario | What to check |
|----------|---------------|
| Convex query timeout | Loading state stuck, retry fallback |
| Mutation failure | Optimistic update rollback, error toast |
| Concurrent mutations | Two users editing same record, last-write-wins |
| Race condition | Rapid create/delete on same resource |
| Offline | No network indicator, stale data display |

### 5. Form & Input Edge Cases
| Scenario | What to check |
|----------|---------------|
| Required fields | Submit with empty required fields |
| Duplicate submission | Double-click submit button |
| Cancel mid-flow | Modal dismiss, form reset |
| Invalid data | Email format, number range, URL validation |
| Character limits | Max length enforcement, truncation display |

### 6. Navigation & Routing
| Scenario | What to check |
|----------|---------------|
| Direct URL access | Bookmarking a deep link |
| Browser back/forward | History stack after form submission |
| Query params | Invalid params, missing params, XSS in params |
| Route transitions | Loading state between routes, scroll position |

### 7. Responsive & Device
| Breakpoint | What to check |
|------------|---------------|
| Mobile (< 640px) | Hamburger menu, stacked layout, touch targets |
| Tablet (768-1024px) | Sidebar collapse, table horizontal scroll |
| Desktop (> 1024px) | Full layout, hover states, keyboard shortcuts |
| Zoom 200% | Text overflow, button wrapping, layout breaks |

## Analysis Workflow

### Step 1: Map the Feature Surface
Identify all entry points (routes, components, forms, modals) for the feature being tested.

```bash
# Find all related components, routes, and Convex handlers
find src -path "*feature-name*" -type f
grep -r "feature-component" src/components --include="*.tsx" -l
```

### Step 2: Enumerate Data Flows
For each entry point, trace:
- **Read path**: What queries fire? What if data is null/empty/partial?
- **Write path**: What mutations fire? What validation runs? What if the mutation fails?
- **Auth gate**: Is this behind `ProtectedRoute`? What role check applies?

### Step 3: Apply Edge Case Matrix
Go through each category above and produce a list of testable scenarios. Use this format:

```markdown
## Edge Cases for [Feature Name]

### Data States
- [ ] Empty team list → shows "No teams found" empty state
- [ ] Team with 0 players → shows "No players on this team"
- [ ] Tournament with 1 match → pagination: page 1 of 1, prev/next disabled
- [ ] Player name with 200+ characters → truncation behavior

### Permission Scenarios
- [ ] Spectator visits /teams → can view list but no "Create Team" button
- [ ] Spectator clicks "Edit" → redirected or button not rendered
- [ ] Unauthenticated user visits /admin → redirected to sign-in with toast

### Error & Edge
- [ ] Create team fails → error toast shown, form data preserved
- [ ] Delete while another user is editing → optimistic rollback
- [ ] Double-click "Save" → only one mutation fires
```

### Step 4: Prioritize
Tag each edge case with a priority:

| Priority | Label | When to fix/test |
|----------|-------|------------------|
| P0 | Critical | Data loss, security, broken core flow |
| P1 | High | Poor UX but workaround exists |
| P2 | Medium | Visual polish, edge case in rare scenario |
| P3 | Low | Theoretical, unlikely combo, nice-to-have |

## Application to Different Test Levels

| Test level | Edge cases to prioritize |
|------------|-------------------------|
| Unit (Vitest) | Data states, form validation, hook logic, loading/error branches |
| E2E (Playwright) | Permission scenarios, navigation flows, full create/edit/delete lifecycle |
| API | Convex mutation validation, role enforcement, duplicate/conflict handling |

## Output Examples

### For a Unit Test Ticket
```markdown
## Edge Cases: DataTable search input
- P0: Empty string → onChange fires with empty string
- P1: Leading/trailing whitespace → trimmed before filter
- P1: Special regex chars (.*+?^${}()|[]) → no regex crash
- P2: 500+ char query → truncation or graceful handling
- P2: Rapid typing → debounce fires latest value
```

### For an E2E Ticket
```markdown
## Edge Cases: Tournament creation form
- P0: Submit with empty required name → validation error shown
- P0: Submit with duplicate name → "already exists" error
- P1: Cancel mid-form → returns to tournament list, no partial save
- P1: Browser back during form → unsaved changes warning
- P2: Tournament name with emoji → displayed correctly in table
- P3: Rapid double-click submit → only one tournament created
```

## Related Skills
- `qa-test-ticket-creation` — Convert edge cases into Gherkin test tickets
- `qa-e2e-playwright` — Execute Playwright tests using the MCP browser
- `testing-patterns` — Reference existing unit/E2E test patterns
