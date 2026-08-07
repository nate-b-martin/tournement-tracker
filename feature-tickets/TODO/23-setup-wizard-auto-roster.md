# Feature 23: Setup Wizard — Auto-Populate Rosters with Linked Players

## Overview

During the Setup Season Wizard's **Manage Rosters** step (`StepManageRosters`), every roster currently starts empty. Users must manually add each player one at a time — either by typing new players or browsing/searching existing players and clicking "Add to Roster" — even for players who already belong to a selected team via `players.teamId`.

This enhancement pre-populates each team's roster with all players already linked to that team (`players.teamId === team._id`) so the user only has to **remove** players who should not be included, speeding up the wizard for recurring teams/seasons.

**Decisions locked in:**
- **Approach B (chosen):** Seed rosters when the user reaches the Manage Rosters step, not when teams are selected in Step 1.
- Players linked to a selected team are added with `existingPlayerId` set, so the existing submit path in `SetupWizard.tsx` assigns them via `api.players.bulkAssignToTeam` unchanged.
- Newly created teams (`isNew`) start with an empty roster (no pre-existing players to seed).
- Unlinked players (no `teamId`) are **not** auto-added; they remain available via the existing search/browse UI.

## Prerequisites

- [x] Setup Wizard exists (`src/components/SetupWizard/`) with steps: SelectTeams, ManageRosters, CreateSeason, ConfigureTournament, Review
- [x] `players` table has `teamId: v.optional(v.id("teams"))` (`convex/schema.ts`)
- [x] `players.search` / `players.list` support fetching players and redaction via `redactPlayer`
- [x] Wizard state `rosters: Record<string, PlayerEntry[]>` with `existingPlayerId` support
- [x] Submit path assigns existing players via `api.players.bulkAssignToTeam` (`SetupWizard.tsx`)

## Scope

### In Scope
- New Convex query `players.listByTeamIds` to fetch all players linked to a set of team IDs.
- Auto-seed logic in `StepManageRosters.tsx` that initializes `rosters[teamKey]` for uninitialized teams using linked players.
- Helper copy in the roster UI explaining that linked players are auto-added and removable.
- Unit tests covering seeding, non-re-seeding of edited rosters, and empty state.

### Out of Scope
- Changing how players are linked to teams (the Team Roster dialog / `bulkAssignToTeam` remain as-is).
- Seeding at team-selection time (Approach A) — rejected in favor of Approach B.
- Adding an index on `players.teamId` (full-collect is consistent with existing `list`/`countByTeam` patterns).
- UI to batch-assign unlinked players during the wizard (still done via search/browse per player).

## Implementation Steps

### Step 1: Add `listByTeamIds` query (`convex/players.ts`)

Add a query that returns all players whose `teamId` is in the provided set. Follows the existing full-collect + `redactPlayer` pattern (there is no index on `players.teamId`).

```typescript
export const listByTeamIds = query({
  args: { teamIds: v.array(v.id("teams")) },
  handler: async (ctx, args) => {
    if (args.teamIds.length === 0) return [];
    const adminView = await isViewerAdmin(ctx);
    const teamIdSet = new Set(args.teamIds);
    const players = await ctx.db.query("players").collect();
    return players
      .filter((p) => p.teamId && teamIdSet.has(p.teamId))
      .map((p) => ({ ...redactPlayer(p, adminView) }));
  },
});
```

Returns raw player docs (with `_id`, `firstName`, `lastName`, `jerseyNumber`, `teamId`). No team join needed — the wizard only requires player basics.

Run `npx convex dev` to regenerate type bindings for `convex/_generated/`.

### Step 2: Auto-seed rosters in `StepManageRosters.tsx`

1. Import `useEffect` (add to the existing `import { useId, useState } from "react"`).
2. Derive selected existing team IDs:

```typescript
const selectedTeamIds = state.selectedTeams
  .filter(
    (t): t is TeamEntry & { existingId: NonNullable<TeamEntry["existingId"]> } =>
      !t.isNew && !!t.existingId,
  )
  .map((t) => t.existingId);

const linkedPlayers = useQuery(
  api.players.listByTeamIds,
  selectedTeamIds.length > 0 ? { teamIds: selectedTeamIds } : "skip",
);
```

