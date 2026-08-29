# Cribstone Coffee — Development Process & Runbook

> Living runbook: how this repo is structured, how work is gated, and the exact
> workflow (branch → gates → commit → PR → merge) used for every stage.
> Last updated: 2026-08-28

## 1. The repo at a glance

Single-shop coffee shop system in one pnpm monorepo (workspace root = this git repo).

| Path | What it is |
|---|---|
| `apps/web` | Public customer site: `/menu`, `/cart`, `/checkout`, auth |
| `apps/admin` | Staff dashboard: orders queue (SSE), menu, inventory, staff, customers |
| `apps/api` | Express + tRPC v11 API, SSE events, Better Auth, loyalty, mock payments |
| `packages/db` | Drizzle schema, SQL migrations, seed & reset scripts |
| `packages/shared` | Zod input schemas + domain constants shared by API + frontends |
| `docs/` | `PLAN.md` (product/phase plan), `STATUS.md` (what's done/to-do), `PROCESS.md` (this file) |

**Stack:** React 19 + Vite + Tailwind v4 · Express + tRPC + Drizzle ORM · PostgreSQL 16 ·
Better Auth · Zustand · React Query · Vitest + supertest · Playwright.

## 2. Init / working with the codebase

```sh
pnpm dev:db          # docker compose up -d db  (Postgres 16, port 5432)
pnpm install         # workspace deps
pnpm db:migrate && pnpm db:seed   # apply migrations + demo data
pnpm dev             # api :4000 · web :5173 · admin :5174
```

**Root scripts** (use these, not per-package):
`dev` · `build` · `lint` · `typecheck` · `test` (API vitest) · `test:e2e` (Playwright) ·
`db:migrate` · `db:generate` · `db:seed` · `db:reset` · `db:studio`.

**Seed / login:** demo admin `braxton@cribstonecoffee.com` / `cribstone2026` (role `owner`).

**Env:** copies of `.env.example` → `.env` at repo root (gitignored; `.env.example` is
committed). Env vars are validated in `apps/api/src/env.ts` (zod) at process boot — a missing
var aborts the API/test run with a clear error.

## 3. Auth model (Better Auth)

- **Staff** sign in at `POST /api/staff-auth/sign-in/email` (requires a trusted `Origin`
  header, e.g. `http://localhost:5174` = `ADMIN_ORIGIN`, else `403`). Response is
  `{ redirect, token, user }` at the **top level** (not under `data`). The tRPC `staff` router
  reads staff via the `bearer` plugin using `Authorization: Bearer <token>` (or staff cookie).
- **Procedures** (`apps/api/src/trpc.ts`): `publicProcedure` · `protectedProcedure` (staff) ·
  `ownerProcedure` (role `owner`) · `managerProcedure` (excludes `barista`) ·
  `customerProcedure` (Better Auth customer session).
- **Customers** use Better Auth sessions (`apps/api/src/lib/customerAuth.ts`).

## 4. The per-stage workflow (one branch · one push · one PR)

Every stage is shipped independently. This keeps each review small and atomic.

1. **Start from up-to-date `main`.**
   ```sh
   git checkout main && git pull
   git checkout -b stage/<N>-<slug>     # e.g. stage/32-rate-limiting
   ```
2. **Do the work.** Follow repo conventions; see `docs/STATUS.md` "process notes" for
   recurring constraints (migration policy, test fixtures, etc.).
3. **Run the gates before committing** (all must pass):
   ```sh
   pnpm typecheck
   pnpm lint          # expects only the pre-existing web warnings
   pnpm test          # API vitest suite (needs the db container up)
   pnpm build         # optional but done in CI too
   ```
4. **Commit in logical groups** (repo style: `Stage N: <scope> — <summary>`), never committing
   build artifacts (e.g. `apps/api/tsconfig.tsbuildinfo` — leave it unstaged).
5. **Push the branch**, then **open one PR** with base `main`:
   ```sh
   git push -u origin stage/<N>-<slug>
   gh pr create --repo LebgaaAbderrahmane/groundwork --base main --head stage/<N>-<slug> \
     --title "Stage N: <title>" --body "<summary>"
   ```
6. **Let CI run** (see §5). A stage is only "done" when its PR is green and merged.

Repo/branch convention reminder: **one branch + one push + one PR per stage.** The `gh`
keyring token is flagged invalid, but `gh pr create` still works (proven for #31 and #32).

## 5. CI (`.github/workflows/ci.yml`)

| Job | Runs | Notes |
|---|---|---|
| `verify` | typecheck, lint, build, **test** | Postgres 16 service added for the vitest suite (drops/recreates `cribstone_test`) |
| `e2e` | `db:reset` → playwright → full stack | `needs: verify`; starts API/web/admin, waits on `/api/health`, runs `pnpm test:e2e`; upploads `playwright-report/` on failure |

The e2e job was restored (was previously commented out) with Better Auth env
(`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `STAFF_AUTH_SECRET`) replacing stale `JWT_SECRET`.

## 6. Migration & DB policy (important)

- **Test DB** (`cribstone_test`) is dropped + recreated + migrated + seeded fresh by
  `apps/api/test/global-setup.ts` on every `pnpm test` run — fully self-contained.
- **Dev DB** (`cribstone`, per `.env`) has **no** `__drizzle_migrations` tracker, so do **not**
  run `drizzle migrate()` (`pnpm db:migrate`) against it during normal workflow. Apply schema
  changes to dev via **direct SQL**.
- Migration files are the source of truth for the test DB and CI; keep them in sync with the
  drizzle schema (`packages/db/src/schema.ts`).
- **Gotcha:** drizzle-kit can bake a generate-time literal (e.g. `'2026-08-27 05:08:40'`) into a
  column default instead of `now()`. Always grep migrations for `DEFAULT '20` after generating,
  and confirm timestamp columns default to `now()`. A baked literal silently breaks
  today-filtered queries (e.g. the admin queue).

## 7. Working with the API test suite

`pnpm test` runs `apps/api/test` (Vitest + supertest against `cribstone_test`).

- Each file builds the app via `createApp()` from `../src/app`.
- Config lives in `apps/api/vitest.config.ts` (env for Better Auth + `fileParallelism: false`
  so the shared DB suite is deterministic).
- **Fixtures are brittle:** don't hardcode product/option IDs. Discover the menu via
  `GET /api/trpc/menu.publicMenu` and pick options by label. The seed's Flat White has **3**
  option groups (Milk, Size, Extras).
- **tRPC JSON shapes:**
  - Non-batched GET: `.get('/api/trpc/<proc>')` → `res.body.result.data`.
  - Batched GET (`?batch=1&input=...`) returns an **array** `[{ result: { data } }]`.
  - POST mutations: `{ "0": {...} }` (object keyed by index), no `json` wrapper.
  - Use the non-batched form in tests (`/api/trpc/<proc>` without `?batch=1`) for the simplest
    `result.data` shape.
- **Staff sign-in** helper pattern: sign in via `/staff-auth/sign-in/email` with `Origin`
  header, then `agent.set('Authorization', 'Bearer ' + res.body.token)`.
- **Loyalty math:** `earnPoints(totalPence) = floor(totalPence / 100 / pointsPerDollar)` — a
  $4.30 order earns **4** points, not 1.
- **Rate limiting:** auth + `orders.create` are throttled per-IP. Each `createApp()` has its own
  in-memory store, so give rate-limit tests their **own** app instance (don't reuse the shared
  one) or their requests will count into another test's quota. Inject small limits via
  `createApp({ authLimit, orderLimit, ... })`; auth tests share the same `authLimit` budget, so
  isolate each scenario.

## 8. Observability / quality gates on every PR

- Typecheck, lint, build, and the full API test suite must be green.
- The restored e2e (Playwright) job runs against the full stack in CI — confirm it is green
  on the PR before merging (it had been disabled for several stages).
- Keep `README.md`, `docs/PLAN.md`, `docs/STATUS.md`, and `docs/PROCESS.md` current whenever
  behavior changes (auth, schema, routers, scripts, CI).
