# SH-11: Deploy Dashboard (Separate or Embedded)

## Overview
Deploy the Convex dashboard for production access. Can be deployed separately (recommended) or embedded in the main docker-compose.

## Prerequisites
- SH-10 complete (production backend and frontend working)

## Implementation Steps

### Step 1: Choose deployment strategy

**Option A: Separate Fly.io app (recommended)**
- Isolated from backend
- Independent scaling
- Easier to restrict access

**Option B: Embedded in main docker-compose (simpler)**
- Single server deployment
- Already configured in SH-09

### Step 2: If separate deployment (Fly.io)

```bash
# From convex-backend/self-hosted/fly/dashboard directory
cd fly-dashboard
fly launch --name tournament-tracker-dashboard --region <same-as-backend>
fly secrets set NEXT_PUBLIC_DEPLOYMENT_URL=https://api.yourdomain.com
fly deploy
```

### Step 3: If embedded (already in SH-09)

Dashboard already running at `https://dashboard.yourdomain.com` via Caddy.

### Step 4: Secure dashboard access

**Option A: Admin key only (current)**
- Anyone with admin key can access
- Store key in password manager (1Password, Bitwarden)

**Option B: IP allowlist (additional)**
```caddyfile
# In Caddyfile
dashboard.yourdomain.com {
    @allowed {
        remote_ip 1.2.3.4/32 5.6.7.8/32  # Your office/VPN IPs
    }
    respond @allowed 403
    reverse_proxy convex-dashboard:6791 { ... }
}
```

**Option C: Basic auth (additional)**
```caddyfile
dashboard.yourdomain.com {
    basicauth {
        admin <bcrypt-hashed-password>
    }
    reverse_proxy convex-dashboard:6791 { ... }
}
```

### Step 5: Verify dashboard functionality

1. Open `https://dashboard.yourdomain.com`
2. Enter admin key
3. Verify:
   - Tables tab shows all 10 tables
   - Data tab shows rows
   - Functions tab shows all mutations/queries
   - Logs tab shows backend logs
   - Settings tab shows instance info

### Step 6: Document dashboard access

Create `DASHBOARD_ACCESS.md`:
```markdown
# Convex Dashboard Access

URL: https://dashboard.yourdomain.com
Admin Key: [Stored in 1Password / Bitwarden]

Access restricted to: [IP allowlist / VPN / Basic auth]
```

## Acceptance Criteria

- [ ] Dashboard accessible at `https://dashboard.yourdomain.com` with valid TLS
- [ ] Admin key works for authentication
- [ ] All 10 tables visible with data
- [ ] Functions tab shows deployed mutations/queries
- [ ] Logs visible
- [ ] Access restricted per security policy

## Edge Cases

- Dashboard version mismatch with backend — pin versions in docker-compose
- Large datasets — dashboard pagination works
- WebSocket logs — verify real-time log streaming works

## Related Files

### New Files
- `DASHBOARD_ACCESS.md` (internal documentation)

### Modified Files
- `docker-compose.yml` (if changing dashboard deployment)
- `Caddyfile` (if adding auth/IP restrictions)

## Testing

- Access dashboard, authenticate, browse tables
- Run a query from dashboard (e.g., `tournaments:list`)
- View logs during frontend operations
- Verify access restrictions work