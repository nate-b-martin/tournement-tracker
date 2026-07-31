---
name: github-workflows
description: GitHub operations via gh CLI and GitHub MCP server - issues, PRs, branches, releases, conflict resolution for nate-b-martin/tournement-tracker
metadata:
  audience: developers
  stack: gh-cli-github-mcp
---

# GitHub Workflows

Operations on the `nate-b-martin/tournement-tracker` repository using both the `gh` CLI and the GitHub MCP server.

## Prerequisites

| Tool | Status | Notes |
|------|--------|-------|
| `gh` CLI | Installed at `/usr/bin/gh` (v2.97.0) | Auth required — see Preflight below |
| GitHub MCP server | v1.8.0, connected | Authenticated as `nate-b-martin` |
| Repo | `nate-b-martin/tournement-tracker` | SSH remote (`git@github.com:...`), default branch `main` |

## Preflight — always run first

Before any GitHub operation, establish which tools are usable:

1. **Confirm MCP identity** with `get_me`. The GitHub MCP server is the reliable, always-authenticated path.
2. **Check `gh` auth** with `gh auth status`. If it reports "not logged into any GitHub hosts":
   - Ask the user to run `gh auth login` in their own terminal (it is interactive and cannot be completed by the agent).
   - Continue the workflow using the GitHub MCP server; do not block on `gh` availability.
3. If `gh auth login` would fail mid-task, fall back to the MCP path and note that `gh` commands were skipped.

### Auth fallback rules

- MCP available + `gh` unauthenticated → use MCP for everything MCP supports.
- MCP available + `gh` authenticated → use the decision matrix below.
- MCP unavailable (rare) + `gh` authenticated → use `gh` CLI only.
- Neither available → use plain `git` for local operations and inform the user.

## Tool Decision Matrix

| Operation type | Preferred tool | Why |
|----------------|----------------|-----|
| Issue/PR **creation** with rich bodies | GitHub MCP | Structured args, templates, no shell escaping |
| **Reviews** (pending → comments → submit) | GitHub MCP | Dedicated review workflow, line-level comments |
| Issue/PR **search** | GitHub MCP | `search_issues` / `search_pull_requests` with native syntax |
| Issue/PR **update** (labels, assignees, fields, state) | GitHub MCP | Field-level writes, `state_reason` support |
| **Merge** | GitHub MCP | Controlled merge method selection |
| CI **checks** on a PR | GitHub MCP `get_check_runs` | Direct PR-linked results |
| CI **run** list/view/watch | `gh run list / view / watch` | Live streaming, pagination with `--json` |
| Local git state, diff, branch ops | `git` | Local filesystem operations |
| Conflict detection on a PR | GitHub MCP | `get_status` → `mergeable_state`, `get_files` |
| Conflict **resolution** | `git` locally | Merge/rebase must happen in working tree |
| Bulk/paginated data | `gh` + `--json` + `jq` | Compact, filterable output |
| Releases | `gh release *` | Purpose-built CLI; MCP has equivalents |

General principle: **MCP is the default for anything that writes to GitHub**; `gh` is used opportunistically for local integration, CI live-watching, and bulk reads; `git` handles local-only work.

## Workflows

### Issues

1. **Search for duplicates first**: `search_issues` with `is:issue repo:nate-b-martin/tournement-tracker <query>` before creating.
2. **Create**: `issue_write` method `create` with `title` + `body`. Use GitHub-flavored markdown. Assign `type` only if the repo's issue types allow it (check `list_issue_types` first).
3. **List / search**: `list_issues` (paginate with `endCursor`) or `search_issues` for complex queries.
4. **Update**: `issue_write` method `update` — state (with `state_reason`: `completed` / `not_planned` / `duplicate`), labels, assignees, milestone, custom fields.
5. **Sub-issues**: `issue_write` to create the child, then `sub_issue_write` method `add` to attach to the parent.

### Pull Requests

1. **Check for a PR template first**: read `pull_request_template.md` or `.github/PULL_REQUEST_TEMPLATE/` via `get_file_contents`. Structure the body accordingly.
2. **Create**: `create_pull_request` with `title`, `body` (template-structured), `head`, `base`, `draft` if WIP.
3. **Request Copilot review** before a human reviewer: `request_copilot_review`.
4. **Review workflow** (complex, line-level comments):
   - `pull_request_review_write` method `create` (no `event`) → pending review.
   - `add_comment_to_pending_review` for each line comment (`path`, `line`, `startLine` for ranges, `subjectType`).
   - `pull_request_review_write` method `submit_pending` with `event` (`APPROVE` / `REQUEST_CHANGES` / `COMMENT`) and summary `body`.
