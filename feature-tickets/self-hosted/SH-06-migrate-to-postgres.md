# SH-06: Configure POSTGRES_URL, Migrate Data

## Overview
Migrate existing SQLite data to the new PostgreSQL backend. Since this is a fresh PostgreSQL instance, we'll re-import the Convex Cloud backup.

## Prerequisites
- SH-05 complete (PostgreSQL running, backend connected)
- Convex Cloud backup from SH-03 (`convex-cloud-backup.zip`)

## Implementation Steps

### Step 1: Clean start with PostgreSQL

```bash
# Stop and remove volumes (SQLite data)
npm run convex:down -v

# Start with PostgreSQL
npm run convex:up
# Wait for both health checks (postgres + backend)
```

### Step 2: Generate new admin key (new instance)

```bash
npm run convex:admin-key > admin-key/admin_key_$(date +%Y%m%d_%H%M%S).md
```

### Step 3: Update `.env.local` with new admin key

```bash
# Edit .env.local with new key
CONVEX_SELF_HOSTED_ADMIN_KEY=<new-admin-key>
```

### Step 4: Import Convex Cloud backup to PostgreSQL

```bash
npx convex import --replace-all convex-cloud-backup.zip
```

### Step 5: Deploy functions to new backend

```bash
npx convex dev --once
```

### Step 6: Verify all data in PostgreSQL

```bash
# Check row counts
npx convex run tournaments:count
npx convex run teams:count
npx convex run players:count
npx convex run games:count
npx convex run seasons:count
npx convex run seasonGames:count
npx convex run seasonTeams:count
npx convex run userProfiles:count
npx convex run fields:count
npx convex run gameStats:count
```

### Step 7: Verify in dashboard

- Open http://localhost:6791 with new admin key
- Verify all tables have correct row counts
- Spot-check data integrity

## Acceptance Criteria

- [ ] PostgreSQL backend starts cleanly (no SQLite)
- [ ] New admin key generated and saved
- [ ] Import completes without errors
- [ ] All 10 table row counts match Convex Cloud
- [ ] Dashboard shows all data correctly
- [ ] `npm run dev` works with PostgreSQL backend
- [ ] Data persists across `npm run convex:down && npm run convex:up`

## Edge Cases

- Import may take longer with PostgreSQL (network latency)
- Schema must match exactly — run `npx convex dev --once` before import if schema changed
- `_creationTime` and `_id` preserved — relationships intact

## Related Files

### Modified Files
- `.env.local` (new admin key)

### New Files
- `admin-key/admin_key_<timestamp>.md` (new key)

## Testing

- Full verification per SH-04 against PostgreSQL backend
- Restart test: `npm run convex:down && npm run convex:up` → verify data intact
- Run `npm run test` — all tests pass