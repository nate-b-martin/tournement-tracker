# SH-02: Generate Admin Key, Configure .env.local

## Overview
Generate an admin key for the self-hosted Convex backend and configure the frontend to connect to it via `.env.local`.

## Prerequisites
- SH-01 complete (docker-compose running)

## Implementation Steps

### Step 1: Generate admin key

```bash
npm run convex:up
# Wait for health check (15-20s)
npm run convex:admin-key
```

Output format:
```
Admin key: <base64-string>
```

### Step 2: Save admin key to secure location

Create `admin-key/` directory (gitignored):
```bash
mkdir -p admin-key
npm run convex:admin-key > admin-key/admin_key_$(date +%Y%m%d_%H%M%S).md
```

### Step 3: Create `.env.local` for frontend

```bash
# .env.local (gitignored)
VITE_CONVEX_URL=http://127.0.0.1:3210
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=<your-admin-key-from-step-1>
```

### Step 4: Verify CLI works with self-hosted backend

```bash
# Test convex CLI against local backend
npx convex dev --once
```

Should output:
```
Deployed to http://127.0.0.1:3210
Functions: tournaments, teams, players, games, ...
```

## Acceptance Criteria

- [ ] Admin key generated and saved to `admin-key/` directory
- [ ] `.env.local` created with correct `VITE_CONVEX_URL` and `CONVEX_SELF_HOSTED_ADMIN_KEY`
- [ ] `npx convex dev --once` deploys functions successfully
- [ ] Dashboard at http://localhost:6791 accepts admin key and shows tables
- [ ] Convex functions visible in dashboard (tournaments, teams, players, games, etc.)

## Edge Cases

- Admin key contains special characters — ensure proper escaping in `.env.local`
- Multiple developers — each generates their own key
- Key rotation — document process for regenerating

## Related Files

### New Files
- `admin-key/admin_key_<timestamp>.md` (gitignored)
- `.env.local` (gitignored)

### Modified Files
- None (reads existing convex functions)

## Testing

- Open dashboard, enter admin key, verify tables visible
- Run `npx convex dev --once` — no errors
- Run `npm run dev` — frontend loads without Convex connection errors