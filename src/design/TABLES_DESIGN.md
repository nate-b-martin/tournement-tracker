# Data Table Implementation Plan

## Overview

This document outlines the implementation plan for Teams and Players data tables in the TanStack Tournament Tracker application. The tables will feature pagination, sorting, filtering, and detail views using shadcn's DataTable component built on TanStack Table.

## Objectives

- Implement Teams and Players tables in the dashboard
- Add pagination, sorting, and filtering capabilities
- Create detail views for individual teams and players
- Follow existing project patterns and conventions
- Ensure responsive design and accessibility

## Technical Stack

- **UI Framework**: shadcn/ui DataTable component
- **Table Engine**: TanStack Table (v8+)
- **Data Layer**: Convex queries
- **State Management**: Custom hooks with React hooks
- **Routing**: TanStack Router for detail navigation

## Phase 1: Convex Query Extensions

### Files to Modify/Crate

#### `convex/teams.ts`
- **Current**: Only has `count` function
- **Needed**: 
  - `list(args: ListArgs)` - Paginated team list with sorting/filtering
  - `getById(id: Id<"teams">)` - Single team for detail views
  - `search(query: string)` - Search functionality

#### `convex/players.ts`
- **Current**: Only has `count` function  
- **Needed**:
  - `list(args: ListArgs)` - Paginated player list with sorting/filtering
  - `getById(id: Id<"players">)` - Single player for detail views
  - `search(query: string)` - Search functionality

### Query Function Signatures

```typescript
type ListArgs = {
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  filtering?: {
    search?: string;
    status?: string[];
    tournamentId?: string;
  };
};
```

## Phase 2: Custom Hooks

### Files to Create

#### `src/hooks/useTeams.ts`
- Handles Teams data fetching with pagination/sorting/filtering
- Returns `{ data, isLoading, error, pagination, refetch }`
- Integrates with Convex queries
- Manages local state for search and filters

#### `src/hooks/usePlayers.ts`
- Handles Players data fetching with pagination/sorting/filtering
- Returns `{ data, isLoading, error, pagination, refetch }`
- Integrates with Convex queries
- Manages local state for search and filters

#### `src/hooks/useTableState.ts` (Optional)
- Shared table state management utilities
- Common pagination and sorting logic
- Debounced search functionality

### Hook Interface Example

```typescript
export function useTeams(options: {
  pageIndex?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string[];
}) {
  // Implementation with Convex queries
  // Return structured data for DataTable
}
```

## Phase 3: shadcn DataTable Integration

### Prerequisites
- Install `@tanstack/react-table`
- Add shadcn DataTable component: `bunx shadcn@latest add data-table`

### Components to Create

#### `src/components/ui/data-table.tsx`
- Base shadcn DataTable component
- Column visibility controls
- Search input handling
- Pagination controls
- Row selection (optional)

#### `src/components/TeamTable.tsx`
- Teams-specific DataTable implementation
- Column definitions for team data
- Team-specific filtering options
- Click handlers for detail navigation

#### `src/components/PlayerTable.tsx`
- Players-specific DataTable implementation  
- Column definitions for player data
- Player-specific filtering options
- Click handlers for detail navigation

## Phase 4: Detail Views

### Components to Create

#### `src/components/TeamDetails.tsx`
- Team detail modal or page
- Display all team information
- Show associated players
- Team statistics and recent games

#### `src/components/PlayerDetails.tsx`
- Player detail modal or page
- Display all player information
- Show team affiliation
- Player statistics and game history

### Navigation Options
1. **Modal Overlay**: Quick details without page navigation
2. **Dedicated Routes**: `/teams/:id` and `/players/:id`
3. **Hybrid**: Modal for quick view, route for full details

## Phase 5: Dashboard Integration

### File to Modify
- `src/routes/dashboard/index.tsx`

### Changes Required
- Remove current placeholder cards
- Add TeamsTable and PlayersTable components
- Layout for two tables (tabs or side-by-side)
- Loading and error states
- Responsive design considerations

### Dashboard Layout Structure
```
Dashboard
├── Header section (existing)
├── Teams Table Section
│   ├── Table with pagination/controls
│   ├── Search and filters
│   └── Export/Actions toolbar
└── Players Table Section
    ├── Table with pagination/controls  
    ├── Search and filters
    └── Export/Actions toolbar
```

## Phase 6: Route Implementation

