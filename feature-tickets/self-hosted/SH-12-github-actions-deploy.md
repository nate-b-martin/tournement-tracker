# SH-12: GitHub Actions: Deploy Backend on Push to Main

## Overview
Create GitHub Actions workflow to automatically deploy Convex functions to the self-hosted backend on merge to main.

## Prerequisites
- Phase 3 complete (production deployment working)
- GitHub repository with Actions enabled
- Fly.io or SSH access to VPS configured

## Implementation Steps

### Step 1: Create GitHub Actions workflow

```yaml
# .github/workflows/deploy-convex.yml
name: Deploy Convex Backend

on:
  push:
    branches: [main]
    paths:
      - 'convex/**'
      - 'package.json'
      - 'pnpm-lock.yaml'

env:
  CONVEX_SELF_HOSTED_URL: ${{ secrets.CONVEX_SELF_HOSTED_URL }}
  CONVEX_SELF_HOSTED_ADMIN_KEY: ${{ secrets.CONVEX_SELF_HOSTED_ADMIN_KEY }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Deploy Convex functions
        run: npx convex deploy --env-file <(echo "CONVEX_SELF_HOSTED_URL=$CONVEX_SELF_HOSTED_URL\nCONVEX_SELF_HOSTED_ADMIN_KEY=$CONVEX_SELF_HOSTED_ADMIN_KEY")
      
      - name: Verify deployment
        run: |
          sleep 5
          curl -f "$CONVEX_SELF_HOSTED_URL/version"
```

### Step 2: Configure GitHub secrets

In GitHub repo settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `CONVEX_SELF_HOSTED_URL` | `https://api.yourdomain.com` |
| `CONVEX_SELF_HOSTED_ADMIN_KEY` | `<production-admin-key>` |

### Step 3: Add optional Fly.io deployment (if using Fly.io)

```yaml
      - name: Deploy to Fly.io (backend)
        if: github.ref == 'refs/heads/main'
        uses: superfly/flyctl-actions@latest
        with:
          args: "deploy --app tournament-tracker-convex"
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### Step 4: Test workflow

1. Push a small change to `convex/` directory
2. Watch Actions tab
3. Verify deployment succeeds
4. Verify functions updated in dashboard

## Acceptance Criteria

- [ ] Workflow triggers on push to main with convex/ changes
- [ ] `npx convex deploy` runs successfully
- [ ] Functions deployed to production backend
- [ ] Verification step passes (curl /version)
- [ ] Dashboard shows new function versions
- [ ] Failed deployments show clear error in Actions

## Edge Cases

- Concurrent deployments — Actions queue automatically
- Deploy failures — check convex CLI output in logs
- Schema changes — `convex deploy` handles automatically
- Admin key rotation — update secret, re-run workflow

## Related Files

### New Files
- `.github/workflows/deploy-convex.yml`

## Testing

- Create PR with convex change, merge to main
- Watch Actions workflow run
- Verify in production dashboard
- Test a mutated function from frontend