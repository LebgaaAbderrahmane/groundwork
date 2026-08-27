import { useCallback, useEffect, useRef, useState } from 'react'
import { Coffee, Timer } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { dollars } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDocumentTitle, useBroadcastChannel } from '@/lib/hooks'
import { notify } from '@/lib/notifications'

type OrderBroadcast = { type: 'order:new' | 'order:update'; orderId?: number }

type KdsColumn = { key: string; label: string; statuses: string[] }

const COLUMNS: KdsColumn[] = [
  { key: 'new', label: 'New', statuses: ['received'] },
  { key: 'making', label: 'Making', statuses: ['making'] },
  { key: 'ready', label: 'Ready', statuses: ['ready'] },
]

function elapsed(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime()
  const secs = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function urgency(date: Date | string): 'ok' | 'warn' | 'alert' {
  const mins = (Date.now() - new Date(date).getTime()) / 60_000
  if (mins > 10) return 'alert'
  if (mins > 5) return 'warn'
  return 'ok'
}

const URGENCY_CLASSES = {
  ok: 'border-l-emerald-500',
  warn: 'border-l-amber-500',
  alert: 'border-l-red-500',
}

const TIMER_CLASSES = {
  ok: 'text-emerald-600 dark:text-emerald-400',
  warn: 'text-amber-600 dark:text-amber-400',
  alert: 'text-red-600 dark:text-red-400',
}

function playBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.value = 0.15
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.stop(ctx.currentTime + 0.25)
  } catch {}
}

export default function KitchenDisplayPage() {
  useDocumentTitle('Kitchen')
  const [now, setNow] = useState(Date.now())
  const prevCountRef = useRef(0)
  const utils = trpc.useUtils()
  const queue = trpc.orders.kitchenActive.useQuery(undefined, { refetchInterval: 3000 })

  const { post } = useBroadcastChannel<OrderBroadcast>('cribstone-orders', (data) => {
    if (data.type === 'order:new' || data.type === 'order:update') {
      utils.orders.kitchenActive.invalidate()
    }
  })

  useEffect(() => {
    const orders = queue.data
    if (!orders) return
    if (prevCountRef.current > 0 && orders.length > prevCountRef.current) {
      playBeep()
      notify(`New order #${orders[0].id}`, `New order received — ${orders[0].items.length} item(s)`)
      post({ type: 'order:new', orderId: orders[0].id })
    }
    prevCountRef.current = orders.length
  }, [queue.data, post])

  useEffect(() => {
    const es = new EventSource('/api/events')
    es.onmessage = () => utils.orders.queue.invalidate()
    return () => es.close()
  }, [utils.orders.queue])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const advance = trpc.orders.kitchenAdvance.useMutation({
    onSuccess: () => {
      utils.orders.kitchenActive.invalidate()
      post({ type: 'order:update' })
    },
  })

  const handleAdvance = useCallback(
    (orderId: number) => {
      advance.mutate({ orderId })
    },
    [advance],
  )

  const orders = queue.data ?? []

  const grouped = COLUMNS.map((col) => ({
    ...col,
    orders: orders.filter((o) => col.statuses.includes(o.status)),
  }))

  // suppress unused warning — `now` drives re-renders for live timers
  void now

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-alt">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <Coffee className="size-5 text-accent" strokeWidth={1.7} />
          <h1 className="font-display text-lg font-semibold tracking-tight">Kitchen Display</h1>
        </div>
        <div className="text-xs font-medium text-muted-foreground">
          {orders.length} active · auto-refreshing
        </div>
      </header>

      <main className="flex min-h-0 flex-1 gap-4 overflow-x-auto p-4">
        {grouped.map((col) => (
          <section key={col.key} className="flex min-w-[320px] flex-1 flex-col rounded-xl border bg-card/60 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">{col.label}</h2>
              <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                {col.orders.length}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {col.orders.length === 0 && (
                <p className="mt-8 text-center text-xs text-muted-foreground">No orders</p>
              )}

              {col.orders.map((order) => {
                const urg = order.createdAt ? urgency(order.createdAt) : 'ok'
                return (
                  <div
                    key={order.id}
                    className={cn(
                      'rounded-lg border border-l-4 bg-card p-4 shadow-sm',
                      URGENCY_CLASSES[urg],
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-display text-base font-bold">#{order.id}</span>
                      {order.createdAt && (
                        <span className={cn('flex items-center gap-1 text-sm font-semibold tabular-nums', TIMER_CLASSES[urg])}>
                          <Timer className="size-3.5" strokeWidth={2} />
                          {elapsed(order.createdAt)}
                        </span>
                      )}
                    </div>

                    {order.tableLabel && (
                      <span className="mb-2 inline-block rounded bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                        Table {order.tableLabel}
                      </span>
                    )}

                    <div className="mb-3 space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium">{item.quantity}×</span>{' '}
                          <span>{item.name}</span>
                          {item.options.length > 0 && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              {item.options.map((o) => o.label).join(', ')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="mb-2 rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        Note: {order.notes}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {order.customerName || 'Guest'} · {dollars(order.totalPence)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdvance(order.id)}
                        disabled={advance.isPending}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.97]"
                      >
                        {order.status === 'received' ? 'Start' : order.status === 'making' ? 'Ready' : 'Done'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
