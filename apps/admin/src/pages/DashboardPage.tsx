import { useState } from 'react'
import { LayoutList, PackageX, Receipt, TrendingDown, TrendingUp } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { trpc } from '@/lib/trpc'
import { dollars } from '@/lib/format'
import { Badge, Card, EmptyState, StatsCard } from '@/components/ui'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '@/lib/hooks'

type Period = 'today' | '7d' | '30d'
const PERIOD_LABELS: Record<Period, string> = { today: 'Today', '7d': '7 days', '30d': '30 days' }

function DeltaBadge({ value }: { value: number }) {
  if (value === 0) return null
  const positive = value > 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${
        positive ? 'text-primary' : 'text-danger'
      }`}
    >
      {positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {positive ? '+' : ''}{value}%
    </span>
  )
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">{dollars(payload[0].value)}</p>
    </div>
  )
}

function OrdersTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">{payload[0].value} orders</p>
    </div>
  )
}

export default function DashboardPage() {
  useDocumentTitle('Dashboard')
  const [period, setPeriod] = useState<Period>('today')

  const dashboard = trpc.analytics.dashboard.useQuery(undefined, {
    refetchInterval: period === 'today' ? 30_000 : false,
  })
  const trend = trpc.analytics.revenueTrend.useQuery(undefined, {
    refetchInterval: 60_000,
  })
  const comparison = trpc.analytics.periodComparison.useQuery()

  const d = dashboard.data
  const c = comparison.data
  const maxHour = Math.max(1, ...(d?.busyHours.map((h) => h.count) ?? [1]))

  const trendData = trend.data ?? []

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Dashboard
          </span>
          <h1 className="mt-1 font-display text-4xl font-bold text-foreground">
            Overview
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-background p-0.5">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`h-9 rounded-md px-3 text-xs font-medium transition-colors ${
                  period === p
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <LayoutList className="size-4" aria-hidden /> Queue
          </Link>
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatsCard
          icon={<TrendingUp className="size-5" strokeWidth={1.7} />}
          label="Revenue"
          value={dollars(d?.summary.revenuePence ?? 0)}
          delta={c ? <DeltaBadge value={c.deltas.revenue} /> : undefined}
        />
        <StatsCard
          icon={<Receipt className="size-5" strokeWidth={1.7} />}
          label="Orders"
          value={d?.summary.orderCount ?? 0}
          sub={`· avg ${dollars(d?.summary.averageOrderPence ?? 0)}`}
          delta={c ? <DeltaBadge value={c.deltas.orders} /> : undefined}
        />
        <StatsCard
          icon={<PackageX className="size-5" strokeWidth={1.7} />}
          label="Low stock"
          value={d?.lowStock.length ?? 0}
        />
      </section>

      {d && d.lowStock.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {d.lowStock.slice(0, 3).map((i) => i.name).join(', ')}
          {d.lowStock.length > 3 && ` +${d.lowStock.length - 3} more`}
        </p>
      )}

      {trendData.length > 0 && (
        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Revenue trend (30 days)
            </h2>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `$${v}`}
                    width={50}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-accent)"
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Orders per day
            </h2>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip content={<OrdersTooltip />} />
                  <Bar
                    dataKey="orders"
                    fill="var(--color-primary)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
      )}

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
                    {p.quantity} × {dollars(p.revenuePence)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No sales yet today" />
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
                      role="img"
                      aria-label={`${h.count} orders at ${String(h.hour).padStart(2, '0')}:00`}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs text-muted-foreground">
                    {h.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No orders recorded yet" />
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
            <EmptyState title="All stocked up" />
          )}
        </Card>
      </section>
    </div>
  )
}
