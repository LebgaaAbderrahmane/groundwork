# Cribstone Coffee

A full single-shop coffee shop system: a public marketing + order-ahead site, a staff admin
dashboard, and a shared API + Postgres backend — all in one pnpm monorepo.

**Stack:** React 19 + Vite + Tailwind CSS v4 · Express + tRPC v11 + Drizzle ORM · PostgreSQL 16 ·
Zustand · React Query · express-rate-limit.

## Apps & packages

| Path                 | What it is                                                        |
| -------------------- | ----------------------------------------------------------------- |
| `apps/web`           | Public site: marketing landing + `/menu`, `/cart`, `/checkout`    |
| `apps/admin`         | Staff dashboard: dashboard, orders queue (SSE), menu, inventory… |
| `apps/api`           | Express + tRPC API, SSE events, auth, loyalty, mock payments      |
| `packages/db`        | Drizzle schema, migrations, seed script                           |
| `packages/shared`    | Zod input schemas + domain constants shared by API and frontends  |

## Prerequisites

- Node ≥ 22 and pnpm (v9+). `npm` is **not** used in this repo.
- Docker with the Compose plugin (for the database and the full-stack demo).

## Quick start (development)

```sh
# 1. Start the database
pnpm dev:db                       # docker compose up -d db

# 2. Install deps
pnpm install

# 3. Apply migrations + seed demo data
pnpm db:migrate
pnpm db:seed

# 4. Run everything (api :4000, web :5173, admin :5174)
pnpm dev
```

| App     | URL                        | Sign in (admin)                                |
| ------- | -------------------------- | ---------------------------------------------- |
| Web     | http://localhost:5173      | —                                              |
| Admin   | http://localhost:5174      | `braxton@cribstonecoffee.com` / `cribstone2026` |
| API     | http://localhost:4000      | tRPC at `/api/trpc`, SSE at `/api/events`       |

## Full-stack demo (Docker)

Builds the API image, serves the built frontends through nginx, and runs migrations + seed on
first boot.

```sh
pnpm build                       # build web + admin static assets (mounted into nginx)
docker compose up -d --build     # db + api + web(8080) + admin(8081)
```

| Service | URL                  |
| ------- | -------------------- |
| Web     | http://localhost:8080 |
| Admin   | http://localhost:8081 |

> The `api` container runs `pnpm db:migrate && pnpm db:seed` on start; seeding is idempotent
> (skips when a shop already exists). For local dev the DB is the same `cribstone-db` container,
> so dev and docker demo share data unless you delete the volume (`docker compose down -v`).

## Common commands

| Task                   | Command                                  |
| ---------------------- | ---------------------------------------- |
| Typecheck (all)        | `pnpm typecheck`                         |
| Lint (all)             | `pnpm lint`                              |
| Build (all)            | `pnpm build`                             |
| Run API tests          | `pnpm test`                              |
| DB migrations          | `pnpm db:migrate` / `pnpm db:generate`   |
| Seed demo data         | `pnpm db:seed`                           |
| DB studio              | `pnpm db:studio`                         |

## Architecture notes

- **Brand config:** All brand constants (name, address, email, founder) live in
  `packages/shared/src/brand.ts`. Update once, reflected everywhere.
- **Auth**: [Better Auth](https://better-auth.com) for both customers and staff. Staff sign in via
  `/api/staff-auth/*` (email/password, seeded admin `braxton@cribstonecoffee.com`); `protectedProcedure`
  resolves staff from the `Authorization: Bearer` token (or staff cookie), `ownerProcedure` requires the
  `owner` role, and `managerProcedure` excludes `barista`. Customers use Better Auth sessions
  (`customerProcedure`).
- **Orders**: server re-prices every line from the DB (client prices are ignored), validates
  option-group `min`/`max`, deducts inventory from product recipes, awards a loyalty point for a
  phone number, and emits SSE updates. Status pipeline: `received → making → ready → collected`.
- **Real-time queue**: the admin orders page opens `GET /api/events` (SSE) and invalidates its
  queue query on every event; nginx is configured with `proxy_buffering off` for that route.
- **Rate limiting**: `express-rate-limit` throttles the auth endpoints (`/api/auth/*`,
  `/api/staff-auth/*`) and public `orders.create` per IP (defaults 20/15min and 20/1min;
  tunable in `apps/api/src/services/rateLimit.ts`). `GET /api/health` and `GET /api/events`
  are exempt. Clients toast on HTTP `429`.
- **Loyalty**: customers are keyed by `(shopId, phone)`; every order with a phone creates/finds
  the customer, increments visits, and adds a point.
- **Payments**: mock. `in_store` orders start `pending` and are marked `paid` at `collected`;
  `card` orders are marked paid immediately.

## Project structure

```
apps/
  api/src/
    routers/     # menu, orders, inventory, staff, customers, analytics, tables, settings
    services/    # events (SSE), inventory deduction, loyalty, payments
    test/        # vitest + supertest against a scratch test database
  web/src/
    pages/       # Home, Menu, Cart, Checkout, OrderConfirmation
    store/       # zustand cart (localStorage-persisted)
  admin/src/
    pages/       # Login, Dashboard, Orders, Menu, Inventory, Staff, Customers, Tables, Settings
packages/
  shared/src/
    brand.ts     # single source of truth for all brand constants
  db/src/schema.ts      # 23 tables (orders, products, ingredients, recipes, customers, …)
  db/migrations/        # SQL migrations
  shared/src/           # zod schemas + domain constants
```

## Tests

`pnpm test` runs the API suite (`apps/api/test`) with Vitest + supertest. The suite drops and
recreates a scratch `cribstone_test` database and re-seeds it before each run, so it is fully
self-contained (the `db` container just needs to be up).

## Design decisions

See [`docs/PLAN.md`](docs/PLAN.md) for the build plan, phases, and decisions log.
