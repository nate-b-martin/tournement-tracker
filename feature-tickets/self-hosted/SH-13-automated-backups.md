# SH-13: Automated Backups (pg_dump + convex export)

## Overview
Set up automated daily backups of both PostgreSQL data and Convex export for disaster recovery.

## Prerequisites
- Phase 3 complete (production running with PostgreSQL)
- Storage destination (S3, Backblaze B2, local with rotation, etc.)

## Implementation Steps

### Step 1: Create backup script

```bash
#!/bin/bash
# /opt/convex/backup.sh
set -euo pipefail

BACKUP_DIR="/backups/convex"
DATE=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

# 1. PostgreSQL dump
echo "[$DATE] Starting PostgreSQL backup..."
docker compose -f /opt/convex/docker-compose.yml exec -T postgres \
  pg_dump -U convex convex_self_hosted | gzip > "$BACKUP_DIR/postgres-$DATE.sql.gz"

# 2. Convex export
echo "[$DATE] Starting Convex export..."
cd /opt/convex-app  # Your app directory with convex CLI configured
npx convex export --path "$BACKUP_DIR/convex-export-$DATE.zip" \
  --url "$CONVEX_SELF_HOSTED_URL" \
  --admin-key "$CONVEX_SELF_HOSTED_ADMIN_KEY"

# 3. Cleanup old backups
echo "[$DATE] Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete

echo "[$DATE] Backup complete."
ls -lh "$BACKUP_DIR"
```

### Step 2: Make executable and test

```bash
chmod +x /opt/convex/backup.sh
/opt/convex/backup.sh  # Test run
```

### Step 3: Schedule with systemd timer (VPS) or cron

**systemd timer (recommended):**

```ini
# /etc/systemd/system/convex-backup.service
[Unit]
Description=Convex Backup
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
WorkingDirectory=/opt/convex
ExecStart=/opt/convex/backup.sh
EnvironmentFile=/opt/convex/.env
```

```ini
# /etc/systemd/system/convex-backup.timer
[Unit]
Description=Daily Convex Backup

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=1h

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now convex-backup.timer
```

**Cron (simpler):**

```bash
# Add to root crontab
0 3 * * * /opt/convex/backup.sh >> /var/log/convex-backup.log 2>&1
```

### Step 4: Configure off-site storage (optional but recommended)

**AWS S3:**
```bash
# Add to backup.sh
aws s3 cp "$BACKUP_DIR/postgres-$DATE.sql.gz" "s3://your-bucket/convex-backups/"
aws s3 cp "$BACKUP_DIR/convex-export-$DATE.zip" "s3://your-bucket/convex-backups/"
```

**Backblaze B2 (cheaper):**
```bash
b2 upload-file your-bucket "$BACKUP_DIR/postgres-$DATE.sql.gz" "convex-backups/postgres-$DATE.sql.gz"
```

### Step 5: Test restore procedure

Document and test:

```bash
# 1. Stop services
docker compose -f /opt/convex/docker-compose.yml down

# 2. Restore PostgreSQL
gunzip -c /backups/convex/postgres-20260115-030000.sql.gz | \
  docker compose -f /opt/convex/docker-compose.yml exec -T postgres \
  psql -U convex convex_self_hosted

# 3. Restart
docker compose -f /opt/convex/docker-compose.yml up -d

# 4. Import Convex export
npx convex import --replace-all /backups/convex/convex-export-20260115-030000.zip
```

## Acceptance Criteria

- [ ] Backup script runs successfully manually
- [ ] systemd timer/cron executes daily at 3 AM
- [ ] PostgreSQL dump completes (<5 min for typical DB)
- [ ] Convex export completes (<2 min)
- [ ] Old backups cleaned up after 7 days
- [ ] Off-site copy created (if configured)
- [ ] Restore procedure tested and documented
- [ ] Backup logs available for monitoring

## Edge Cases

- Backup during high load — use `pg_dump --no-synchronized-snapshots`
- Large database — split dump by table, parallelize
- Network failure during S3 upload — retry logic
- Disk full — monitor with `df -h` alerting

## Related Files

### New Files
- `/opt/convex/backup.sh`
- `/etc/systemd/system/convex-backup.service` (or cron entry)
- `/etc/systemd/system/convex-backup.timer`
- `RESTORE_PROCEDURE.md` (documentation)

## Testing

- Run backup manually, verify files created
- Check backup contents: `gunzip -c postgres-*.sql.gz | head -20`
- Test restore on staging environment
- Verify backup logs in `/var/log/convex-backup.log` or `journalctl -u convex-backup`