import { LayoutList, PackageX, Receipt, TrendingUp } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { pounds } from '@/lib/format'
import { Badge, Card } from '@/components/ui'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '@/lib/hooks'

export function DashboardPage() {
  useDocumentTitle('Dashboard')
  const dashboard = trpc.analytics.dashboard.useQuery(undefined, {
    refetchInterval: 30_000,
  })

  const d = dashboard.data
  const maxHour = Math.max(1, ...(d?.busyHours.map((h) => h.count) ?? [1]))

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Today
          </span>
          <h1 className="mt-1 font-display text-4xl font-bold text-foreground">
            Overview
          </h1>
        </div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <LayoutList className="size-4" aria-hidden /> View order queue
        </Link>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-surface text-primary">
              <TrendingUp className="size-5" strokeWidth={1.7} />
            </span>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Revenue
              </p>
              <p className="mt-0.5 font-display text-2xl font-bold text-foreground">
                {pounds(d?.summary.revenuePence ?? 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-surface text-primary">
              <Receipt className="size-5" strokeWidth={1.7} />
            </span>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Orders
              </p>
              <p className="mt-0.5 font-display text-2xl font-bold text-foreground">
                {d?.summary.orderCount ?? 0}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  · avg {pounds(d?.summary.averageOrderPence ?? 0)}
                </span>
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-surface text-primary">
              <PackageX className="size-5" strokeWidth={1.7} />
            </span>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Low stock
              </p>
              <p className="mt-0.5 font-display text-2xl font-bold text-foreground">
                {d?.lowStock.length ?? 0}
              </p>
            </div>
          </div>
          {d && d.lowStock.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {d.lowStock.slice(0, 3).map((i) => i.name).join(', ')}
              {d.lowStock.length > 3 && ` +${d.lowStock.length - 3} more`}
            </p>
          )}
        </Card>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Top products
          </h2>
          {d && d.topProducts.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {d.topProducts.map((p) => (
                <li key={p.name} className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-foreground">{p.name}</span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {p.quantity} × {pounds(p.revenuePence)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm font-light text-muted-foreground">
              No sales yet today.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Busy hours
          </h2>
          {d && d.busyHours.length > 0 ? (
            <div className="mt-4 space-y-1.5">
              {d.busyHours.map((h) => (
                <div key={h.hour} className="flex items-center gap-3">
                  <span className="w-10 shrink-0 text-xs text-muted-foreground">
                    {String(h.hour).padStart(2, '0')}:00
                  </span>
                  <div className="h-5 flex-1 overflow-hidden rounded bg-surface">
                    <div
                      className="h-full rounded bg-accent/70"
                      style={{ width: `${Math.max(4, (h.count / maxHour) * 100)}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs text-muted-foreground">
                    {h.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm font-light text-muted-foreground">
              No orders recorded yet.
            </p>
          )}
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Low stock ingredients
          </h2>
          {d && d.lowStock.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {d.lowStock.map((i) => (
                <Badge key={i.id} className="bg-accent/15 text-accent">
                  {i.name}
                </Badge>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm font-light text-muted-foreground">
              All stocked up.
            </p>
          )}
        </Card>
      </section>
    </div>
  )
}
