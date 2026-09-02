# SH-09: Deploy Docker Compose with Caddy Reverse Proxy

## Overview
Deploy the production docker-compose with Caddy as a reverse proxy providing automatic HTTPS via Let's Encrypt.

## Prerequisites
- SH-08 complete (infrastructure provisioned, DNS configured)
- Domain pointing to server IP

## Implementation Steps

### Step 1: Create production `docker-compose.yml` on server

```yaml
# /opt/convex/docker-compose.yml
services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    volumes:
      - caddy-data:/data
      - caddy-config:/config
      - ./Caddyfile:/etc/caddy/Caddyfile
    environment:
      - ACME_AGREE=true
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: convex_self_hosted
      POSTGRES_USER: convex
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: pg_isready -U convex -d convex_self_hosted
      interval: 10s

  convex-backend:
    image: ghcr.io/get-convex/convex-backend:latest
    expose:
      - "3210"
      - "3211"
    volumes:
      - convex-data:/convex/data
    environment:
      - CONVEX_CLOUD_ORIGIN=https://api.yourdomain.com
      - CONVEX_SITE_ORIGIN=https://api.yourdomain.com/http
      - INSTANCE_SECRET=${INSTANCE_SECRET}
      - POSTGRES_URL=postgresql://convex:${POSTGRES_PASSWORD}@postgres:5432/convex_self_hosted
      - RUST_LOG=info
      - DOCUMENT_RETENTION_DELAY=604800  # 7 days
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: curl -f http://localhost:3210/version
      interval: 30s
      start_period: 30s

  convex-dashboard:
    image: ghcr.io/get-convex/convex-dashboard:latest
    expose:
      - "6791"
    environment:
      - NEXT_PUBLIC_DEPLOYMENT_URL=https://api.yourdomain.com
    depends_on:
      convex-backend:
        condition: service_healthy
    restart: unless-stopped

volumes:
  caddy-data:
  caddy-config:
  postgres-data:
  convex-data:
```

### Step 2: Create `Caddyfile`

```caddyfile
# /opt/convex/Caddyfile
{
    email admin@yourdomain.com
    acme_ca https://acme-v02.api.letsencrypt.org/directory
}

api.yourdomain.com {
    reverse_proxy convex-backend:3210 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}

api.yourdomain.com/http/* {
    reverse_proxy convex-backend:3211 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}

dashboard.yourdomain.com {
    reverse_proxy convex-dashboard:6791 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

### Step 3: Create `.env` on server

```bash
# /opt/convex/.env
POSTGRES_PASSWORD=<strong-random-password>
INSTANCE_SECRET=<strong-random-64-char-string>
# Generate with: openssl rand -base64 48
```

### Step 4: Deploy

```bash
# On server
cd /opt/convex
docker compose pull
docker compose up -d
docker compose logs -f caddy  # Watch for Let's Encrypt cert issuance
```

### Step 5: Generate production admin key

```bash
docker compose exec convex-backend ./generate_admin_key.sh
# Save securely (password manager, not in .env)
```

## Acceptance Criteria

- [ ] `https://api.yourdomain.com/version` returns JSON with valid TLS
- [ ] `https://api.yourdomain.com/http/health` works (HTTP actions)
- [ ] `https://dashboard.yourdomain.com` loads dashboard with valid TLS
- [ ] Caddy automatically obtained Let's Encrypt certificates
- [ ] All services healthy: `docker compose ps`
- [ ] Admin key generated and saved securely
- [ ] Backend logs show "Connected to Postgres"

## Edge Cases

- Let's Encrypt rate limits — use staging CA for testing: `acme_ca https://acme-staging-v02.api.letsencrypt.org/directory`
- Caddy fails to get cert — check DNS, port 80/443 open, email valid
- WebSocket upgrades — Caddy handles automatically for Convex
- Large file uploads — increase `max_request_body` if needed

## Related Files

### New Files (on server)
- `/opt/convex/docker-compose.yml`
- `/opt/convex/Caddyfile`
- `/opt/convex/.env`

## Testing

- `curl -I https://api.yourdomain.com/version` — 200 OK, valid cert
- `curl -I https://dashboard.yourdomain.com` — 200 OK, valid cert
- Open dashboard in browser, enter admin key, verify tables
- Test WebSocket: browser dev tools → Network → WS → verify connection