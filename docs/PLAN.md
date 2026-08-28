# Cribstone Coffee — Full System Plan

> Living document. Update statuses as phases complete.
> Last updated: 2026-08-28

## 1. Goal

Turn the static Cribstone Coffee marketing site into a complete, single-shop
coffee shop system: live menu + online order-ahead for customers, and an admin
dashboard for the owner/baristas to run menu, orders, inventory, staff, loyalty
and analytics.

- **Scope:** single-shop (not multi-tenant)
- **Payments:** mocked for v1 (pay-at-counter / simulated card). Stripe behind a
  `PaymentProvider` interface.
- **Stack:** pnpm workspace · React 19 + Vite + TS · Tailwind v4 + shadcn/ui ·
  motion · Node (Express) + tRPC · Drizzle ORM + Postgres

## 2. Repository Layout (current)

```
coffeeshop/                      # pnpm workspace (git repo)
├── docs/PLAN.md                 # this file
├── docker-compose.yml           # postgres + api + nginx web/admin
├── .env.example                 # copy to .env
├── nginx/web.conf, admin.conf   # SPA fallback + /api proxy
├── apps/
│   ├── web/                     # customer site (existing project moved here)
│   ├── admin/                   # dashboard (placeholder; built in Phase 6)
│   └── api/                     # Express + tRPC + Drizzle + Better Auth
│       └── src/{index,env,db,trpc}.ts, lib/*(auth), routers/*
└── packages/
    ├── shared/                  # zod schemas + domain constants/types
    │   └── src/{domain,orders,auth,menu,inventory,ops}.ts
    └── db/                      # Drizzle schema + migrations + seed
        ├── src/schema.ts        # all 23 tables
        ├── migrations/          # generated SQL (commit)
        └── scripts/{migrate,seed}.ts
```

## 3. Setup & Commands

```bash
cp .env.example .env             # adjust secrets
docker compose up -d db          # Postgres 16 (healthchecked)
pnpm install
pnpm db:migrate && pnpm db:seed  # apply schema + demo data
pnpm dev                         # api (:4000) + web (:5173) + admin (:5174)

# root scripts
pnpm dev            # all apps concurrently
pnpm build / lint / typecheck / test
pnpm db:migrate / db:generate / db:seed / db:studio
```

**Seed data** (idempotent-ish, dev only):
- Shop: Cribstone Coffee · 1845 Harpswell Islands Road, Orr's Island, ME 04066
- Owner login: `braxton@cribstonecoffee.com` / `cribstone2026`
- 4 categories · 6 products · milk/size option groups · 5 ingredients + recipes · 3 tables

**Env vars** (`.env.example`): `DATABASE_URL`, `PORT`, `NODE_ENV`,
`WEB_ORIGIN`, `ADMIN_ORIGIN`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
`BETTER_AUTH_TRUSTED_ORIGINS` (+ optional social provider keys).

> Note: scripts load `.env` from repo root explicitly — do not rely on
> cwd-relative dotenv.

## 4. Database Schema (Drizzle, Postgres)

All prices integer pence. JSONB for snapshots/settings.

| Table | Notes |
|---|---|
| `shops` | profile, hours, paymentMode, settings jsonb |
| `staff_users` | role: owner/manager/barista, active, Better Auth (email + password) |
| `staff_sessions` / `staff_account` / `staff_verification` | Better Auth staff sessions/accounts |
| `user` / `session` / `account` / `verification` | Better Auth customer sessions (optional) |
| `categories` | shop-scoped, sort, active |
| `products` | price_pence, image, dietary_tags[], active |
| `option_groups` | required, min, max (e.g. Milk, Size) |
| `options` | label + price_delta_pence |
| `ingredients` | stock, low_stock_threshold, unit cost |
| `recipes` | product → ingredient qty per serve |
| `inventory_movements` | +/- change, reason (sale/receipt/waste/adjustment), ref |
| `orders` | type (pickup/dine_in), status flow, totals, payment |
| `order_items` | snapshot name/price + options jsonb |
| `order_status_events` | audit trail of status transitions |
| `customers` | phone lookup, loyalty points, visits |
| `loyalty_transactions` | points +/- reason |
| `tables` | dine-in QR tokens |
| `audit_log` | admin action trail |

