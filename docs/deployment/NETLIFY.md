# Netlify Deployment

## Configuration

**File**: [`netlify.toml`](../netlify.toml)

```toml
[build]
  command = "vite build"
  dir = "dist/client"
[dev]
  command = "npm run dev"
  targetPort = 3000
  port = 8888
```

- **Build command**: `vite build` — produces static output in `dist/client/`
- **Publish directory**: `dist/client/`
- **Dev port**: 3000 (Netlify dev proxies to this)

## Deploy Process

### Automatic (GitHub Integration)

1. Push to `main` branch (or open a PR)
2. Netlify auto-detects the project (linked via Netlify dashboard)
3. Runs `vite build`
4. Deploys `dist/client/` to production

### Manual (CLI)

```bash
npm run build
npx netlify deploy --prod --dir=dist/client
```

## Environment Variables

Set these in the Netlify dashboard (Site Settings → Environment Variables):

| Variable | Source | Required |
|----------|--------|----------|
| `VITE_CONVEX_URL` | Convex project URL | Yes |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk API Keys page | Yes |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk JWT Templates | Yes (for Convex auth) |

See [ENVIRONMENT.md](ENVIRONMENT.md) for details on obtaining each value.

## Production Checklist

Before deploying to production:

- [ ] All environment variables are set in Netlify dashboard
- [ ] Convex project is in production mode (not dev)
- [ ] Clerk application is published (not in development mode)
- [ ] Seed data has been cleared from production database
- [ ] `npm run build` succeeds locally
- [ ] `npm run check` passes
- [ ] `npm run test` passes

## Convex Production Setup

1. Deploy Convex functions to production:
   ```bash
   npx convex deploy
   ```

2. The production Convex URL will be different from the dev URL. Update `VITE_CONVEX_URL` in Netlify.

3. Convex production dashboard:
   ```bash
   npx convex dashboard --prod
   ```

## Clerk Production Setup

1. In Clerk Dashboard, switch from "Development" to "Production" mode
2. Add your Netlify domain to the allowed origins
3. Update `CLERK_JWT_ISSUER_DOMAIN` if needed
4. Copy the production publishable key to Netlify env vars

## CI/CD Pipeline

**File**: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

On every PR and push to `main`:

1. `npm install`
2. `npm run check` (Biome format + lint)
3. `npm run build`
4. `npm run test` (Vitest unit tests)
5. Starts Convex dev server, seeds data, runs Playwright E2E tests
6. Uploads test artifacts on failure

E2E tests require these GitHub secrets:

| Secret | Purpose |
|--------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_TEST_EMAIL` | Test user email for login |

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Blank page on deploy | Missing `VITE_CONVEX_URL` | Set env var in Netlify dashboard and redeploy |
| Auth not working | Missing Clerk keys | Set `VITE_CLERK_PUBLISHABLE_KEY` |
| "Unauthorized" errors | JWT issuer domain mismatch | Set `CLERK_JWT_ISSUER_DOMAIN` matching Clerk prod domain |
| Build fails | Node version mismatch | Ensure Netlify uses Node 18+ (set in `NETLIFY_NODE_VERSION` env var or `.nvmrc`) |
| E2E tests fail in CI | Missing secrets | Add secrets to GitHub repo settings |
