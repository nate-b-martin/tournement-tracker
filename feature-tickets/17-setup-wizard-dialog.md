# Feature 17: Setup Wizard Dialog — Multi-Step Creation Flow

## Overview
Build a multi-step dialog modal that walks admins through creating a complete season setup: selecting/creating teams, managing rosters, creating a season, configuring a tournament, and reviewing everything before final creation. This is the flagship onboarding feature of the app.

## Prerequisites
- [ ] Ticket 15 — Seasons, seasonTeams, and tournament seasonId Convex functions must be deployed
- [ ] Ticket 16 — useSeasons and useSeasonTeams hooks must be available (though not strictly required for the wizard itself, which uses useMutation directly)

## Design

### Dialog: 5-Step Wizard
```
Step 1          Step 2           Step 3         Step 4              Step 5
[Select Teams] → [Manage Rosters] → [Create Season] → [Configure Tournament] → [Review & Create]
```

Wizard opens as a modal dialog (`<Dialog>`) with:
- Stepper header showing current step (1–5) with labels
- "Back" and "Next" navigation buttons
- "Finish" / "Create All" button on Step 5
- Ability to close and discard progress (with confirmation if data entered)

### Step Details

#### Step 1: Select Teams
- Fetch existing teams via `api.teams.list`
- Search/filter teams by name
- Multi-select checkboxes — selected teams shown as removable chips/badges
- "Create New Team" button opens a compact inline form:
  - Team name (required)
  - Coach name, email, phone
  - City (optional)
- Validation: at least 2 teams must be selected
- State: `selectedTeams: Array<{ id?: Id<"teams">; isNew: boolean; name: string; ...}>`
  - Existing teams have an `id`
  - New teams have `isNew: true` and will be created on final submit

#### Step 2: Manage Rosters
- Tab or dropdown to switch between selected teams
- For each team:
  - Show current players (if existing team) in a compact list
  - "Add Player" inline form: first name, last name, jersey number
  - Remove button on each player
  - Player count badge per team
- Validation: at least 1 player per team recommended (warning, not blocking)
- State: `rosters: Record<string, Array<{ firstName, lastName, jerseyNumber? }>>`
  - Keyed by team ID (or temp ID for new teams)

#### Step 3: Create Season
- Season name (required, e.g. "Spring 2026")
- Sport (required, text input or dropdown)
- Start date, end date (date pickers, required)
- Description (optional textarea)
- All selected teams from Step 1 will be linked to this season via `seasonTeams`
- State: `season: { name, sport, startDate, endDate, description }`

#### Step 4: Configure Tournament
- Tournament name (auto-filled: `"{Season Name} Championship"`, editable)
- Sport (auto-filled from season, editable)
- Location (required)
- Bracket type: Single Elimination / Double Elimination / Round Robin
- Max teams (auto-filled to count of selected teams, editable)
- Min teams
- Fields available (default: 4)
- Game duration (default: 60 min)
- Break between games (default: 15 min)
- Seeding type: Random / Manual / Ranking
- Registration deadline (optional date)
- State: `tournament: { name, sport, location, bracketType, maxTeams, minTeams, fieldsAvailable, gameDuration, breakBetweenGames, seedingType, registrationDeadline }`

#### Step 5: Review & Create
- Summary cards for each section:
  - **Teams** (N teams selected — expand to see team names + player counts)
  - **Players** (N total players across all teams)
  - **Season** (name, sport, date range)
  - **Tournament** (name, bracket type, location, settings)
- "Create All" button triggers sequential mutations:
  1. Create any new teams → collect their IDs
  2. Create players for each team → assign to team IDs
  3. Create season → get season ID
  4. Link teams to season via `seasonTeams.addTeams`
  5. Create tournament with `seasonId` → get tournament ID
  6. Update season with tournament reference (optional)
- Loading state: progress indicator or "Creating..." per step
- On success: close wizard, toast "Setup complete!", redirect to `/seasons/{seasonId}`
- On error: show error toast, allow retry

## Implementation Files

### `src/components/SetupWizard/types.ts`
```typescript
export enum WizardStep {
  SelectTeams = 0,
  ManageRosters = 1,
  CreateSeason = 2,
  ConfigureTournament = 3,
  Review = 4,
}

export interface TeamEntry {
  existingId?: Id<"teams">;
  isNew: boolean;
  name: string;
  coachName: string;
  coachEmail: string;
  coachPhone: string;
  city?: string;
}

export interface PlayerEntry {
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
}

export interface SeasonEntry {
  name: string;
  sport: string;
  startDate: number;
  endDate: number;
  description: string;
}

export interface TournamentEntry {
  name: string;
  location: string;
  bracketType: "single_elimination" | "double_elimination" | "round_robin";
  maxTeams: number;
  minTeams: number;
  fieldsAvailable: number;
  gameDuration: number;
  breakBetweenGames: number;
  seedingType: "random" | "manual" | "ranking";
  registrationDeadline?: number;
}

export interface WizardState {
  step: WizardStep;
  selectedTeams: TeamEntry[];
  rosters: Record<string, PlayerEntry[]>;
  season: SeasonEntry;
  tournament: TournamentEntry;
  isSubmitting: boolean;
  submitPhase: string; // status message during submission
}

export interface WizardContextValue {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  goToStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}
```

### `src/components/SetupWizard/SetupWizardContext.tsx`
- React context provider using `useReducer`
- Reducer actions: SET_TEAMS, ADD_NEW_TEAM, REMOVE_TEAM, SET_ROSTER, ADD_PLAYER, REMOVE_PLAYER, SET_SEASON, SET_TOURNAMENT, SET_SUBMITTING, SET_SUBMIT_PHASE, RESET
- Computes `canGoNext` based on current step validation
- Initial state with sensible defaults