Order status pipeline: `received → making → ready → collected` (+ `cancelled`).

## 5. API (tRPC + Express)

- Routers: `menu` · `orders` · `inventory` · `staff` · `customers` ·
  `analytics` · `tables` · `settings`
- Auth: [Better Auth](https://better-auth.com). Staff sign-in via `/api/staff-auth/*`
  (Bearer token / staff cookie); customers via Better Auth sessions. Procedures:
  `publicProcedure` / `protectedProcedure` / `ownerProcedure` / `managerProcedure` /
  `customerProcedure`
- Realtime: `GET /api/events` SSE (`order:update` events)
- Services: inventory auto-deduct on order, loyalty points, mock payments
  (`PaymentProvider` interface)
- Tests: vitest + supertest against a fresh `cribstone_test` DB (recreated by
  `test/global-setup.ts`; run `pnpm test`)

**Done (P3):** auth login/logout/me · menu publicMenu + admin CRUD · orders
create (server-priced, option-group validated) / queue / advance / cancel /
myRecent · inventory list/lowStock/movements/adjust + ingredient CRUD + recipes
· staff invite/roles · customers search/awardPoints · analytics dashboard ·
tables · settings. Verified: 11 vitest tests green + live smoke test (order →
SSE → inventory deduct → analytics).

## 6. Frontend — Customer App (`apps/web`)

Routes (react-router-dom):
- `/` — existing marketing landing; hero/menu links point to `/menu`
- `/menu` — **dedicated full menu page**: category filter tabs, product grid
  from API, option-group modal → add to cart, search + dietary tags
- `/cart` — **cart page**: qty steppers, remove, option breakdown, pickup time,
  notes, subtotal
- `/checkout` — name/phone (optional customer), mock payment, creates order
- `/order/confirmation` — order number + estimated time

Cart: Zustand + localStorage. Menu data comes from the API (no longer static).

## 7. Frontend — Admin App (`apps/admin`)

Sidebar layout, role-gated routes (owner full · manager ops · barista orders):
- `/login` · `/dashboard` (revenue, orders, top products, low-stock)
- `/orders` (live SSE queue, click-to-advance pipeline)
- `/menu` (CRUD categories/products/options, image, active, reorder)
- `/inventory` (levels, receipts/waste, thresholds)
- `/staff` (invite, roles) · `/customers` (phone lookup, loyalty) · `/settings`

## 8. Build Phases & Status

| # | Phase | Status |
|---|---|---|
| P1 | Repo restructure, workspace, docker-compose, PLAN.md | ✅ done |
| P2 | Drizzle schema, migrations, seed, api skeleton (auth + menu) | ✅ done |
| P3 | API core: full routers + services + tests | ✅ done |
| P4 | Web: `/menu`, `/cart`, `/checkout`, confirmation | ✅ done |
| P5 | Admin: login, orders queue (SSE), menu CRUD, dashboard | ✅ done |
| P6 | Admin ops: inventory, staff, customers/loyalty, tables, settings | ✅ done |
| P7 | E2E happy path, `docker compose up` full stack, README runbook | ✅ done |

Verify each phase: `pnpm typecheck` + `pnpm lint` + `pnpm test` (+ manual happy path).

## 9. Decisions

- **Drizzle over Prisma** — SQL-native, no codegen lock-in.
- **tRPC over REST** — shared types across web/admin/api.
- **Separate `admin` app** — dashboard bundle isolated from public site.
- **Mock payments v1** — `payment_status = in_store`; Stripe adapter later.
- **tsx runtime** (dev + prod) for the API; packages export TS source directly.