### Files to Enhance
- `src/routes/teamspage/index.tsx` - Full teams page
- `src/routes/playerspage/index.tsx` - Full players page

### Route Features
- Full-screen table views
- Advanced filtering options
- Bulk operations (if needed)
- Export functionality
- Print-friendly layouts

## Table Specifications

### Teams Table Columns

| Column | Data Source | Features |
|--------|-------------|----------|
| Name | `teams.name` | Clickable for details |
| Coach Name | `teams.coachName` | Text |
| Coach Email | `teams.coachEmail` | Email link |
| Organization | `teams.organization` | Text (optional) |
| City | `teams.city` | Text (optional) |
| Status | `teams.status` | Badge with colors |
| Created Date | `teams.createdAt` | Formatted date |
| Actions | - | View Details button |

### Players Table Columns

| Column | Data Source | Features |
|--------|-------------|----------|
| Full Name | `players.firstName + lastName` | Clickable for details |
| Jersey Number | `players.jerseyNumber` | Number (optional) |
| Team Name | `teams.name` (via join) | Clickable to team |
| Email | `players.email` | Email link (optional) |
| Phone | `players.phone` | Text (optional) |
| Status | `players.status` | Badge with colors |
| Created Date | `players.createdAt` | Formatted date |
| Actions | - | View Details button |

## Features Implementation Details

### Pagination
- **Page Sizes**: 10, 25, 50, 100 items per page
- **Controls**: Previous/Next buttons, page numbers
- **Info**: "Showing X to Y of Z results"

### Sorting
- **Multi-column**: Sort by name, date, status
- **Indicators**: Visual arrows showing sort direction
- **Default**: Created date descending

### Filtering
- **Global Search**: Search across name, email, organization
- **Status Filter**: Filter by active/inactive/suspended
- **Team Filter**: For players, filter by specific team
- **Debounced**: Search input debounced to prevent excessive queries

### Detail Views
- **Modal vs Route**: Modal for quick view, route for full details
- **Related Data**: Show relationships (players↔teams)
- **Actions**: Edit, delete, export options in detail view

## Responsive Design

### Breakpoint Behavior
- **Mobile (< sm)**: Stacked cards view with minimal info
- **Small (sm)**: Simplified table with essential columns only
- **Medium (md)**: Full table with horizontal scroll
- **Large (lg+)**: Complete table with all columns

### Mobile Considerations
- Horizontal scrolling for wide tables
- Collapsible columns on small screens
- Touch-friendly pagination controls
- Simplified filter interface

## File Structure

```
src/
├── hooks/
│   ├── useTeams.ts
│   ├── usePlayers.ts
│   └── useTableState.ts
├── components/
│   ├── TeamTable.tsx
│   ├── PlayerTable.tsx
│   ├── TeamDetails.tsx
│   ├── PlayerDetails.tsx
│   └── ui/
│       └── data-table.tsx
├── routes/
│   ├── dashboard/index.tsx (modified)
│   ├── teamspage/index.tsx (enhanced)
│   └── playerspage/index.tsx (enhanced)
└── design/
    └── TABLES_DESIGN.md (this file)

convex/
├── teams.ts (enhanced)
└── players.ts (enhanced)
```

## Implementation Priorities

### Phase 1 (Core Tables)
1. Convex query extensions
2. Basic Teams table with pagination
3. Basic Players table with pagination
4. Dashboard integration

### Phase 2 (Enhanced Features)
1. Sorting functionality
2. Search and filtering
3. Detail views (modals)
4. Error handling and loading states

### Phase 3 (Polish)
1. Full route implementation
2. Advanced filtering
3. Export functionality
4. Mobile responsive design

## Success Metrics

- **Performance**: Table loads within 500ms with 1000+ records
- **UX**: Intuitive pagination and search with clear feedback
- **Accessibility**: Keyboard navigation and screen reader support
- **Code Quality**: Reusable hooks and components
- **Maintainability**: Clear separation of concerns

## Questions for Implementation

1. **Detail View Navigation**: Modal overlay or dedicated routes?
2. **Default Page Size**: Start with 10, 25, or 50 items?
3. **Data Relationships**: Show related data in detail views?
4. **Bulk Operations**: Need multi-select actions?
5. **Export Format**: CSV, Excel, or both?
6. **Empty States**: Custom illustrations or simple messages?

---

**Next Steps**: Begin with Phase 1 implementation starting with Convex query extensions and basic table components.