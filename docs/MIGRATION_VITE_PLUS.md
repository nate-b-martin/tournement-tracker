# Vite+ Migration Report

Migration of the TanStack Tournament Tracker from **Vite 7 + Vitest 3 + Biome + npm** to
[**Vite+**](https://viteplus.dev) (`vite-plus@1.3.0`) with **bun**.

Follows the official guide: <https://viteplus.dev/guide/migrate>.

## Target toolchain

| Concern           | Before                              | After                                            |
| ----------------- | ----------------------------------- | ------------------------------------------------ |
| Bundler / dev     | Vite 7 (`vite`, `@vitejs/plugin-react` 5) | Vite 8.3.4 + Rolldown (`@voidzero-dev/vite-plus-core`) |
| Test runner       | `vitest` 3                          | Vitest 5.0.5 via `vp test`                       |
| Linter            | Biome                               | Oxlint via `vp lint`                             |
| Formatter         | Biome                               | Oxfmt via `vp fmt`                               |
| CLI               | `vite` / `vitest` / `biome`         | `vp` (dev, build, test, fmt, lint, check, …)     |
| Package manager   | npm (`package-lock.json`)           | bun `1.4.2` (`bun.lock`)                         |
| Node runtime      | unpinned                            | `24.22.0` (`.node-version`, provisioned by Vite+)|

All scripts in `package.json` now go through `vp`; the `vite` dependency is aliased to
`@voidzero-dev/vite-plus-core@1.3.0` and pinned with an `overrides.vite` entry so only one
copy of Vite exists in `node_modules`.

## Verification

| Check                                            | Result                                              |
| ------------------------------------------------ | --------------------------------------------------- |
| `vp check` (format + lint)                       | exit 0 — 0 errors, 19 warnings, 182 files           |
| `vp test`                                        | 218/218 passed (20 files)                           |
| `vp build`                                       | ok — output identical (hashes) to plain Vite 8      |
| `vp dev` + SSR request to `/`                    | HTTP 200                                            |
| Production `srvx` server + SSR request to `/`    | HTTP 200                                            |
| Docker image build                               | ok (multi-stage, 28 steps)                          |
| Docker container serving `/`                     | HTTP 200, `node v24.22.0`, user `nobody`            |
| `vp run test:e2e --list`                         | resolves the CI e2e script (70 tests)               |

Baseline before the migration (npm + Vite 7): 215 passed / 1 skipped, and `bunx tsc --noEmit`
reported **77 pre-existing TypeScript errors**.

> The Playwright e2e suite itself was **not run** during the migration: it requires a
> self-hosted Convex backend plus Clerk credentials, and Playwright browsers are not installed
> in the migration environment. CI covers it.

## Key decisions

### 1. Docker builds with the official Vite+ image, on a glibc runtime

`ghcr.io/voidzero-dev/vite-plus:${VITE_PLUS_VERSION}` builds the app; the runtime is
`debian:bookworm-slim` with the Node binary Vite+ resolved copied in
(`vp env which node`).

Keeping `node:24-alpine` was considered and rejected: Vite+ ships musl builds of its own
binary, but on Alpine it provisions **unofficial** Node.js builds and requires `libstdc++`
(`apk add libstdc++`). The glibc path is the supported one and lets Vite+ download the exact
official Node build named in `.node-version`.

Dependencies are installed in two stages: a full `vp install --frozen-lockfile` for the build,
and a separate `--prod` install for the runtime (running `--prod` over a full install would not
prune devDependencies).

### 2. Type-aware lint on, full type check off

The migrator enables `lint.options.typeAware` and `lint.options.typeCheck` by default. Every
one of the 81 errors reported by the first `vp check --no-fmt` was an existing `tsc` diagnostic
(`TS6133`, `TS2345`, …) — the same 77 errors the repo had before the migration.

`typeCheck` therefore stays **off**, with a comment in `vite.config.ts`, until that pre-existing
type debt is fixed. Type-aware rules (`typeAware`) stay on. Enabling it is a one-line change.

### 3. Formatting covers code and config, not prose

Oxfmt is configured in `vite.config.ts` (`fmt`) to keep the repo's existing conventions: tabs,
80 columns, double quotes, sorted imports.

`convex/**` and `tests/**` had never been formatted — Biome's `includes` only covered
`**/src/**` — so they move to tabs in this migration. That is the bulk of the diff and is
purely mechanical.

Markdown and HTML are **excluded** (`fmt.ignorePatterns`):

- Oxfmt also rewrites code samples *inside* documentation, which would have churned 106 files
  (including 57 archived feature tickets) for no functional gain.
- The only HTML files are design mockups and the generated `playwright-report`.

Generated files are excluded as well: `src/routeTree.gen.ts` (TanStack Router plugin) and
`convex/_generated/**` (Convex CLI). Removing `"**/*.md"` from `ignorePatterns` opts docs into
formatting later.

### 4. Vitest v4 compatibility settings retired

`vp migrate` added `test.clearMocks: false` to preserve Vitest 3 mock-call semantics. It was
removed after confirming the full suite still passes without it (218/218).

## Real breakages fixed

- **`netlify.toml` was dead on arrival after the migration**: `vite-plus-core` ships no `vite`
  bin, so `command = "vite build"` could not run. It is now `npx vp build` (project-local CLI),
  and `docs/deployment/NETLIFY.md` was updated to match.
- **CI**: replaced `actions/setup-node` + `npm` with `voidzero-dev/setup-vp@v1.21.2` (exact
  release — the `v1` tag is no longer maintained) using `node-version: "24.22.0"` and caching.
  `vp check` is now a real gate; the old `npm run check || true` was removed because it passes.
- `playwright.config.ts` `webServer.command` and `scripts/docker-up.sh` (now bunx-first, with an
  `npx` fallback) were updated to the bun/Vite+ commands.
- A dead `// biome-ignore` suppression in `convex/seed.ts` became
  `// oxlint-disable-next-line`.
- `AGENTS.md`, `README.md`, `docs/**` and `.opencode/skills/**` now describe the Vite+ toolchain,
  `bun`/`bunx` commands, and `vite-plus/test` imports (the migration rewrote every test import
  from `vitest` to `vite-plus/test`).

## Files of note

Added: `.node-version`, `.vscode/extensions.json`, this report.

Removed: `biome.json`, `package-lock.json`.

Rewritten for the new toolchain: `vite.config.ts` (`fmt` + `lint` blocks, `lazyPlugins`),
`Dockerfile`, `.dockerignore`, `.github/workflows/ci.yml`, `netlify.toml` (`vp` commands),
`.vscode/settings.json` (Oxc formatter), and
`tests/unit/infra/dockerImage.test.ts` — whose contracts now assert the Vite+ image tag matches
the `vite-plus` dependency, that `.node-version` equals the CI `node-version`, and that no npm
commands remain in the image.

## Follow-ups (out of scope for the toolchain swap)

1. **77 pre-existing TypeScript errors** — fix, then set `lint.options.typeCheck: true`.
2. **19 lint warnings** reported by `vp check` (non-blocking):
   `no-unused-vars` ×8, `require-array-sort-compare` ×4, `no-base-to-string` ×4,
   `no-useless-length-check` ×2, `no-floating-promises` ×1.
3. **Run the e2e suite** in an environment with Playwright browsers and a seeded Convex backend
   (`vp run test:e2e`).
4. `test:ui` needs `@vitest/ui`, which was never installed (broken before the migration).
5. `vite-tsconfig-paths` is obsolete on Vite 8 (native `resolve.tsconfigPaths`); removing it is
   optional.
6. `.cta.json` still lists `"biome"` in its scaffold add-ons and the commented-out `netlify()`
   plugin in `vite.config.ts` still has its import — both were left untouched deliberately.
7. Production `node_modules` is large (the repo lists build tooling such as `tailwindcss`,
   `@tanstack/router-plugin` and `@tailwindcss/vite` as runtime dependencies). Moving them to
   `devDependencies` would shrink the image.
