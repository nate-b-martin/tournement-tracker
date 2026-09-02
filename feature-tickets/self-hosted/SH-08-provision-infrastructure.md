# SH-08: Provision VPS/Fly.io, Configure DNS

## Overview
Provision production infrastructure (VPS or Fly.io) and configure DNS for the Convex backend API and dashboard.

## Prerequisites
- Phase 2 complete (PostgreSQL backend verified locally)
- Domain name registered (or subdomain available)
- Cloud provider account (DigitalOcean, Hetzner, Fly.io, etc.)

## Implementation Steps

### Step 1: Choose and provision infrastructure

**Option A: Fly.io (recommended for simplicity)**
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch backend
cd fly-backend  # Copy from convex-backend/self-hosted/fly/backend
fly launch --name tournament-tracker-convex --region <closest-to-users>

# Launch dashboard (separate app)
cd fly-dashboard  # Copy from convex-backend/self-hosted/fly/dashboard
fly launch --name tournament-tracker-dashboard --region <same-region>
```

**Option B: VPS (DigitalOcean, Hetzner, Linode)**
```bash
# Provision Ubuntu 22.04/24.04 VPS (2GB RAM minimum, 4GB recommended)
# Install Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out/in
# Install docker-compose plugin
sudo apt-get install docker-compose-plugin
```

### Step 2: Configure DNS

| Record | Type | Value | Purpose |
|--------|------|-------|---------|
| `api.yourdomain.com` | A | VPS IP / Fly.io IP | Convex API (port 3210) |
| `api.yourdomain.com` | AAAA | IPv6 if available | Convex API |
| `convex.yourdomain.com` | CNAME | `api.yourdomain.com` | HTTP Actions (port 3211) |
| `dashboard.yourdomain.com` | A | VPS IP / Fly.io IP | Dashboard (port 6791) |

### Step 3: Verify DNS propagation

```bash
dig api.yourdomain.com
dig dashboard.yourdomain.com
# Should resolve to correct IPs
```

## Acceptance Criteria

- [ ] Infrastructure provisioned and accessible via SSH
- [ ] Docker + Docker Compose installed and working
- [ ] DNS records created and propagated
- [ ] `curl https://api.yourdomain.com/version` works (after TLS setup in SH-09)
- [ ] Ports 80, 443, 3210, 3211, 6791 accessible (firewall configured)

## Edge Cases

- Fly.io: Need to configure `CONVEX_CLOUD_ORIGIN` and `CONVEX_SITE_ORIGIN` as secrets
- VPS: Firewall (ufw) must allow required ports
- IPv6: May need AAAA records for modern clients
- Region selection: Choose closest to PostgreSQL (if managed) and users

## Related Files

### New Files
- `fly-backend/fly.toml` (if using Fly.io)
- `fly-dashboard/fly.toml` (if using Fly.io)
- `server-setup.sh` (if using VPS)

## Testing

- SSH to server, run `docker --version && docker compose version`
- `curl -I http://<server-ip>:3210/version` (before TLS)
- Verify DNS with `dig` and online tools (dnschecker.org)