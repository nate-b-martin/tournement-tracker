---
name: pre-commit-review
description: Final code review checklist before committing changes - validates formatting, linting, types, tests, security, and project-specific conventions
metadata:
  audience: developers
  workflow: pre-commit
---

## Pre-Commit Review Checklist

Before committing, run through these checks in order. Stop and fix issues at each step before proceeding.

### 1. Formatting & Linting (Vite+)

The project uses the Vite+ toolchain (`vite-plus`, invoked as `vp`) through package scripts. Run these before every commit:

1. `bun run format` — auto-format with Oxfmt (`vp fmt`)
2. `bun run lint` — lint with Oxlint (`vp lint`)
3. `bun run check` — combined format + lint gate (`vp check`); this must finish with **no errors and no warnings**

`bun run check` is the required final gate. Run `bun run format` first so auto-fixable issues are resolved, then `bun run check` to confirm the result. Do not commit while it reports warnings.

- Verify all imports are organized (Oxfmt sorts them automatically)
- No Oxlint suppression comments without explicit justification
- No trailing whitespace or missing trailing newlines
- Treat every `vp check` warning as a failure to fix, not as informational output
- Run the command from the repo root so the `vite.config.ts` `fmt`, `lint`, and `test` blocks apply

### 2. Build Verification

Run `bun run build` and confirm it succeeds.

- TypeScript strict mode must pass with no errors
- No `any` types in new or modified code (use `unknown` with type guards if needed)
- All exports are properly typed
- No unused variables or imports

### 3. Test Suite

Run tests with `bun run test` and confirm all pass.

- New features must include corresponding tests
- Bug fixes must include a regression test
- Test files mirror source file location and naming conventions
- Mock Convex API when testing components that use `useQuery`/`useMutation`

### 4. Git Diff Review

Review `git diff` for the staged changes. Check for:

- **Secrets**: No API keys, tokens, passwords, or connection strings committed
- **Comments**: No commented-out code blocks; no debug logging (`console.log`, `console.debug`) in production code
- **Console usage**: Only `console.error` for logging in non-production paths
- **Import hygiene**: No unused imports, no wildcard imports (`import * from`)
- **File changes**: Verify only intended files are staged; no accidental lockfile or config changes

### 5. Code-Specific Checks

#### React Components
- Props typed with interfaces; exported if used externally
- `type="button"` on all `<button>` elements not in forms
- `aria-label` on icon-only buttons
- Components use `cn()` from `@/lib/utils` for class merging
- No inline functions in JSX props that cause unnecessary re-renders (unless deps are stable)

#### Convex Functions
- Auth validated with `ctx.auth.getUserIdentity()` in all mutations
- Queries use `.withIndex()` for filtered lookups (no full table scans)
- Proper use of `v.validator` types matching schema definitions
- Error messages are user-friendly and appropriate for the domain

#### TypeScript
- New functions and variables are explicitly typed
- `catch` clauses specify proper error types
- No `@ts-expect-error` or `@ts-ignore` without justification comment

### 6. Security & RBAC

- Server-side auth: all Convex mutations validate `ctx.auth.getUserIdentity()`
- Client-side RBAC: protected routes use `ProtectedRoute` or `useAuth()` checks
- Appropriate role checks for destructive operations (admin/organizer)

### 7. Accessibility

- Form inputs have associated labels
- Interactive elements are keyboard-navigable
- Color contrast meets WCAG AA standards
- Focus indicators are visible

### 8. Commit & Push Gate

Run the Vite+ checks again immediately before committing — passing them earlier is not enough if files changed since:

```bash
bun run format
bun run check
bun run test
```

Then commit and push only when all three succeed:

```bash
git add -A
git commit -m "type(scope): summary"
git push
```

- Never commit with failing `bun run check`, failing tests, or unformatted files
- If a pre-commit or pre-push hook fails, fix the root cause and re-run the commands; do not bypass hooks with `--no-verify`
- After pushing, confirm the push succeeded and any CI checks triggered by it are expected to pass
- Run `bun run test` as the last check before `git push` so the pushed commit matches what was validated

## Quick Reference

| Step | Command | Expected |
|------|---------|----------|
| Format | `bun run format` (`vp fmt`) | Files formatted |
| Lint | `bun run lint` (`vp lint`) | No warnings or errors |
| Format + lint gate | `bun run check` (`vp check`) | No warnings or errors |
| Build | `bun run build` | Success |
| Tests | `bun run test` | All passing |
| Diff | `git diff --cached` | Reviewed manually |
| Commit | `git commit -m "..."` | After all checks pass |
| Push | `git push` | After checks and tests pass |

## Resolution Guide

When a check fails:
1. Read the error output carefully
2. Fix the root cause (not just the symptom)
3. Re-run the check to confirm resolution
4. If the check is a false positive, document why in the commit message or code comment
5. Never disable lint rules, suppress TypeScript errors, or skip tests without documented justification
