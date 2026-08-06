# Navigation Guide

## Getting Around

The app uses a slide-out sidebar for navigation. Open it by clicking the **hamburger menu** (☰) in the top-left corner.

## Sidebar Menu

```
┌──────────────────────────────┐
│  Navigation                  │
│  ─────────────────────────── │
│  🏠 Home                     │
│  📊 Dashboard                │
│  👥 Players                  │
│  🏆 Teams                    │
│  📅 Tournaments              │
│  🎮 Games                    │
│                              │
│  ─────────────────────────── │
│  🔐 Sign In / 👤 User        │
└──────────────────────────────┘
```

| Menu Item | Route | Description |
|-----------|-------|-------------|
| **Home** | `/` | Landing page with stat cards (team count, player count, tournament count) |
| **Dashboard** | `/dashboard` | Protected overview with stat cards + Players + Tournaments tables |
| **Players** | `/playerspage` | Browse all players with search, filter, sort, pagination |
| **Teams** | `/teamspage` | Browse all teams with search, filter by status |
| **Tournaments** | `/tournamentspage` | Browse tournaments, create new ones, edit/delete |
| **Games** | `/gamespage` | Browse scheduled games with status filters |

## Breadcrumbs

The app does not currently have breadcrumb navigation. Use the sidebar to jump between sections.

## Tournaments Detail View

Clicking a tournament name in the Tournaments table takes you to its detail page (`/tournaments/<id>`), which has tabs:

```
┌──────────────────────────────────────────┐
│ Tournament Name                [Edit]    │
│ [Sport] [Status] [2/8 Teams]  [Schedule] │
│                                          │
│ [Teams] [Games] [Bracket] [Standings] [Fields] │
└──────────────────────────────────────────┘
```

| Tab | Shows |
|-----|-------|
| **Teams** | Registered teams in a card grid. "Add Team" button (admin). |
| **Games** | Scheduled/completed games for this tournament. |
| **Bracket** | Visual bracket display (single/double elimination or round robin). |
| **Standings** | Team standings computed from game results. |
| **Fields** | Configured fields for this tournament. |

## Mobile Navigation

- The sidebar slides in from the left, overlaying content
- Tap the hamburger icon to open
- Tap the X or tap a link to close
- The sidebar is 320px wide with a dark overlay

## Keyboard Navigation

- **Tab**: Move between interactive elements
- **Enter/Space**: Activate buttons and links
- Links have visible focus states
- Dialogs are focus-trapped (Tab cycles within the dialog)
- **Escape**: Close dialogs and the sidebar menu

## Common UI Patterns

| Pattern | What It Looks Like | Where |
|---------|-------------------|-------|
| **Stat Card** | Number + label in a bordered card | Home, Dashboard |
| **Data Table** | Sortable columns, search box, filter chips, pagination | Players, Teams, Tournaments, Games |
| **Badge** | Small colored label (e.g., "Active", "Completed") | Tournament cards, detail pages |
| **Dialog** | Modal form overlay for creating/editing | All entities |
| **Toast** | Brief notification at bottom-right | After create/edit/delete actions |
| **Filter Chip** | Clickable status label (e.g., "Active", "Inactive") | Above data tables |
| **Pagination** | "Page 1 of 5" with Previous/Next | Below data tables |

## Responsive Layout

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 768px) | Single column, stacked cards, sidebar overlays |
| Tablet (768px - 1024px) | 2-column grids, sidebar remains slide-out |
| Desktop (> 1024px) | 3-column grids where applicable, full-width tables |

- Containers use `max-w-7xl mx-auto px-6` for consistent width
- Tables scroll horizontally on mobile
- Tournament detail tabs wrap on smaller screens
