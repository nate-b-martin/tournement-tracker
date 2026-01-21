# Homepage Design Proposal (Revised)

## Overview

Single-admin, self-hosted tournament tracker focused on team management with a clean, dashboard-style interface.

### Design Goals
- Simple, modern interface using TailwindCSS and shadcn/ui
- Efficient workflow for admin (single user)
- Team management as primary feature
- Responsive (laptop-first, mobile-friendly)
- Clean, functional dashboard layout
- No hero section - immediate data access

### Typography
- **Headers**: Orbitron (tech, modern feel)
- **Body**: Inter (clean, readable)

---

## Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Logo]  Tournament Tracker                          [User] [Settings]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  QUICK STATS                                                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                        │
│  │ TEAMS      │  │ TOURNAMENTS│  │ PLAYERS    │                        │
│  │ 4          │  │ 2 Active   │  │ 16         │                        │
│  └────────────┘  └────────────┘  └────────────┘                        │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ YOUR TEAMS                                  [+ Add Team]        │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │ Name           Players    Status        Actions                 │    │
│  │ ─────────────────────────────────────────────────────────────   │    │
│  │ Red Dragons    5/5       [Active]       [Edit] [Delete]         │    │
│  │ Blue Knights   4/5       [Draft]        [Edit] [Delete]         │    │
│  │ Green Goblins  3/5       [Active]       [Edit] [Delete]         │    │
│  │ Yellow Yetis   5/5       [Draft]        [Edit] [Delete]         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ RECENT TOURNAMENTS                                             │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │ Name              Status      Teams      Actions               │    │
│  │ ─────────────────────────────────────────────────────────────   │    │
│  │ Winter Cup 2025   Active      4/8       [Manage]               │    │
│  │ Summer Showdown   Draft       0/8       [Edit] [Delete]        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Section Breakdown

### 1. Header (Top-only Navigation)
- **Logo**: Tournament Tracker (left-aligned)
- **Navigation Links**: Dashboard, Teams, Tournaments, Players
- **Right side**: User menu dropdown, Settings icon
- **No hamburger menu** - direct navigation visible at all times

### 2. Quick Stats Bar
Three compact card components displaying:
- **Teams**: Total count (e.g., 4)
- **Tournaments**: Active count (e.g., 2 Active)
- **Players**: Total count (e.g., 16)

### 3. Teams Section
- **Header**: "Your Teams" with `[+ Add Team]` button
- **Content**: Table listing all teams with columns:
  - Team Name
  - Players (e.g., "5/5" showing current/max)
  - Status badge (Active, Draft, etc.)
  - Actions: `[Edit]` `[Delete]`

### 4. Tournaments Section
- **Header**: "Recent Tournaments"
- **Content**: Table with columns:
  - Tournament Name
  - Status badge (Active, Draft, Completed)
  - Teams (e.g., "4/8")
  - Actions: `[Manage]` `[Edit]` `[Delete]`

---

## Technical Implementation

### Tech Stack
- **Framework**: TanStack Router + React
- **Styling**: TailwindCSS
- **Components**: shadcn/ui
- **Icons**: Lucide React

### Typography
Add to CSS:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700&display=swap');
```

Classes:
- Headers: `font-orbitron`
- Body: `font-inter`

### Color Palette
```css
:root {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.141 0.005 285.823);
  --card-foreground: oklch(0.985 0 0);
  --card-border: oklch(0.274 0.006 286.033);
  --primary: oklch(0.488 0.243 264.376); /* Purple */
  --accent: oklch(0.6 0.118 184.704); /* Teal */
  --warning: oklch(0.828 0.189 84.429); /* Orange */
}
```

### shadcn/ui Components Required
- `Button` - CTAs and action buttons
- `Card` - Stats cards, section containers
- `Table` - Team and tournament lists
- `Badge` - Status indicators
- `DropdownMenu` - User menu, settings

### Layout Classes (Tailwind)
- Container: `max-w-7xl mx-auto px-6`
- Grid system: `grid grid-cols-1 md:grid-cols-3 gap-4`
- Spacing: `gap-6` between sections
- Cards: `bg-card border border-card-border rounded-lg`

---

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 640px) | Single column, stacked sections, scrollable tables |
| Tablet (640-1024px) | 2-column grid for stats |
| Desktop (> 1024px) | Full width, three-column stats grid |

---

## Implementation Priority

1. **Phase 1**: Foundation - Fonts, CSS variables, Card component styling
2. **Phase 2**: Header - Top-only navigation component
3. **Phase 3**: Homepage - Dashboard layout with stats + tables
4. **Phase 4**: Sub-pages - Teams, Tournaments, Players pages
5. **Phase 5**: Polish - Hover states, transitions, responsive tweaks

---

## Notes

- Admin-only system - no authentication UI complexity needed
- Team management is primary feature - prominent in dashboard
- Clean borders, no heavy shadows
- Subtle status badges with consistent colors (purple, teal, orange)
- No hero section - immediate data access for efficiency
- Self-hosted badge can appear in footer or user menu
