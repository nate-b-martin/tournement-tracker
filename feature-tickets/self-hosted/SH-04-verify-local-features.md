# SH-04: Verify All App Features Work Locally

## Overview
End-to-end verification that the entire application works against the local self-hosted Convex backend with imported production data.

## Prerequisites
- SH-03 complete (data imported, backend running)
- Clerk development instance configured (or Clerk test mode)

## Implementation Steps

### Step 1: Start full dev stack

```bash
# Terminal 1: Convex backend
npm run convex:up

# Terminal 2: Frontend dev server
npm run dev
```

### Step 2: Verify Clerk authentication

- Open http://localhost:3000
- Sign in with Clerk (use existing test account)
- Verify user profile created in `userProfiles` table
- Verify role assigned (admin/organizer/player/spectator)

### Step 3: Test each major feature area

| Feature | Test Steps | Expected |
|---------|------------|----------|
| **Dashboard** | Load `/` | Stats cards, recent tournaments/teams/players |
| **Tournaments** | Load `/tournaments`, create/edit/delete | Full CRUD works |
| **Teams** | Load `/teams`, create/edit/delete, assign players | Full CRUD works |
| **Players** | Load `/players`, create/edit/delete, search | Full CRUD works |
| **Games** | Load tournament detail, view games | Games table loads |
| **Brackets** | Generate bracket for tournament | Bracket renders |
| **Seasons** | Load `/seasons`, create season, add teams | Full lifecycle works |
| **Schedule** | Generate schedule, view games | Schedule generates |
| **Standings** | Complete games, view standings | Standings calculate |
| **Fields** | Load `/fields`, CRUD | Full CRUD works |
| **Game Stats** | Enter stats for game | Stats save/display |

### Step 4: Verify real-time updates

- Open same page in two browser tabs
- Create/edit/delete in one tab
- Verify other tab updates within 1-2 seconds (WebSocket)

### Step 5: Verify RBAC

- Sign in as admin → all features accessible
- Sign in as organizer → tournament management accessible
- Sign in as player → read-only for own team/games
- Sign in as spectator → read-only everywhere

## Acceptance Criteria

- [ ] `npm run dev` starts without Convex connection errors
- [ ] All 11 routes accessible and functional
- [ ] All 14 Convex hooks return data (no "skip" or errors)
- [ ] Real-time updates work across tabs
- [ ] Clerk auth → userProfiles sync works
- [ ] RBAC enforced correctly for all roles
- [ ] No console errors in browser dev tools
- [ ] `npm run check` passes
- [ ] `npm run build` succeeds

## Edge Cases

- Clerk not configured in local dev — app shows unauthenticated state gracefully (per `useAuth.ts`)
- Network latency — local backend should be <10ms
- WebSocket connection drops — auto-reconnect works
- Large datasets — pagination works correctly

## Related Files

### Modified Files (Verification Only)
- `.env.local` — already configured in SH-02
- No code changes expected

## Testing

- Manual smoke test of all 11 routes
- Run existing test suite: `npm run test`
- Run E2E tests: `npm run test:e2e` (if configured for local)
- Test with 2 browser tabs for real-time verification