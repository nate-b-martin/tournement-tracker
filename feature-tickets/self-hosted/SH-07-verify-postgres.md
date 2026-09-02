# SH-07: Verify Data Integrity, Performance

## Overview
Comprehensive verification that the PostgreSQL backend matches SQLite functionality and meets performance expectations.

## Prerequisites
- SH-06 complete (data migrated to PostgreSQL)

## Implementation Steps

### Step 1: Functional parity verification

Run the full test suite against PostgreSQL backend:

```bash
npm run test
npm run test:e2e  # If configured for local
```

### Step 2: Data integrity checks

```bash
# Verify referential integrity
npx convex run "db:query" '{
  "table": "teams",
  "filter": {"tournamentId": {"exists": false}}
}'

# Verify all foreign keys resolve
npx convex run "db:query" '{
  "table": "players",
  "filter": {"teamId": {"exists": true}}
}'
```

### Step 3: Performance benchmarks

```bash
# Query latency test (run 10x, average)
for i in {1..10}; do
  time npx convex run tournaments:list '{"pagination":{"pageIndex":0,"pageSize":50}}'
done

# Mutation latency test
for i in {1..10}; do
  time npx convex run teams:create '{"tournamentId":"...","name":"Perf Test","coachName":"Test","coachEmail":"test@test.com","coachPhone":"123"}'
done
```

Expected: <50ms p99 for queries, <100ms p99 for mutations (local)

### Step 4: Concurrent connection test

```bash
# Simulate 10 concurrent users
for i in {1..10}; do
  (npm run dev &) &
done
wait
```

### Step 5: Real-time subscription stress test

- Open 5 browser tabs to same tournament page
- Create games in one tab
- Verify all 5 tabs receive updates within 500ms

### Step 6: Backup/restore verification

```bash
# Export from PostgreSQL backend
npx convex export --path postgres-backup.zip

# Verify export size reasonable
ls -lh postgres-backup.zip

# Import to fresh instance (optional, separate test)
```

## Acceptance Criteria

- [ ] All existing tests pass (`npm run test`)
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] Query latency <50ms p99 (local)
- [ ] Mutation latency <100ms p99 (local)
- [ ] 10 concurrent users handled without errors
- [ ] Real-time updates <500ms across 5 tabs
- [ ] Export/import works with PostgreSQL
- [ ] No data corruption or missing relationships
- [ ] Memory usage stable (<500MB for backend)

## Edge Cases

- Large tournament with 100+ teams — pagination works
- Complex bracket generation — completes <5s
- Season schedule with 50+ games — generates correctly
- WebSocket reconnection after backend restart

## Related Files

### Modified Files
- None (verification only)

## Testing

- Run full test suite
- Manual performance spot-checks
- Document any regressions vs SQLite