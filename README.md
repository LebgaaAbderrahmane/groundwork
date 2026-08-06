# Groundwork Coffee

A full single-shop coffee shop system: a public marketing + order-ahead site, a staff admin
dashboard, and a shared API + Postgres backend — all in one pnpm monorepo.

**Stack:** React 19 + Vite + Tailwind CSS v4 · Express + tRPC v11 + Drizzle ORM · PostgreSQL 16 ·
Zustand · React Query.

## Apps & packages

| Path                 | What it is                                                        |
| -------------------- | ----------------------------------------------------------------- |
| `apps/web`           | Public site: marketing landing + `/menu`, `/cart`, `/checkout`    |
| `apps/admin`         | Staff dashboard: dashboard, orders queue (SSE), menu, inventory…  |
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

| App     | URL                        | Sign in (admin)                        |
| ------- | -------------------------- | -------------------------------------- |
| Web     | http://localhost:5173      | —                                      |
| Admin   | http://localhost:5174      | `jamie@groundworkcoffee.co.uk` / `groundwork2026` |
| API     | http://localhost:4000      | tRPC at `/api/trpc`, SSE at `/api/events` |

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
> (skips when a shop already exists). For local dev the DB is the same `groundwork-db` container,
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

- **Auth**: httpOnly JWT access (15 min) + rotating refresh cookie. `protectedProcedure` resolves
  the user from the access cookie; `ownerProcedure` requires the `owner` role.
- **Orders**: server re-prices every line from the DB (client prices are ignored), validates
  option-group `min`/`max`, deducts inventory from product recipes, awards a loyalty point for a
  phone number, and emits SSE updates. Status pipeline: `received → making → ready → collected`.
- **Real-time queue**: the admin orders page opens `GET /api/events` (SSE) and invalidates its
  queue query on every event; nginx is configured with `proxy_buffering off` for that route.
- **Loyalty**: customers are keyed by `(shopId, phone)`; every order with a phone creates/finds the
  customer, increments visits, and adds a point.
- **Payments**: mock. `in_store` orders start `pending` and are marked `paid` at `collected`;
  `card` orders are marked paid immediately.

## Project structure

```
apps/
  api/src/
    routers/     # auth, menu, orders, inventory, staff, customers, analytics, tables, settings
    services/    # events (SSE), inventory deduction, loyalty, payments
    test/        # vitest + supertest against a scratch test database
  web/src/
    pages/       # Home, Menu, Cart, Checkout, OrderConfirmation
    store/       # zustand cart (localStorage-persisted)
  admin/src/
    pages/       # Login, Dashboard, Orders, Menu, Inventory, Staff, Customers, Tables, Settings
packages/
  db/src/schema.ts      # 17 tables (orders, products, ingredients, recipes, customers, …)
  db/migrations/        # SQL migrations
  shared/src/           # zod schemas + domain constants
```

## Tests

`pnpm test` runs the API suite (`apps/api/test`) with Vitest + supertest. The suite drops and
recreates a scratch `groundwork_test` database and re-seeds it before each run, so it is fully
self-contained (the `db` container just needs to be up).

## Design decisions

See [`docs/PLAN.md`](docs/PLAN.md) for the build plan, phases, and decisions log.
