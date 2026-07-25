## Player Details Component TODOs

### In Progress
- [x] Create PLAYER_DETAILS_DESIGN.md design document
- [x] Create src/hooks/usePlayerById.ts hook
- [x] Create src/routes/players/$id/index.tsx route
- [ ] Update src/components/PlayersTable.tsx name click handlers for stats view

### Completed
- [x] Create comprehensive design documentation
- [x] Set up data fetching patterns
- [x] Implement error handling and loading states
- [x] Add admin RBAC (edit permissions)

### Next Steps
- Update PlayersTable.tsx to make stats view player names clickable
- Optionally update TeamsTable.tsx to add player links
- Test Player Details functionality
- Run linting and format

## Design References
- SEASON_DETAIL_DESIGN.md - primary pattern for detail pages
- PlayersTable.tsx - existing patterns for tables and pagination
- PlayerGameStatsDialog.tsx - re-used for stats display
- PlayerDialog.tsx - for editing
