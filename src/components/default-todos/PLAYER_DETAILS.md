## Player Details Component TODOs

### Completed
- [x] Create PLAYER_DETAILS_DESIGN.md design document
- [x] Create src/hooks/usePlayerById.ts hook
- [x] Create src/routes/players/$id/index.tsx route
- [x] Create src/components/PlayerDetails.tsx component
- [x] Update src/components/PlayersTable.tsx name click handlers (contact + stats views)
- [x] Update src/components/TeamRosterDialog.tsx with player name links
- [x] Add unit tests (tests/unit/components/PlayerDetails.test.tsx)
- [x] Implement error handling and loading states
- [x] Add admin RBAC (edit permissions)

### Next Steps
- Test Player Details functionality (E2E)
- Run linting and format

## Design References
- SEASON_DETAIL_DESIGN.md - primary pattern for detail pages
- PlayersTable.tsx - existing patterns for tables and pagination
- PlayerGameStatsDialog.tsx - re-used for stats display
- PlayerDialog.tsx - for editing
