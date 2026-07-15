# Queries & Mutations Reference

## Overview

All Convex functions live in `convex/*.ts` and are auto-deployed by `npx convex dev`. Each file exports queries (read) and mutations (write). Generated API bindings in `convex/_generated/` make these callable from the frontend as `api.<file>.<functionName>`.

## File: `convex/tournaments.ts`

### Queries

| Function | Args | Return Type | Auth | Description |
|----------|------|-------------|------|-------------|
| `count` | `{}` | `number` | None | Total tournament count |
| `list` | `pagination?`, `sorting?`, `filtering?` (search, status, sport) | `{ data, totalCount }` | None | Paginated list with search, status/sport filter, multi-field sort |
| `getById` | `id: Id<"tournaments">` | `Doc<"tournaments"> \| null` | None | Single tournament by ID |

### Mutations

| Function | Key Args | Auth | Notes |
|----------|----------|------|-------|
| `create` | name, sport, location, maxTeams, minTeams, bracketType, fieldsAvailable, gameDuration, breakBetweenGames, seedingType, etc. | Required (`identity.subject` stored as organizerId) | Auto-sets `currentTeamCount: 0`, `status: "draft"`, timestamps |
| `update` | `id`, partial fields | Required | Patches only provided fields, updates `updatedAt` |
| `remove` | `id` | Required | Deletes document |

---

## File: `convex/teams.ts`

### Queries

| Function | Args | Return Type | Auth | Notes |
|----------|------|-------------|------|-------|
| `count` | `{}` | `number` | None | Total team count |
| `list` | `pagination?`, `sorting?`, `filtering?` (search, status, tournamentId) | `{ teams, totalCount }` | None | Joins player counts per team, search across name/coach/email/organization |

### Mutations

| Function | Key Args | Auth | Notes |
|----------|----------|------|-------|
| `create` | tournamentId, name, coachName, coachEmail, coachPhone, status?, etc. | Required | Auto-sets `createdAt`, `updatedAt`, default status `active` |
| `update` | `id`, partial fields | Required | Updates `updatedAt` |
| `remove` | `id` | Required | Also unlinks all players on the team (sets `teamId` to undefined) |

---

## File: `convex/players.ts`

### Queries

| Function | Args | Return Type | Auth | Notes |
|----------|------|-------------|------|-------|
| `count` | `{}` | `number` | None | Total player count |
| `list` | `pagination?`, `sorting?`, `filtering?` (search, status, teamId) | `{ data, totalCount, hasMore }` | None | Joins team data per player. Supports `fullName` sort field. |
| `getById` | `id: Id<"players">` | `PlayerWithTeam \| null` | None | Single player with team info |
| `search` | `query: string` | `PlayerWithTeam[]` | None | Full-text search on firstName, lastName, email |
| `countByTeam` | `teamId: Id<"teams">` | `number` | None | Player count for a specific team |

### Mutations

| Function | Key Args | Auth | Notes |
|----------|----------|------|-------|
| `create` | firstName, lastName, teamId?, jerseyNumber?, email?, etc. | Required | Auto-sets `userId` from identity, `isCaptain: false`, `status: "active"` |
| `update` | `id`, partial fields | Required | Patches player data |
| `remove` | `id` | Required | Deletes player document |
| `removeFromTeam` | `id` | Required | Sets `teamId` to undefined (unlinks from team) |
| `bulkAssignToTeam` | `playerIds: Id<"players">[]`, `teamId: Id<"teams">` | Required | Assigns multiple players to a team in one call |

---

## File: `convex/games.ts`

### Queries

| Function | Args | Return Type | Auth | Notes |
|----------|------|-------------|------|-------|
| `count` | `tournamentId?` | `number` | None | Count with optional tournament filter |
| `list` | `pagination?`, `sorting?`, `filtering?` (status, round, tournamentId) | `{ data, totalCount, hasMore }` | None | Joins team1, team2, winner data for each game |
| `getByTournament` | `tournamentId: Id<"tournaments">` | `GameWithTeams[]` | None | All games for a tournament with team joins |

### Mutations

| Function | Key Args | Auth | Notes |
|----------|----------|------|-------|
| `create` | tournamentId, round, gameNumber, team1Id, team2Id, scheduledTime?, fieldId? | Required | Default status `scheduled` |
| `update` | `id`, score/winner/status/time/field | Required | Patches game data |
| `remove` | `id` | Required | Also deletes all `gameStats` linked to the game |

---

## File: `convex/fields.ts`

### Queries

