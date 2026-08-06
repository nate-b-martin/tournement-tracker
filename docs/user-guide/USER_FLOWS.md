# User Flows

## Overview

The TanStack Tournament Tracker serves four user roles. Each role has a distinct set of flows through the application. Below are the primary flows for each role.

---

## Admin Flow

### 1. First-Time Setup (Using the Setup Wizard)
```
Sign In (auto-promoted to Admin)
  → Dashboard (/dashboard) — see overview stats
  → Click "Setup Season" to launch the Setup Wizard
    Step 1 — Select Teams: Search existing teams or create new ones (min 2)
    Step 2 — Manage Rosters: Add players to each selected team
    Step 3 — Create Season: Set name, sport, date range
    Step 4 — Configure Tournament: Auto-filled from season, set bracket/fields/duration
    Step 5 — Review & Create: Summary of all entities, click "Create All"
      → Teams, players, season, tournament created sequentially
      → Season appears at /seasons/<id>
      → Bracket generation happens later
```

### 2. Full Tournament Lifecycle
```
Dashboard → View stats for teams, players, tournaments
  → Use Setup Wizard for complete season setup (recommended)
    → Or create entities individually:
      → Tournaments → Create Tournament
        → Set name, sport, location, dates, bracket type, fields
    → Tournament appears in list with "draft" status
    → Open Tournament Detail (/tournaments/<id>)
      → Teams tab → Add Team → Fill in coach + team info
      → Fields tab → Configure game fields
      → Once ready: change status to "registration_open"
      → Schedule Games → Generate bracket
      → Games tab → Enter scores as games complete
      → Standings tab → View computed standings
      → Bracket tab → Visual bracket updates in real-time
    → Mark tournament "complete" when finished
```

### 3. Season Management (Schedule & Standings)
```
Create season via Setup Wizard or manually
  → Open Season Detail (/seasons/<id>)
    → Overview tab — view season info and team cards
    → Schedule tab — view/manage regular season games
      → (Admin) Click "Add Game" → SeasonGameDialog
        → Select home/away teams (must differ)
        → Set date, location, status
        → Game appears in table with Date, Home, Away, Score, Location, Status
      → Edit: click pencil icon → update scores, status, date
      → Delete: click trash icon → confirm deletion
      → Filter by All/Scheduled/Completed
      → Search by team name
    → Standings tab — view computed W/L/T records
      → Columns: #, Team, GP, W, L, T, Win %, PF, PA, +/-
      → Top 2 rows highlighted green
      → Only completed games contribute
      → Win % = "-" for teams with 0 games
```

### 4. User Management
```
Navigate to any page
  → Non-admin users see yellow spectator banner
  → (Future: Admin panel to change user roles)
```

---

## Organizer Flow

### 1. Tournament Management
```
Sign In
  → Tournaments (/tournamentspage)
    → Browse active/upcoming tournaments
    → Click into tournament for detail view
      → Teams tab — view registered teams, roster sizes
      → Games tab — view scheduled games, enter scores
      → Bracket tab — view bracket visualization
      → Standings tab — view team standings
      → Fields tab — view field assignments
```

### 2. Game Day Operations
```
Open tournament detail → Games tab
  → View scheduled games with field/time
  → As games progress: update status (in_progress → completed)
  → Enter scores for completed games
  → Bracket auto-updates with results
  → Standings recalculate in real-time
```

---

## Player Flow

### 1. Team Participation
```
Sign In
  → Teams (/teamspage) — view your team
  → (Future: Join team, update roster)
```

### 2. View Stats & Schedule
```
Open tournament detail
  → Games tab — view your team's upcoming/previous games
  → Bracket tab — see tournament progress
  → Standings tab — see team rankings
```

---

## Spectator Flow

### 1. Browse Content
```
No sign-in required for public pages:
  → Home (/) — see total counts for teams, players, tournaments
  → Players (/playerspage) — browse all players
  → Teams (/teamspage) — browse all teams
  → Seasons (/seasonspage) — browse all seasons
  → Season Detail (/seasons/<id>) — view season info, schedule, standings
    → Overview tab — view season details and team cards
    → Schedule tab — view regular season games (read-only)
    → Standings tab — view computed standings
  → Tournaments (/tournamentspage) — browse tournaments
  → Games (/gamespage) — browse scheduled games
  → Tournament Detail (/tournaments/<id>) — view full tournament info
    → Teams tab — view registered teams
    → Games tab — view schedule and results
    → Bracket tab — view bracket visualization
    → Standings tab — view standings
    → Fields tab — view field assignments

Sign In (if you have an account):
  → Dashboard (/dashboard) — overview stats (read-only)
  → YELLOW BANNER indicates read-only mode
```

---

## Entity Relationship Flow

```
Season
  ├── SeasonTeams (teams participating in season)
  │   └── Teams → Players
  ├── SeasonGames (regular season games)
  │   ├── Home Team (Doc<"teams"> joined)
  │   └── Away Team (Doc<"teams"> joined)
  └── Tournament (linked via seasonId FK)
      ├── Teams (registered via tournament)
      │   └── Players (rostered on teams)
      ├── Games (scheduled within tournament)
      │   └── GameStats (per-player stats per game)
      ├── Fields (assigned to tournament)
      └── Bracket (derived from games and bracketType)
```

---

## State Transitions

### Tournament Status Flow
```
Draft → Registration Open → Registration Closed → Active → Complete
```
- **Draft**: Being configured, not visible to public
- **Registration Open**: Teams can register
- **Registration Closed**: Rosters locked
- **Active**: Games in progress
- **Complete**: Tournament finished

### Game Status Flow
```
Scheduled → In Progress → Completed
                   ↓
              Postponed → Scheduled
              Cancelled (terminal)
```

### Player Status
```
Active → Inactive (left team)
Active → Injured (temporary)
```

### Team Status
```
Active → Inactive (team disbanded)
Active → Suspended (disciplinary)
```
