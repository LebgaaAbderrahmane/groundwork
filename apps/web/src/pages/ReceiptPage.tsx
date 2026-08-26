import { Link, useParams } from 'react-router-dom'
import { useDocumentTitle } from '@/lib/hooks'
import { ArrowRight, Printer } from 'lucide-react'
import { BRAND } from '@cribstone/shared'
import { dollars } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { PaymentStatusBadge } from '@/components/payment'
import { trpc } from '@/lib/trpc'

export function ReceiptPage() {
  useDocumentTitle('Receipt')
  const { orderId } = useParams<{ orderId: string }>()
  const order = trpc.orders.getById.useQuery(
    { orderId: Number(orderId) },
    { enabled: Boolean(orderId) && /^\d+$/.test(orderId ?? '') },
  )

  if (order.isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 pt-24">
        <div className="h-96 w-72 animate-pulse rounded-lg border border-border bg-background" />
      </main>
    )
  }

  if (order.isError || !order.data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 pt-24 text-center">
        <p className="font-display text-2xl font-bold text-foreground">Order not found</p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/menu">See the menu</Link>
        </Button>
      </main>
    )
  }

  const o = order.data
  const createdAt = new Date(o.createdAt)
  const dateStr = createdAt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <main className="min-h-screen bg-surface pb-24 pt-24">
      <div className="mx-auto max-w-sm">
        <div className="rounded-lg border border-border/70 bg-background p-6 shadow-sm print:shadow-none">
          <div className="text-center">
            <p className="font-display text-xl italic text-foreground">{BRAND.shortName}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{BRAND.address}</p>
          </div>

          <div className="my-4 border-t border-dashed border-border" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Order</span>
            <span className="font-medium text-foreground">#{o.id}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span className="text-foreground">{dateStr} {timeStr}</span>
          </div>
          {o.customerName && (
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="text-foreground">{o.customerName}</span>
            </div>
          )}
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Type</span>
            <span className="text-foreground">{o.type === 'dine_in' ? 'Dine in' : 'Pickup'}</span>
          </div>

          <div className="my-4 border-t border-dashed border-border" />

          <div className="space-y-2">
            {o.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="text-foreground">
                    {item.quantity} × {item.name}
                  </p>
                  {item.options.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {item.options.map((o) => o.label).join(', ')}
                    </p>
                  )}
                </div>
                <span className="shrink-0 tabular-nums text-foreground">
                  {dollars(item.lineTotalPence)}
                </span>
              </div>
            ))}
          </div>

          <div className="my-4 border-t border-dashed border-border" />

          <div className="flex items-center justify-between text-sm font-semibold text-foreground">
            <span>Total</span>
            <span>{dollars(o.totalPence)}</span>
          </div>

          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Payment</span>
            <PaymentStatusBadge status={o.paymentStatus} />
          </div>

          {o.notes && (
            <>
              <div className="my-4 border-t border-dashed border-border" />
              <p className="text-xs italic text-muted-foreground">"{o.notes}"</p>
            </>
          )}

          <div className="my-4 border-t border-dashed border-border" />

          <p className="text-center text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            Thank you!
          </p>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden /> Print receipt
          </Button>
          <Button asChild>
            <Link to="/menu">
              Order more <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