| Function | Args | Return Type | Auth | Notes |
|----------|------|-------------|------|-------|
| `count` | `tournamentId?` | `number` | None | Count with optional tournament filter |
| `list` | `pagination?`, `sorting?`, `filtering?` (search, status, tournamentId) | `{ data, totalCount, hasMore }` | None | Search on name and location |
| `getByTournament` | `tournamentId` | `Doc<"fields">[]` | None | Fetches all fields for a tournament |
| `listByTournament` | `tournamentId` | `Doc<"fields">[]` | None | (Same as getByTournament — alias for convenience) |

### Mutations

| Function | Key Args | Auth | Notes |
|----------|----------|------|-------|
| `create` | tournamentId, name, location?, status? | Required | Default status `available` |
| `update` | `id`, name?, location?, status? | Required | Patches field data |
| `remove` | `id` | Required | **Blocks** if field is assigned to any games. Must unassign games first. |

---

## File: `convex/gameStats.ts`

### Queries

| Function | Args | Return Type | Auth | Notes |
|----------|------|-------------|------|-------|
| `getByGame` | `gameId: Id<"games">` | `(GameStat + player)[]` | None | All stats for a game, with player info joined |
| `getByPlayer` | `playerId: Id<"players">` | `(GameStat + game)[]` | None | All stats for a player, with game info joined |

### Mutations

| Function | Key Args | Auth | Notes |
|----------|----------|------|-------|
| `upsert` | gameId, playerId, gamesPlayed?, atBats?, hits?, singles?, doubles?, triples?, homeRuns?, rbi? | Required | **Insert or update** — finds existing stat row by gameId+playerId. If found, patches; if not, inserts with defaults. |

---

## File: `convex/playerStats.ts`

### Queries

| Function | Args | Return Type | Auth | Notes |
|----------|------|-------------|------|-------|
| `count` | `filtering?` (search, status, teamId) | `number` | None | Count of players with filtered aggregate stats |
| `list` | `pagination?`, `sorting?`, `filtering?` (search, status, teamId) | `{ data, totalCount, hasMore }` | None | **Aggregated stats**: joins all gameStats per player, sums totals, computes `battingAverage = hits / atBats`. Sorts numeric fields correctly. |

### Computed Fields on `list`

| Field | Formula |
|-------|---------|
| `gamesPlayed` | `SUM(gameStats.gamesPlayed)` |
| `atBats` | `SUM(gameStats.atBats)` |
| `hits` | `SUM(gameStats.hits)` |
| `singles` | `SUM(gameStats.singles)` |
| `doubles` | `SUM(gameStats.doubles)` |
| `triples` | `SUM(gameStats.triples)` |
| `homeRuns` | `SUM(gameStats.homeRuns)` |
| `rbi` | `SUM(gameStats.rbi)` |
| `battingAverage` | `hits / atBats` (0 if no at-bats) |

**No mutations** — playerStats is read-only. Stats are managed through `gameStats.upsert`.

---

## File: `convex/userProfiles.ts`

### Queries

| Function | Args | Return Type | Auth | Notes |
|----------|------|-------------|------|-------|
| `getCurrentUser` | `userId: string` (Clerk ID) | `UserProfile \| null` | None | Fetches profile via `by_userId` index |
| `getUserRole` | `userId: string` (Clerk ID) | `Role \| null` | None | Just the role field |
| `getIsFirstUser` | `{}` | `boolean` | None | `true` if no userProfiles exist |

### Mutations

| Function | Key Args | Auth | Notes |
|----------|----------|------|-------|
| `createUserProfile` | userId, email?, displayName? | Required (must match own userId) | **First user auto-promotes to `admin`**, subsequent users default to `spectator`. Rejects if profile exists. |
| `updateUserRole` | userId, newRole | Required (caller must be admin) | Only admins can change roles. Validates caller's role via `by_userId` index. |

---

## Auth Pattern Summary

Every mutation follows the same auth guard pattern:

```typescript
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Unauthorized");
```

Queries are generally **unauthenticated** (public read). Some mutations also enforce specific role checks (`updateUserRole` requires admin, `createUserProfile` requires self-only).

## Cascade / Side Effects

| Mutation | Side Effects |
|----------|-------------|
| `teams.remove` | Unlinks all players: sets `player.teamId = undefined` |
| `games.remove` | Deletes all `gameStats` with matching `gameId` |
| `fields.remove` | **Blocks** if field has linked games |
| `players.removeFromTeam` | Sets `player.teamId = undefined` (does not delete player) |
| `players.bulkAssignToTeam` | Patches `teamId` on multiple player documents |
