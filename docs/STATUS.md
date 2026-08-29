# Cribstone Coffee — Status Tracker

> What is done, what is in flight, and the full forward plan. This is the source of truth for
> "where are we" and "what's next." Per-stage plans and handoffs live here; see
> `docs/PROCESS.md` for **how** to do a stage.
> Last updated: 2026-08-29

## 1. Current branch / head

- **Branch:** `stage/32-rate-limiting`
- **Open PR:** [PR #34](https://github.com/LebgaaAbderrahmane/groundwork/pull/34) → base `main`
- **Title:** Stage 32: rate limiting
- **Head commit:** `TBD` (commits: dependency, service + wiring, tests, docs)
- CI (`verify` + `e2e`) must be green before merging.

## 2. What has been done (shipped/merged through main)

Work up to `main` = `0aebdd9` (merge of PR #32, Stage 31).

### Phases (from `docs/PLAN.md`)
| # | Phase | Status |
|---|---|---|
| P1 | Repo restructure, workspace, docker, PLAN | ✅ done |
| P2 | Drizzle schema, migrations, seed, api skeleton | ✅ done |
| P3 | API core: routers + services + tests | ✅ done |
| P4 | Web: `/menu`, `/cart`, `/checkout`, confirmation | ✅ done |
| P5 | Admin: login, queue (SSE), menu CRUD, dashboard | ✅ done |
| P6 | Admin ops: inventory, staff, customers/loyalty, tables, settings | ✅ done |
| P7 | E2E happy path, full-stack docker, README runbook | ✅ done |

### Stage 30 — Staff auth → Better Auth (merged, PR #31)
- Better Auth staff tables migration (`0006`): `staff_users`, `staff_sessions`,
  `staff_account`, `staff_verification`; dropped `users` + `refresh_tokens`.
- Migrated staff sign-in/session to Better Auth (`/api/staff-auth/*`); Bearer transport into
  the tRPC `staff` router via `getStaffUser` + role gating (`protected`/`owner`/`manager`).
- Migrated the admin client to the Better Auth Bearer flow.

### Stage 31 — Repair & stabilize (merged, PR #32)
- **API test suite fixed** — was broken by the Stage 30 auth/schema migration:
  - vitest env configured for Better Auth secrets (`vitest.config.ts`) so `pnpm test` no longer
    aborts on env validation.
  - `global-setup.ts` now actually **seeds** the fresh `cribstone_test` DB (was a no-op →
    "No shop configured" 500s).
  - `auth.test.ts` + `orders.test.ts` rewritten for the staff sign-in flow; dynamic menu option
    discovery (no hardcoded IDs); `menu.test.ts` fixed for the 3-group Flat White.
  - `fileParallelism: false` so the shared-DB suite is deterministic.
  - **Result: 11/11 tests green and stable across repeated runs.**
- **Latent schema bug fixed:** `0000`/`0003` baked a literal timestamp into `created_at`/`at`
  defaults instead of `now()`. Every created order/customer/transaction got a fixed past date and
  never appeared in the today-filtered admin queue. Fixed migration defaults to `now()` and
  applied matching direct SQL to the dev DB.
- **`db:reset` fixed:** truncation list dropped removed `users`/`refresh_tokens`, added Better
  Auth tables, and quotes identifiers (`user` is a reserved word).
- **JWT env removed:** `JWT_SECRET`/`JWT_ACCESS_TTL`/`JWT_REFRESH_TTL` from `env.ts`/`.env.example`
  (no consumers remain); `.env` updated locally.
- **Docs updated:** `README.md` + `docs/PLAN.md` for Better Auth, 23 tables, routers, env vars.
- **CI wired:** added a Postgres service + `pnpm test` step to `verify`; restored the disabled
  `e2e` job with Better Auth env.

### Stage 32 — Rate limiting (PR #34, under review)
- Added `express-rate-limit` to the API.
- New `apps/api/src/services/rateLimit.ts`: per-IP limiter factories (`authRateLimit`,
  `orderCreateRateLimit`) with tunable windows/limits and a unified `429 { error }` JSON body.
  `createApp(rateLimit?)` accepts a `Partial<RateLimitConfig>` so tests can inject tiny limits.
- **Auth throttling:** both Better Auth mounts (`/api/auth/*` customer, `/api/staff-auth/*` staff)
  are rate-limited per-IP (default 20 / 15 min) — guards brute-force/credential-stuffing.
- **Order throttling:** public `POST /api/trpc/orders.create` is rate-limited per-IP
  (default 20 / 1 min) — guards order spam/abuse. `/api/health` and `/api/events` stay exempt.
- **Tests:** new `test/rateLimit.test.ts` asserts `429` after the limit for staff sign-in,
  customer sign-in, and `orders.create`, and confirms health stays unthrottled.
- The web/admin auth clients already toast on a `429` — no client change needed.
- **Result: 15/15 tests green (11 prior + 4 new).**

## 3. In flight

- Review + merge of **PR #34 (Stage 32)**. Verify CI (both `verify` and `e2e`) is green.
- After merge: update `main`.

## 4. What has to be done (forward plan)

Stage ordering currently planned (per-user confirmation):
**33 (expand tests) → 34 (real Stripe payments)**, then the
backlog (PWA offline, TLS/deploy hardening, observability, security hardening).

| Stage | Scope | Notes / approach |
|---|---|---|
| **33** | **Expand tests** | Grow the vitest/supertest suite (menu CRUD, inventory, staff roles, settings, analytics, customers/loyalty) and restore/verify Playwright e2e coverage. |
| **34** | **Real Stripe payments** | Replace the `PaymentProvider` mock with a real Stripe integration (server-confirmed `card` flow), keeping the interface so mock mode still works in dev/tests. |
| Backlog | **PWA offline** | Service worker + offline shell for the customer web app. |
| Backlog | **TLS / deploy hardening** | HTTPS, secrets, container hardening, env-based config for prod. |
| Backlog | **Observability** | Structured logging, request metrics, error tracking. |
| Backlog | **Security hardening** | Dependency/rate-limit/cookie hardening beyond stage 32. |

## 5. Process notes & recurring constraints

Keep these in mind on every stage (full detail in `docs/PROCESS.md`):

- One branch + one push + one PR per stage, base `main`, title `Stage N: …`.
- Gates before commit: `pnpm typecheck` · `pnpm lint` (only pre-existing web warnings) ·
  `pnpm test` (15/15, needs db up) · `pnpm build`.
- Migration policy: test DB is recreated+migrated+seeded per run; **never** `drizzle migrate()`
  on the dev DB — apply schema to dev via direct SQL.
- Drizzle-kit can bake a generate-time literal into a column default instead of `now()` — grep
  migrations for `DEFAULT '20` after generating.
- Test fixtures: no hardcoded product/option IDs; discover via `menu.publicMenu`. Flat White has
  3 option groups. Loyalty: `earnPoints(430) = 4`.
- Rate limiting: default auth limit 20/15min, order-create 20/1min per IP; `/api/health` +
  `/api/events` exempt. `createApp(rateLimit?)` injects a config for tests — use a fresh app
  instance per rate-limit test (each has its own in-memory store / key space). `trust proxy` is
  unset (single-instance), so `X-Forwarded-For` is ignored.
- Don't commit `apps/api/tsconfig.tsbuildinfo`.

## 6. Quick reference

- Admin login: `braxton@cribstonecoffee.com` / `cribstone2026`.
- API: `http://localhost:4000` (tRPC `/api/trpc`, SSE `/api/events`, health `/api/health`).
- Web: `:5173` · Admin: `:5174` · Full-stack demo via `docker compose`: web `:8080`, admin `:8081`.