3. Add a seeding effect. A roster is only seeded when `state.rosters[team.key] === undefined` (the "uninitialized" marker). This is critical so a roster the user emptied (`[]`) or edited is **never** re-seeded on navigation back/forward.

```typescript
useEffect(() => {
  if (!linkedPlayers) return;

  for (const team of state.selectedTeams) {
    if (state.rosters[team.key] !== undefined) continue;

    if (team.isNew) {
      dispatch({ type: "SET_ROSTER", teamKey: team.key, players: [] });
      continue;
    }

    const teamPlayers = linkedPlayers.filter(
      (p) => p.teamId === team.existingId,
    );
    dispatch({
      type: "SET_ROSTER",
      teamKey: team.key,
      players: teamPlayers.map((p) => ({
        firstName: p.firstName,
        lastName: p.lastName,
        jerseyNumber: p.jerseyNumber ?? undefined,
        existingPlayerId: p._id,
      })),
    });
  }
}, [linkedPlayers, state.selectedTeams, state.rosters, dispatch]);
```

4. Add helper copy above the team pills (or in the step description) so the pre-filled behavior is discoverable:

> "Players already on a team are added automatically. Remove any you don't want included."

### Step 3: No changes to submit path

`SetupWizard.tsx` already handles `existingPlayerId` players via `assignPlayersToTeam`. New players created in the wizard still get `teamId` on create. No changes needed.

### Step 4: Unit tests (`tests/unit/components/SetupWizard.test.tsx`)

The test file mocks `convex/react`'s `useQuery` to return `undefined` by default and `SetupWizardProvider` accepts `externalState`. Use `externalState` to provide a `selectedTeams` array with an existing team, and override `vi.mocked(useQuery)` for the `listByTeamIds` call.

Cover:
1. **Seeds linked players:** `selectedTeams` contains an existing team; `useQuery` returns a player with that `teamId` → roster renders that player with a "Remove" button.
2. **Does not re-seed edited rosters:** `rosters[teamKey]` pre-set to `[]` (user removed everyone) → no players render after mount (guard against re-seeding).
3. **New teams stay empty:** `selectedTeams` contains an `isNew` team → roster shows empty state, no query hit for that team.
4. **Empty state unchanged:** no selected teams → existing "No teams selected yet" message still renders.

### Step 5: Verify

```bash
npm run check
npm run test src/components/SetupWizard  # or: npm run test
npm run build
```

Optionally run `npx convex dev` + `npx convex seed` to manually verify with real data (requires seed teams with `teamId`-linked players, e.g., Diamond Divas from the seed).

## Acceptance Criteria

### Functionality
- [ ] When the user reaches the Manage Rosters step, each selected **existing** team's roster is pre-populated with every player whose `players.teamId` equals that team's `_id`.
- [ ] Pre-populated players display with their name, jersey number, and a working **Remove** button.
- [ ] Removing a player persists: navigating to a later step and back to Manage Rosters does **not** re-add the removed player.
- [ ] A roster the user fully emptied (`[]`) is not re-populated on revisit.
- [ ] Newly created teams (created in Step 1) show an empty roster.
- [ ] Players not linked to any selected team are not auto-added and remain browsable via "Browse Existing Players".
- [ ] Player counts on the team pill badges reflect the seeded rosters.
- [ ] Review step and submit flow correctly include auto-seeded players (existing players assigned via `bulkAssignToTeam`, no duplicates created).

### UX
- [ ] Helper text is visible indicating linked players are added automatically and can be removed.
- [ ] No loading flash longer than the query resolves; team pills may show `0` briefly while `linkedPlayers` loads.
- [ ] `canGoNext` for Manage Rosters remains `true` (auto-seeding never blocks progression).

### Non-Regression
- [ ] The wizard's discard-changes confirmation (`hasData`) is not unexpectedly triggered by roster seeding.
- [ ] Manual add/search/add-new-player flows still work unchanged.
- [ ] `players.list`, `players.search`, `countByTeam` behave unchanged.

## Edge Cases

