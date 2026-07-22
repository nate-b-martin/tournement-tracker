# Environment Variables & Secrets Management

## Required Variables

### Local Development (`.env.local`)

```env
# Convex — your project's backend URL
# Get from: npx convex init or Convex dashboard → Settings → Deployment URL
VITE_CONVEX_URL=https://your-project.convex.cloud

# Clerk — authentication provider
# Get from: Clerk Dashboard → API Keys
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Clerk JWT — verified by Convex to authenticate users
# Get from: Clerk Dashboard → JWT Templates → Convex template → Issuer
CLERK_JWT_ISSUER_DOMAIN=https://your-domain.clerk.accounts.com
```

### CI / E2E Testing

```env
# Same as above, plus:
CLERK_SECRET_KEY=sk_test_...     # Clerk secret key (sensitive — never commit)
CLERK_TEST_EMAIL=user@test.com   # Test user for Playwright auth (NOT CLERK_EMAIL)
CLERK_TEST_PASSWORD=password     # Test user password for Playwright auth
```

### Production (Netlify Dashboard)

Same three variables as local dev, but with production values.

## Where to Get Each Value

### VITE_CONVEX_URL

```bash
npx convex init
# Follow the prompts to link your Convex project
# The URL is displayed after successful init
```

Or from Convex Dashboard:
1. Go to https://dashboard.convex.dev
2. Select your project
3. Copy the "Deployment URL" from Settings

### VITE_CLERK_PUBLISHABLE_KEY & CLERK_JWT_ISSUER_DOMAIN

1. Go to https://dashboard.clerk.com
2. Select your application
3. **API Keys** page → copy `Publishable Key`
4. **JWT Templates** → select "Convex" template → copy `Issuer` URL

### CLERK_SECRET_KEY

Same Clerk API Keys page → copy `Secret Key`.

**IMPORTANT**: Never commit the secret key. It's only needed for:
- Playwright test global setup (signing in as test user)
- Server-side operations

## Environment Safety Rules

- `.env.local` is in `.gitignore` — **never force-add it**
- `CLERK_SECRET_KEY` must never appear in commit history
- Use GitHub Secrets for CI (not plain-text env vars)
- Use Netlify's encrypted environment variables for production
- If a secret is leaked, rotate it immediately in Clerk dashboard

## Adding New Variables

When adding a new environment variable:

1. Add to `.env.local` for local development
2. Add documentation to this file
3. Add to `playwright.config.ts` if needed for E2E tests
4. Add to `.github/workflows/ci.yml` if needed for CI
5. Add to Netlify dashboard for production
6. Add TypeScript type declaration in `src/vite-env.d.ts` or similar

## Variable Reference

| Variable | Scope | Public? | Used In | Purpose |
|----------|-------|---------|---------|---------|
| `VITE_CONVEX_URL` | All | Yes (but deployment-specific) | `src/router.tsx`, `src/integrations/convex-clerk-provider.tsx` | Convex backend endpoint |
| `VITE_CLERK_PUBLISHABLE_KEY` | All | Yes (frontend-safe) | `src/integrations/convex-clerk-provider.tsx` | Clerk auth initialization |
| `CLERK_JWT_ISSUER_DOMAIN` | Build + Convex | No | `convex/auth.config.ts` | JWT verification by Convex |
| `CLERK_SECRET_KEY` | CI only | No | `tests/e2e/global-setup.ts` | Clerk test auth (never in frontend) |
| `CLERK_TEST_EMAIL` | CI only | No | `tests/e2e/global-setup.ts` | E2E test user email (not `CLERK_EMAIL`) |
| `CLERK_TEST_PASSWORD` | CI only | No | `tests/e2e/global-setup.ts` | E2E test user password |

## Runtime Checks

The app validates required variables at startup:

```typescript
// src/integrations/convex-clerk-provider.tsx
if (!CONVEX_URL) {
  console.error("missing envar CONVEX_URL");
}
if (!PUBLISHABLE_KEY) {
  console.error("missing envar VITE_CLERK_PUBLISHABLE_KEY");
}

// src/router.tsx
if (!CONVEX_URL) {
  throw new Error("missing VITE_CONVEX_URL envar");
}
```

Missing Clerk variables result in a safe fallback (unauthenticated state). Missing Convex URL throws an error.

## CI Secret Setup

In GitHub repository Settings → Secrets and variables → Actions:

| Secret Name | Value |
|-------------|-------|
| `VITE_CLERK_PUBLISHABLE_KEY` | pk_test_... |
| `CLERK_SECRET_KEY` | sk_test_... |
| `CLERK_TEST_EMAIL` | Your test user email |

These are consumed by `.github/workflows/ci.yml` during E2E test runs.