### `src/components/SetupWizard/WizardStepper.tsx`
- Horizontal step indicator bar
- Shows 5 numbered steps with labels below
- Active step highlighted, completed steps show checkmark
- Clickable to jump to completed steps
- Props: `currentStep: WizardStep, steps: Array<{label: string}>, onStepClick?: (step: WizardStep) => void`

### `src/components/SetupWizard/steps/StepSelectTeams.tsx`
- Search input for filtering existing teams
- Checkbox list of teams
- "Create New Team" inline form (expandable section)
- Selected count badge
- Props from context

### `src/components/SetupWizard/steps/StepManageRosters.tsx`
- Team switcher (tabs or select dropdown)
- Player list with remove button
- "Add Player" inline form
- Player count badge
- Props from context

### `src/components/SetupWizard/steps/StepCreateSeason.tsx`
- Name, sport, start date, end date inputs
- Description textarea
- Props from context

### `src/components/SetupWizard/steps/StepConfigureTournament.tsx`
- Tournament settings form (similar to TournamentDialog but condensed)
- Auto-fills from season data
- Props from context

### `src/components/SetupWizard/steps/StepReview.tsx`
- Summary cards
- "Create All" button with submission state
- Progress during submission
- Props from context, onSubmit handler

### `src/components/SetupWizard/SetupWizard.tsx`
- Wraps everything in `<Dialog>` with `max-w-3xl`
- Renders WizardStepper + current step + navigation buttons (Back / Next / Create All)
- Orchestrates final submission: creates teams → players → season → seasonTeams → tournament
- On success: close, toast, navigate to `/seasons/{id}`

### `src/components/SetupWizard/index.ts`
- Barrel export: `export { SetupWizard } from './SetupWizard'`
- Re-export types if needed externally

## Acceptance Criteria
- [ ] Wizard dialog opens from a trigger button (integrated in Ticket 18)
- [ ] Step 1: Can search, multi-select existing teams, create new teams inline
- [ ] Step 2: Can switch between teams, add/remove players per team
- [ ] Step 3: Can set season name, sport, dates, description
- [ ] Step 4: Can configure tournament with auto-filled fields from season
- [ ] Step 5: Summary shows all entities, "Create All" creates everything
- [ ] Stepper shows current step, completed steps are clickable
- [ ] Back/Next navigation works (Next validates current step)
- [ ] Closing dialog with data entered shows confirmation
- [ ] Final submission creates: teams → players → season → seasonTeams → tournament
- [ ] Success toast shown and redirect to `/seasons/{id}` on completion
- [ ] Error state shown on failure with retry option
- [ ] Spectators cannot access wizard (admin-only)
- [ ] All inputs have proper labels and aria attributes

## Edge Cases
- No teams exist yet (Step 1 shows empty state with "Create your first team")
- Single team selected (Step 4 may need min 2 teams validation)
- Very long team/player lists (virtualized or scrollable)
- Closing wizard mid-flow — confirm dialog: "Discard progress?"
- Creating a new team with same name as existing (no duplicate check — allow same name)
- Browser refresh during wizard (state lost — warn on close)
- Network error during multi-step submission (partial creation — show helpful error)
- Empty player rosters (allow, but warn on Step 5)

## Testing Considerations
- Test all 5 steps render correctly
- Test forward/backward navigation
- Test team selection including creating new teams
- Test player add/remove per team
- Test full submission flow with mock mutations
- Test validation on each step
- Test dialog close with unsaved data
- Test mobile responsiveness of dialog

## Related Files
- `src/components/SetupWizard/types.ts` — NEW
- `src/components/SetupWizard/SetupWizardContext.tsx` — NEW
- `src/components/SetupWizard/WizardStepper.tsx` — NEW
- `src/components/SetupWizard/steps/StepSelectTeams.tsx` — NEW
- `src/components/SetupWizard/steps/StepManageRosters.tsx` — NEW
- `src/components/SetupWizard/steps/StepCreateSeason.tsx` — NEW
- `src/components/SetupWizard/steps/StepConfigureTournament.tsx` — NEW
- `src/components/SetupWizard/steps/StepReview.tsx` — NEW
- `src/components/SetupWizard/SetupWizard.tsx` — NEW
- `src/components/SetupWizard/index.ts` — NEW

## Dependency
- Blocked by Ticket 15 (Convex functions for create team, player, season, seasonTeams, tournament)
- This ticket enables Ticket 18 (Dashboard & Homepage Integration)

## UI Patterns
- Use existing shadcn/ui components: Dialog, Button, Input, Select, Badge, Tabs, Separator, Card
- Use `cn()` utility from `@/lib/utils` for class merging
- Follow styling from existing `TournamentDialog` for form fields
- Use `useMutation` from `convex/react` for all database writes
- Use `useNavigate` from `@tanstack/react-router` for post-creation redirect
- Use `toast` from `sonner` for success/error notifications

## Notes
- The wizard uses `useReducer` for complex state — match the `WizardState` interface exactly
- New teams must be created first (before players) to get their IDs for player assignment
- Player creation needs to reference the correct team ID — map temp keys to real IDs after team creation
- Season status defaults to `"planning"` — user can change later
- Tournament status defaults to `"draft"` — bracket generation happens later
- The `canGoNext` check per step:
  - Step 1: at least 2 teams selected
  - Step 2: no validation (rosters are optional at this stage)
  - Step 3: name, sport, startDate, endDate all filled
  - Step 4: name, location filled
  - Step 5: always valid (just confirmation)
