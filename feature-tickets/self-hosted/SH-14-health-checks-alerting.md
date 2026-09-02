# SH-14: Health Checks, Log Aggregation, Alerting

## Overview
Implement production monitoring: health checks, centralized logging, and basic alerting for the self-hosted Convex backend.

## Prerequisites
- Phase 3 complete (production deployed)
- SH-13 complete (backups running)

## Implementation Steps

### Step 1: Enhance health check endpoints

The Convex backend already exposes `/version` and `/health`. Add a comprehensive health check script:

```bash
#!/bin/bash
# /opt/convex/health-check.sh
set -euo pipefail

API_URL="https://api.yourdomain.com"
DASHBOARD_URL="https://dashboard.yourdomain.com"

check_endpoint() {
  local name=$1
  local url=$2
  local expected=$3
  
  if response=$(curl -sf --max-time 10 "$url"); then
    if [[ -n "$expected" ]] && ! echo "$response" | grep -q "$expected"; then
      echo "FAIL: $name - unexpected response"
      return 1
    fi
    echo "OK: $name"
    return 0
  else
    echo "FAIL: $name - unreachable"
    return 1
  fi
}

# Run checks
FAILURES=0
check_endpoint "Convex API" "$API_URL/version" "version" || ((FAILURES++))
check_endpoint "Convex HTTP" "$API_URL/http/health" "ok" || ((FAILURES++))
check_endpoint "Dashboard" "$DASHBOARD_URL" "" || ((FAILURES++))
check_endpoint "PostgreSQL" "postgresql://convex:****@localhost:5432/convex_self_hosted" "" || ((FAILURES++))

# Check disk space
DISK_USAGE=$(df /opt/convex | tail -1 | awk '{print $5}' | sed 's/%//')
if [[ $DISK_USAGE -gt 85 ]]; then
  echo "WARN: Disk usage at ${DISK_USAGE}%"
fi

# Check memory
MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
if [[ $MEM_USAGE -gt 85 ]]; then
  echo "WARN: Memory usage at ${MEM_USAGE}%"
fi

exit $FAILURES
```

### Step 2: Configure log aggregation

**Option A: Loki + Promtail (recommended for VPS)**

```yaml
# /opt/convex/loki-config.yml
# Add to docker-compose.yml
  loki:
    image: grafana/loki:2.9
    ports: ["3100:3100"]
    volumes:
      - loki-data:/loki
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:2.9
    volumes:
      - /var/log:/var/log
      - /opt/convex:/opt/convex
      - ./promtail-config.yml:/etc/promtail/config.yml
    depends_on: [loki]

  grafana:
    image: grafana/grafana:10.2
    ports: ["3001:3000"]
    environment:
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    volumes:
      - grafana-data:/var/lib/grafana
    depends_on: [loki]
```

**Option B: Simple log rotation (minimum)**

```bash
# /etc/logrotate.d/convex
/opt/convex/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
}
```

### Step 3: Set up basic alerting

**Option A: Health check with notification (cron + webhook)**

```bash
# /opt/convex/monitor.sh
#!/bin/bash
/opt/convex/health-check.sh
if [[ $? -ne 0 ]]; then
  curl -X POST "$ALERT_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"🚨 Convex backend health check failed on $(hostname)\"}"
fi
```

Add to crontab: `*/5 * * * * /opt/convex/monitor.sh`

**Option B: Uptime Kuma (self-hosted status page)**

```yaml
# Add to docker-compose.yml
  uptime-kuma:
    image: louislam/uptime-kuma:1
    ports: ["3002:3001"]
    volumes:
      - uptime-kuma-data:/app/data
```

Configure monitors:
- `https://api.yourdomain.com/version` (HTTP, 30s interval)
- `https://dashboard.yourdomain.com` (HTTP, 60s interval)
- `tcp://yourdomain.com:5432` (TCP, 60s interval)

### Step 4: Metrics endpoint (optional)

Enable Prometheus metrics in Convex backend:

```yaml
# In docker-compose.yml environment:
- DISABLE_METRICS_ENDPOINT=false
```

Then scrape from Prometheus/Grafana.

### Step 5: Document runbooks

Create `RUNBOOKS.md`:
```markdown
# Convex Backend Runbooks

## Backend Down
1. Check `docker compose ps` — any containers stopped?
2. Check logs: `docker compose logs convex-backend`
3. Restart: `docker compose restart convex-backend`
4. If persistent: check PostgreSQL, disk space, memory

## High Latency
1. Check backend metrics (if enabled)
2. Check PostgreSQL: `pg_stat_activity`
3. Check for long-running queries
4. Consider scaling: increase CPU/memory

## Database Corruption
1. Stop backend
2. Restore from latest backup (SH-13)
3. Verify data integrity
4. Restart backend
```

## Acceptance Criteria

- [ ] `/opt/convex/health-check.sh` runs and reports all services healthy
- [ ] Health check runs every 5 minutes via cron/systemd
- [ ] Alerts fire on failure (webhook/email/Slack)
- [ ] Logs aggregated and queryable (Loki/Grafana or rotated files)
- [ ] Disk/memory/CPU monitored with warnings at 85%
- [ ] Runbooks documented for common incidents
- [ ] Status page (Uptime Kuma) shows historical uptime

## Edge Cases

- Health check false positives — tune timeouts, retry logic
- Log volume — rotate aggressively, compress
- Alert fatigue — only alert on sustained failures (2+ consecutive)
- Network partitions — health check from external host

## Related Files

### New Files
- `/opt/convex/health-check.sh`
- `/opt/convex/monitor.sh`
- `/etc/logrotate.d/convex`
- `RUNBOOKS.md`
- Loki/Grafana configs (if using)

## Testing

- Run health check manually, verify all pass
- Simulate failure: `docker compose stop convex-backend` → verify alert fires
- Check logs in Grafana/Loki or rotated files
- Verify disk/memory alerts at threshold
- Test runbook: follow "Backend Down" procedure