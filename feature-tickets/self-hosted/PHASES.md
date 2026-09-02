# Self-Hosted Convex Migration — Phased Implementation Plan

## Overview
Migrate from Convex Cloud to self-hosted Convex backend with PostgreSQL, running in Docker containers. Zero application code changes required.

## Phase Structure

| Phase | Focus | Duration | Tickets |
|-------|-------|----------|---------|
| **1** | Local Dev Environment | 1-2 days | 4 tickets |
| **2** | PostgreSQL Backend | 1 day | 3 tickets |
| **3** | Production Deployment | 1-2 days | 4 tickets |
| **4** | CI/CD & Operations | 1 day | 3 tickets |

**Total: ~4-6 days** (vs 6-10 weeks for PostgreSQL rewrite)

---

## Phase 1: Local Development Environment
*Goal: Run self-hosted Convex locally with SQLite, verify zero code changes*

| Ticket | Title | Effort | Dependency |
|--------|-------|--------|------------|
| SH-01 | Docker Compose with Convex backend + dashboard | S | — |
| SH-02 | Generate admin key, configure `.env.local` | XS | SH-01 |
| SH-03 | Export Convex Cloud data, import to local | S | SH-02 |
| SH-04 | Verify all app features work locally | M | SH-03 |

---

## Phase 2: PostgreSQL Backend
*Goal: Replace SQLite with PostgreSQL for persistence*

| Ticket | Title | Effort | Dependency |
|--------|-------|--------|------------|
| SH-05 | Add PostgreSQL service to docker-compose | S | SH-01 |
| SH-06 | Configure `POSTGRES_URL`, migrate data | S | SH-05 |
| SH-07 | Verify data integrity, performance | S | SH-06 |

---

## Phase 3: Production Deployment
*Goal: Deploy to VPS/Fly.io with HTTPS and reverse proxy*

| Ticket | Title | Effort | Dependency |
|--------|-------|--------|------------|
| SH-08 | Provision VPS/Fly.io, configure DNS | M | Phase 2 |
| SH-09 | Deploy docker-compose with Caddy/nginx reverse proxy | M | SH-08 |
| SH-10 | Configure HTTPS, `CONVEX_CLOUD_ORIGIN`, `CONVEX_SITE_ORIGIN` | S | SH-09 |
| SH-11 | Deploy dashboard (separate or embedded) | S | SH-10 |

---

## Phase 4: CI/CD & Operations
*Goal: Automate deployments, backups, monitoring*

| Ticket | Title | Effort | Dependency |
|--------|-------|--------|------------|
| SH-12 | GitHub Actions: deploy backend on push to main | M | Phase 3 |
| SH-13 | Automated backups (pg_dump + convex export) | S | Phase 3 |
| SH-14 | Health checks, log aggregation, alerting | M | Phase 3 |

---

## Success Criteria (All Phases)

- [ ] `npm run dev` works against local self-hosted Convex
- [ ] All 14 Convex hooks function identically
- [ ] Real-time subscriptions work (WebSocket on port 3210)
- [ ] Clerk auth validates against self-hosted backend
- [ ] Data persists across container restarts (PostgreSQL)
- [ ] Production deployment accessible via HTTPS
- [ ] Automated deploy on merge to main
- [ ] Daily backups with 7-day retention