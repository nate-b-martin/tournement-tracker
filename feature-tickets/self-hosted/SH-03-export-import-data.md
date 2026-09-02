# SH-03: Export Convex Cloud Data, Import to Local

## Overview
Export all data from Convex Cloud and import it into the local self-hosted backend to preserve existing tournament, team, player, and game data.

## Prerequisites
- SH-02 complete (local backend running, admin key configured)
- Access to Convex Cloud dashboard for the project

## Implementation Steps

### Step 1: Export data from Convex Cloud

```bash
# Ensure you're logged into Convex Cloud
npx convex auth login

# Export all data
npx convex export --path convex-cloud-backup.zip
```

### Step 2: Verify export contents

```bash
# List contents
unzip -l convex-cloud-backup.zip
# Should show: tables/, functions/, schema.json, etc.
```

### Step 3: Import to local self-hosted backend

```bash
# Ensure local backend is running
npm run convex:up

# Import with replace-all (destroys local data, replaces with cloud data)
npx convex import --replace-all convex-cloud-backup.zip
```

### Step 4: Verify import

```bash
# Check row counts match
npx convex run tournaments:count
npx convex run teams:count
npx convex run players:count
npx convex run games:count
npx convex run seasons:count
npx convex run seasonGames:count
npx convex run userProfiles:count
```

### Step 5: Verify in dashboard

- Open http://localhost:6791
- Navigate to each table
- Verify row counts and data integrity

## Acceptance Criteria

- [ ] `convex-cloud-backup.zip` created successfully (~1-10MB depending on data)
- [ ] Import completes without errors
- [ ] All 9 table row counts match between cloud and local
- [ ] Dashboard shows all tables with correct data
- [ ] Relationships intact (tournament→teams, teams→players, etc.)
- [ ] User profiles with Clerk IDs preserved

## Edge Cases

- Large exports (>100MB) — may need `--batch-size` flag
- Schema mismatches — ensure local schema matches cloud before import
- Clerk user IDs in `userProfiles` and `players.userId` — must match for auth to work
- `_creationTime` timestamps — preserved in export/import

## Related Files

### New Files
- `convex-cloud-backup.zip` (temporary, gitignored)

### Modified Files
- None (data only)

## Testing

- Compare row counts: `npx convex run <table>:count` before/after
- Spot-check 5-10 records per table in dashboard
- Run `npm run dev` and verify app loads with real data