---
name: qa-test-ticket-creation
description: Structured test ticket creation using Gherkin scenarios, acceptance criteria, test data specs, and user flows for TanStack Tournament Tracker
metadata:
  audience: developers
  stack: gherkin-playwright-vitest
---

## Purpose

Generate well-structured test tickets that can be directly used for implementation or automated test generation. Each ticket includes Gherkin scenarios, acceptance criteria, test data specifications, and a user flow diagram.

## Ticket Structure

Every test ticket should follow this template:

```markdown
# Test: [Feature Name] — [Specific Scenario]

## User Story
As a **[role]**  
I want to **[action]**  
So that **[benefit]**

## Acceptance Criteria
- [ ] Criterion 1: specific, measurable, testable
- [ ] Criterion 2: edge case or boundary
- [ ] Criterion 3: error state or permission check

## Test Data
```typescript
{
  existingData: { /* data needed for test setup */ },
  inputData: { /* user-submitted values */ },
  expected: { /* expected output/state */ }
}
```

## User Flow
```
[Start State]
    │
    ├─ Action 1: what user does
    │   └─ Expected response
    │
    ├─ Action 2: what user does
    │   └─ Expected response
    │
    └─ [End State]
```

## Gherkin Scenarios

### Happy Path
```gherkin
Feature: [Feature Name]
  As a [role]
  I want to [action]
  So that [benefit]

  Scenario: [Scenario Name]
    Given [precondition]
    When [user action]
    Then [expected outcome]
```

### Edge Case / Error
```gherkin
  Scenario: [Edge case description]
    Given [precondition]
    And [additional context]
    When [user action that triggers edge case]
    Then [expected error/fallback behavior]
```

### Permission Variant
```gherkin
  Scenario: [Role] tries to [action]
    Given [user is authenticated as role]
    When [user attempts action]
    Then [expected permission behavior]
```

## Gherkin Conventions

Use the following step templates consistent with the project's auth model:

### Given (Setup)
```
Given the user is signed in as [admin|organizer|player|spectator]
Given the user is not signed in
Given [N] [entity] exist(s)
Given a [entity] with [field] "[value]" exists
Given the [entity] list is empty
Given the user is on the [page] page
```

### When (Action)
```
When the user navigates to "[route]"
When the user clicks the "[label]" button
When the user types "[value]" into the "[label]" field
When the user selects "[option]" from the "[label]" dropdown
When the user submits the form
When the user confirms the dialog
When the user cancels the dialog
When the user presses the "[key]" key
```

### Then (Verification)
```
Then the user should see [element] [visible|hidden]
Then the URL should be "[path]"
Then the "[label]" field should show "[message]"
Then a toast should appear with "[message]"
Then the [entity] should have [field] "[value]"
Then the user should be redirected to "[path]"
Then the "[element]" should contain [N] items
```

## Examples

### Example 1: Protected Route (based on existing E2E tests)

```gherkin
Feature: Route Protection
  As a tournament organizer
  I want unauthenticated users redirected
  So that sensitive data stays private

  Scenario: Unauthenticated user visits protected route
    Given the user is not signed in
    When the user navigates to "/teams"
    Then the user should see "Authentication Required" title
    And the URL should contain "/"

  Scenario: Unauthenticated user sees sign-in button
    Given the user is not signed in
    When the user navigates to "/"
    Then the "Sign In" button should be visible

  Scenario: Signed-in user accesses protected route
    Given the user is signed in as "admin"
    When the user navigates to "/teams"
    Then the user should see the teams list
    And the user should not see "Access Denied"
```

### Example 2: Create Team

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

  Scenario: Create team with empty name
    When the user clicks the "Create Team" button
    And the user leaves the "Team Name" field empty
    And the user clicks the "Save" button
    Then the "Team Name" field should show "Name is required"

  Scenario: Spectator cannot create team
    Given the user is signed in as "spectator"
    When the user visits the teams page
    Then the user should not see a "Create Team" button
```

### Example 3: Empty State

```gherkin
Feature: Empty State Display
  As a user
  I want a clear empty state message
  So that I know what to do when no data exists

  Scenario: View empty team list
    Given the teams list is empty
    Given the user is signed in as "admin"
    When the user navigates to "/teams"
    Then the user should see "No teams found" message
    And the user should see a "Create Team" button
    And the user should not see a data table
    And the user should not see pagination controls

  Scenario: Empty state transitions to data
    Given the teams list is empty
    When the user creates a team
    Then the empty state should no longer be visible
    And the data table should be visible
```

## Writing Scenarios for Different Test Levels

| Level | Gherkin scope | Tool |
|-------|---------------|------|
| **Unit** | Focus on component behavior: renders, callbacks, state transitions | Vitest |
| **Integration** | Component + Convex data flow: queries, mutations, loading states | Vitest + mocks |
| **E2E** | Full browser flow: navigation, auth, real Clerk/Convex | Playwright |

## Ticket Metadata

Include this metadata block at the top of every ticket:

```yaml
---
feature: Team Management
area: UI / Teams Page
testType: e2e
priority: P1
dependencies:
  - teams/create mutation
  - TeamsTable component
  - EmptyState component
relatedTickets:
  - "FEAT-42: Team CRUD implementation"
author: QA
created: 2026-07-01
---
```

## Organizing Tickets

```
feature-tickets/testing/
  auth/
    01-unauth-redirect.md
    02-admin-only-routes.md
    03-role-based-actions.md
  teams/
    01-empty-state.md
    02-create-team-validation.md
    03-update-team-name.md
    04-delete-team-access.md
  tournaments/
    01-bracket-generation-edge.md
    02-scoring-edge-cases.md
```

## Related Skills
- `qa-edge-case-analysis` — Identify edge cases before writing tickets
- `qa-e2e-playwright` — Execute tests matching ticket scenarios
- `tournament-domain` — Tournament-specific business logic edge cases