- **No selected teams:** Step renders "No teams selected yet"; query receives `"skip"`, no seeding.
- **Selected team has zero linked players:** roster is seeded to `[]` and marked initialized; empty-state message shows.
- **Team removed in Step 1:** `REMOVE_TEAM` deletes the roster entry → returning to Step 2 re-seeds (fresh selection, expected).
- **Mixed selection (existing + new teams):** existing teams seed from linked players; new teams get empty rosters.
- **User navigates back/forward without editing:** rosters already initialized → no re-seed, no duplicate state churn.
- **Admin vs non-admin viewer:** `redactPlayer` strips `email`/`phone`/`birthDate`/`userId` for non-admins; names/jersey numbers (what the roster shows) are always present.
- **Player linked to multiple teams:** not possible with current schema (single `teamId`); if `teamId` is set, the player seeds only into that team's roster.
- **Search results overlap:** `existingPlayerIdsInRoster` dedupes already-seeded players from browse results — behavior unchanged and now naturally includes auto-seeded players.

## Files Changed

### New
- `convex/players.ts` — add `listByTeamIds` query (function added to existing file; no new file)

### Modified
- `src/components/SetupWizard/steps/StepManageRosters.tsx` — auto-seed rosters via `useEffect` + `listByTeamIds`, helper copy
- `convex/_generated/` — regenerated type bindings (via `npx convex dev`)
- `tests/unit/components/SetupWizard.test.tsx` — add seeding tests

### No Changes Needed
- `src/components/SetupWizard/SetupWizard.tsx` — submit path already handles `existingPlayerId` players
- `src/components/SetupWizard/SetupWizardContext.tsx` — `SET_ROSTER` action already exists
- `src/components/SetupWizard/types.ts` — `PlayerEntry.existingPlayerId` already exists
- `convex/schema.ts` — no schema change required
- `convex/seed.ts` — existing seed already has `teamId`-linked players

## Implementation Order

1. `convex/players.ts` — add `listByTeamIds` query
2. `npx convex dev` — regenerate bindings
3. `src/components/SetupWizard/steps/StepManageRosters.tsx` — seed effect + helper copy
4. `tests/unit/components/SetupWizard.test.tsx` — seeding tests
5. `npm run check && npm run test && npm run build`

## Testing

### Unit / Integration (Vitest)
- Seed linked players into an existing team's roster on mount.
- No re-seed when `rosters[teamKey]` is already defined (including `[]`).
- New teams receive an empty roster.
- Empty state renders when no teams are selected.
- Run: `npm run test src/components/SetupWizard` (or `npm run test`).

### Manual (with `npx convex dev` + `npx convex seed`)
1. Open the Setup Season Wizard from the dashboard/homepage.
2. Select 2+ existing seed teams that have `teamId`-linked players (e.g., Diamond Divas, Swing Sisters).
3. Advance to **Manage Rosters** → confirm each team's roster is pre-filled with its linked players and counts show on the pills.
4. Remove a player → navigate to Create Season → return to Manage Rosters → confirm the removed player stays gone.
5. Remove all players from one team → navigate away and back → confirm the roster stays empty.
6. Create a new team in Step 1 → confirm its roster is empty in Step 2.
7. Browse existing players → confirm linked players already in the roster are excluded from available search results.
8. Complete the wizard → confirm on the season page that auto-seeded players are assigned to their teams and **no duplicate player records** were created.

### E2E (Playwright, optional follow-up)
- Can be added later as `tests/e2e/setup-wizard-auto-roster.spec.ts` using the page-object pattern from the qa-playwright skills; not required for this ticket.

## Commands

```bash
npx convex dev            # regenerate bindings (first-time/schema)
npm run check             # Biome lint + format
npm run test src/components/SetupWizard  # unit tests
npm run build             # TypeScript compilation
npx convex seed           # reseed (for manual verification)
```

## Notes

- `state.rosters[key] === undefined` is the authoritative "never initialized" marker. This is what makes Approach B idempotent without adding a separate "touched" flag.
- The seeding effect's deps include `state.rosters` so the guard re-checks after each `SET_ROSTER` dispatch, but the `!== undefined` check prevents redundant dispatches.
- `players.teamId` has no database index; full-collect is consistent with existing `countByTeam` and `players.list`. If the player table grows significantly, add `.index("by_teamId", ["teamId"])` to `convex/schema.ts` as a follow-up.
- Existing player search results already surface a team badge (`player.team.name`), which pairs well with the auto-seeded rosters.
