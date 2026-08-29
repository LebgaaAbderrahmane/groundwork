import { useEffect, useRef } from 'react'
import { ChevronRight, X } from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc'
import { dollars } from '@/lib/format'
import { Badge, Button, Card, EmptyState, LiveBadge, PaymentStatusBadge, TimeAgo } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useDocumentTitle, useBroadcastChannel } from '@/lib/hooks'
import { notify } from '@/lib/notifications'
import { eventsUrl } from '@/store/apiUrl'

const STATUS_STYLES: Record<string, string> = {
  received: 'bg-surface text-foreground',
  making: 'bg-accent/20 text-accent',
  ready: 'bg-primary text-primary-foreground',
}

const STATUS_LABELS: Record<string, string> = {
  received: 'Received',
  making: 'Making',
  ready: 'Ready',
}

type OrderBroadcast = { type: 'order:new' | 'order:update'; orderId?: number }

export default function OrdersPage() {
  useDocumentTitle('Orders')
  const utils = trpc.useUtils()
  const prevCountRef = useRef(0)
  const queue = trpc.orders.queue.useQuery(undefined, { refetchInterval: 5000 })

  const { post } = useBroadcastChannel<OrderBroadcast>('cribstone-orders', (data) => {
    if (data.type === 'order:new' || data.type === 'order:update') {
      utils.orders.queue.invalidate()
    }
  })

  useEffect(() => {
    const orders = queue.data
    if (!orders) return
    if (prevCountRef.current > 0 && orders.length > prevCountRef.current) {
      const newest = orders[0]
      toast.info(`New order #${newest.id}`, {
        description: `${newest.customerName || 'Guest'} — ${dollars(newest.totalPence)}`,
      })
      notify(`New order #${newest.id}`, `${newest.customerName || 'Guest'} — ${dollars(newest.totalPence)}`)
      post({ type: 'order:new', orderId: newest.id })
    }
    prevCountRef.current = orders.length
  }, [queue.data, post])

  useEffect(() => {
    const es = new EventSource(eventsUrl())
    es.onmessage = () => {
      utils.orders.queue.invalidate()
    }
    return () => es.close()
  }, [utils.orders.queue])

  const advance = trpc.orders.advanceStatus.useMutation({
    onSuccess: () => {
      utils.orders.queue.invalidate()
      post({ type: 'order:update' })
    },
  })
  const cancel = trpc.orders.cancel.useMutation({
    onSuccess: () => {
      utils.orders.queue.invalidate()
      post({ type: 'order:update' })
    },
  })

  const orders = queue.data ?? []

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Live · updates over SSE
          </span>
          <h1 className="mt-1 font-display text-4xl font-bold text-foreground">
            Order queue
          </h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            {orders.length} active {orders.length === 1 ? 'order' : 'orders'}
          </p>
        </div>
        <LiveBadge />
      </header>

      {orders.length === 0 ? (
        <Card className="mt-8">
          <EmptyState
            title="All caught up"
            description="New orders will appear here the moment they're placed."
          />
        </Card>
      ) : (
        <div className="mt-8 grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-display text-lg font-bold text-foreground">
                    #{order.id}
                  </span>
                  <Badge className={STATUS_STYLES[order.status] ?? 'bg-surface text-foreground'}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                  <Badge className="bg-background text-muted-foreground ring-1 ring-border">
                    {order.type === 'dine_in'
                      ? order.tableLabel
                        ? `Table · ${order.tableLabel}`
                        : 'Dine in'
                      : 'Pickup'}
                  </Badge>
                  {order.paymentMethod === 'in_store' && order.paymentStatus === 'pending' && (
                    <PaymentStatusBadge status="pending" />
                  )}
                  {order.paymentStatus === 'paid' && order.paymentMethod === 'card' && (
                    <PaymentStatusBadge status="paid" />
                  )}
                  {order.customerPhone && (
                    <Badge className="bg-background text-muted-foreground ring-1 ring-border">
                      Loyalty · {order.customerPhone}
                    </Badge>
                  )}
                </div>

                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                  {order.customerName || 'Guest'}
                  <TimeAgo date={order.createdAt} className="text-muted-foreground" />
                </p>

                <ul className="mt-2 space-y-0.5">
                  {order.items.map((item) => (
                    <li key={item.id} className="truncate text-sm text-muted-foreground">
                      {item.quantity} × {item.name}
                      {item.options.length > 0 && (
                        <span className="text-muted-foreground/70">
                          {' '}
                          · {item.options.map((o) => o.label).join(', ')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                {order.notes && (
                  <p className="mt-2 rounded-lg bg-accent/10 px-3 py-2 text-xs italic text-accent">
                    "{order.notes}"
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                <span className="text-lg font-semibold text-foreground">
                  {dollars(order.totalPence)}
                </span>
                <div className="flex gap-2">
                  {order.status !== 'collected' && (
                    <Button
                      onClick={() => advance.mutate({ orderId: order.id })}
                      loading={advance.isPending}
                    >
                      <ChevronRight className="size-4" aria-hidden />
                      {order.status === 'received'
                        ? 'Start making'
                        : order.status === 'making'
                          ? 'Mark ready'
                          : 'Mark collected'}
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    onClick={() => cancel.mutate({ orderId: order.id })}
                    loading={cancel.isPending}
                  >
                    <X className="size-4" aria-hidden /> Cancel
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={cn('size-2 rounded-full', queue.isFetching ? 'bg-accent' : 'bg-primary')} />
        {queue.isFetching ? 'Listening for updates…' : 'Connected'}
      </p>
    </div>
  )
}
