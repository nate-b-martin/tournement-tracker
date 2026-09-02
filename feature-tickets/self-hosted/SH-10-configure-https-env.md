# SH-10: Configure HTTPS, CONVEX_CLOUD_ORIGIN, CONVEX_SITE_ORIGIN

## Overview
Configure the production environment variables for the Convex backend and update the frontend to connect to the production self-hosted backend.

## Prerequisites
- SH-09 complete (Caddy deployed, HTTPS working, admin key generated)

## Implementation Steps

### Step 1: Verify backend environment variables

On server, verify `/opt/convex/.env` and docker-compose.yml have:

```bash
# Backend environment (in docker-compose.yml)
CONVEX_CLOUD_ORIGIN=https://api.yourdomain.com
CONVEX_SITE_ORIGIN=https://api.yourdomain.com/http
```

These must match the public HTTPS URLs exactly (including trailing slash for SITE_ORIGIN).

### Step 2: Update frontend `.env.production`

```bash
# .env.production (committed to repo)
VITE_CONVEX_URL=https://api.yourdomain.com
```

### Step 3: Configure Clerk for production domain

In Clerk Dashboard:
1. Go to **Domains** → Add `yourdomain.com` and `www.yourdomain.com`
2. Go to **JWT Template** → Ensure Convex template exists (or create):
   - Issuer: `https://api.yourdomain.com`
   - Claims: `{"sub": "{{user.id}}", "role": "{{public_metadata.role}}"}`
3. Go to **Redirect URLs** → Add `https://yourdomain.com`, `https://www.yourdomain.com`

### Step 4: Build and deploy frontend

```bash
# Local build test
npm run build
npm run preview  # Verify production build works
```

Deploy to Vercel/Netlify:
- Connect repository
- Set environment variables:
  - `VITE_CONVEX_URL` = `https://api.yourdomain.com`
  - `VITE_CLERK_PUBLISHABLE_KEY` = `<clerk-publishable-key>`
  - `CLERK_JWT_ISSUER_DOMAIN` = `https://<your-clerk-domain>.clerk.accounts.com`

### Step 5: Verify Clerk → Convex auth flow

```bash
# Test JWT validation
curl -H "Authorization: Bearer <clerk-jwt>" https://api.yourdomain.com/api/query
# Should work if Clerk JWT issuer matches CONVEX_CLOUD_ORIGIN
```

### Step 6: Test full auth flow in browser

1. Open `https://yourdomain.com`
2. Sign in with Clerk
3. Verify user profile created in Convex `userProfiles` table
4. Verify role assigned correctly

## Acceptance Criteria

- [ ] `VITE_CONVEX_URL` points to production HTTPS URL
- [ ] Clerk configured for production domain
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Frontend deployed and accessible at `https://yourdomain.com`
- [ ] Sign-in works, user profile created in Convex
- [ ] All Convex queries/mutations work from production frontend
- [ ] Real-time subscriptions work (WebSocket over WSS)

## Edge Cases

- Clerk JWT issuer must match `CONVEX_CLOUD_ORIGIN` exactly
- CORS: Convex backend allows requests from `CONVEX_SITE_ORIGIN`
- Mixed content: All frontend assets must load over HTTPS
- Cookie domain: Clerk cookies set for `.yourdomain.com`

## Related Files

### Modified Files
- `.env.production` (add VITE_CONVEX_URL)
- Frontend hosting config (Vercel/Netlify env vars)

## Testing

- Full E2E flow: sign up → sign in → create tournament → create team → add players → generate bracket
- Verify real-time: two browser tabs, changes sync
- Check browser console: no Convex connection errors