5. **Checks**: `get_check_runs` for the head commit; `gh pr checks <number>` or `gh run watch` for live CI.
6. **Merge**: `merge_pull_request` with explicit `merge_method` (`merge` / `squash` / `rebase`).
7. **Update**: `update_pull_request` for title/body/state/base; `update_pull_request_branch` to sync with base.

### Branches

| Action | MCP | gh | git |
|--------|-----|----|-----|
| Create remote branch | `create_branch` | `gh api` | `git checkout -b <name>` + push |
| List branches | `list_branches` | `gh branch` (gh ≥2.59) | `git branch -a` |
| Sync PR branch with base | `update_pull_request_branch` | `gh pr update-branch` | `git rebase` / `git merge` |

Prefer creating branches locally with `git` when you need to work on them immediately; use MCP `create_branch` for remote-only branches (e.g., from another PR's head).

### Releases

- **List**: `list_releases` or `gh release list`.
- **Get**: `get_release_by_tag` / `get_latest_release` or `gh release view <tag>`.
- **Create**: `gh release create <tag> <files> --title "..." --notes "..."` (drafts: `--draft`). MCP exposes no create-release tool, so `gh` is the path here; use `gh api` as a last resort.

### Conflict Resolution

1. **Detect**: `pull_request_read` method `get_status` → check `mergeable_state` (`dirty` / `conflicts`). Alternatively `get_files` and look for files present in both change sets.
2. **Reproduce locally**: fetch the PR branch and base, then check for conflicts:
   ```
   git fetch origin <base> <head-branch>
   git checkout <base>
   git merge <head-branch>   # or: git rebase <head-branch>
   ```
   `git status` lists the conflicted files.
3. **Resolve** in the working tree: edit conflicted files, remove `<<<<<<<` / `=======` / `>>>>>>>` markers, then:
   ```
   git add <resolved-files>
   git commit     # merge: keeps merge context
   ```
   or `git rebase --continue` for rebase-style.
4. **Push**: `git push origin <branch>`.
5. **Verify**: `update_pull_request_branch` if needed, then re-check `get_status` → `mergeable_state` should be clean.
6. **Prevention note**: branches diverge because one side is out of date — mention `gh pr update-branch` / `update_pull_request_branch` to the user as the recurring fix.

### CI Checks

- Per-PR: `pull_request_read` method `get_check_runs`.
- Live: `gh run list`, `gh run view <id>`, `gh run watch <id> --exit-status`.
- Correlate check runs with commit SHA when several pushes are in flight.

## Command Reference

| Operation | gh CLI | GitHub MCP | git |
|-----------|--------|------------|-----|
| Current repo/branch | `gh repo view` | `get_file_contents` | `git branch --show-current` |
| List issues | `gh issue list` | `list_issues` | — |
| Search issues | `gh issue search <q>` | `search_issues` | — |
| Create issue | `gh issue create` | `issue_write` (create) | — |
| Update/close issue | `gh issue close --reason` | `issue_write` (update + `state_reason`) | — |
| List PRs | `gh pr list` | `list_pull_requests` | — |
| View PR diff | `gh pr diff` | `pull_request_read` (get_diff) | `git diff` |
| Create PR | `gh pr create` | `create_pull_request` | — |
| Review PR | `gh pr review` | `pull_request_review_write` (pending→submit) | — |
| PR checks | `gh pr checks` | `get_check_runs` | — |
| Merge PR | `gh pr merge --squash` | `merge_pull_request` | — |
| List branches | `gh branch` | `list_branches` | `git branch -a` |
| Create branch | `gh api ...` | `create_branch` | `git checkout -b` |
| Sync PR branch | `gh pr update-branch` | `update_pull_request_branch` | `git merge origin/main` |
| List releases | `gh release list` | `list_releases` | — |
| Create release | `gh release create` | — (use `gh`) | — |
| Merge status | `gh pr view --json mergeable` | `get_status` | `git status` |

## Project Conventions & Gotchas

- Global opencode permissions set `git` and `bash` to `ask` — expect a permission prompt for every `gh`/`git` command.
- **Never commit, push, merge, or close issues/PRs unless the user explicitly asked.** Confirm destructive actions first.
- Always confirm identity with `get_me` at the start of a session; operate only on `nate-b-martin/tournement-tracker`.
- MCP list tools paginate via `endCursor` — request pages for large result sets.
- When both `gh` and MCP can do a write, prefer MCP (no shell escaping, structured validation).
- Use `gh auth login` setup as a one-time prerequisite for `gh`-only features (release creation, `gh run watch`). Until then, fall back to MCP.
- Fetch the PR template before creating a PR; mirror its structure in the body.
- If a `gh` command fails on auth, re-check `gh auth status`; do not retry silently.
