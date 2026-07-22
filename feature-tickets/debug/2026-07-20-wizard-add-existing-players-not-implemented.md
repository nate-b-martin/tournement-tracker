---
created: 2026-07-20
source: qa-playwright-workflow-explorer
sourceTicket: feature-tickets/Enhancments/ideas.md
priority: P2
status: open
---

# Debug: Season Wizard — "Add Existing Players" Not Implemented

## Scenario Attempted

```gherkin
Scenario: Add Existing players during season wizard setup
Given Admin is going through setup wizard
And on manage rosters setup
Then admin can search and add existing player to teams or add new player.
```

## Action Plan

| Step | Type | Detail | Status |
|------|------|--------|--------|
| 1 | Role | admin | ✅ |
| 2 | Navigate | homepage → Open wizard | ✅ |
| 3 | Select | 2 teams (Diamond Divas, Swing Sisters) | ✅ |
| 4 | Navigate | Go to Step 2 (Manage Rosters) | ✅ |
| 5 | Click | Team tab "Diamond Divas" | ✅ |
| 6 | Assert | "Add Player" form is visible (new player) | ✅ |
| 7 | Assert | Search/add existing player functionality exists | ❌ FAIL |

## Failure Evidence

### Test Output

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false

  53 | 			(await browsePlayersButton.isVisible().catch(() => false));
  54 |
> 55 | 		expect(hasSearchExisting).toBe(true);
     | 		                          ^
```

### Page Snapshot at Failure

The page snapshots shows Step 2 (Manage Rosters) is rendered with:

- Heading: "Manage Rosters"
- Description: "Add players to each team. At least 1 player per team is recommended."
- Team tabs: "Diamond Divas 0" (active), "Swing Sisters 0"
- Roster editor for Diamond Divas:
  - "Roster for Diamond Divas" heading
  - "No players added yet. Add your first player below."
  - **New player form:** First Name textbox, Last Name textbox, "#" spinbutton, "Add Player" button
  - Back / Next navigation
- **No** search input, "Browse Players" button, or "Add Existing" button anywhere

See screenshot: `test-results/verify-existing-players-Ve-77e0b--to-teams-or-add-new-player-chromium/test-failed-1.png`

### Console Errors

Not collected (no error handlers triggered — test failed on assertion, not browser error)

## Investigation Notes

### What Works
- [x] Admin authentication and homepage
- [x] Opening Setup Wizard dialog
- [x] Selecting existing teams from Step 1
- [x] Navigation to Step 2 (Manage Rosters)
- [x] Team tab switching (Diamond Divas / Swing Sisters)
- [x] "Add Player" form for creating **new** players (First Name, Last Name, #, Add Player button)

### What Fails
- [x] Searching existing players from the database
- [x] Adding existing players to a team roster
- [x] Any UI element for browsing/looking up existing players

## Suspected Root Causes

- [x] **Missing element**: The `StepManageRosters.tsx` component only renders a form for creating **new** players. There is no component or UI section for searching/browsing existing players in the database.
- [ ] **Route mismatch**: N/A — this is a dialog step, not a route
- [ ] **Auth issue**: N/A — admin is authenticated
- [ ] **Data dependency**: Seed data has 32+ players across teams, so data exists. The UI just doesn't query or display them.
- [ ] **Bug**: Not a bug — the feature simply hasn't been implemented yet.

## Codebase Analysis

### Existing Backend (Can be reused)
- `convex/players.ts` — `players.search` query exists and supports text search across first/last name
- `convex/players.ts` — `players.list` supports filtering by `teamId` (useful for showing unassigned players)
- Both queries are auth-guarded already

### Missing Frontend
- `src/components/SetupWizard/steps/StepManageRosters.tsx` — only has "Add New Player" form
- Needs a "Search Existing Players" section with:
  - Search input for player name
  - Results list showing matching players with team name
  - "Add to Roster" button per result
  - Integration with wizard state (`ADD_PLAYER` dispatch action already exists)

### Reference Implementation
- `src/components/SetupWizard/steps/StepSelectTeams.tsx` — has a similar search/filter pattern for selecting existing teams (lines 137-199). Could serve as a model for the player search UI.
- `players.search` is already available from Convex and ready to wire in

## Next Steps

1. [ ] Implement a "Search Existing Players" section in `StepManageRosters.tsx` alongside the existing "Add New Player" form
2. [ ] Use `useQuery(api.players.search, ...)` to query players by name
3. [ ] Add ability to select and add existing players to a team's roster via `ADD_PLAYER` dispatch
4. [ ] Re-run verification with Playwright CLI
5. [ ] Generate the test once verification passes
