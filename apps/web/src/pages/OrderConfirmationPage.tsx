import { Link, useLocation, useParams } from 'react-router-dom'
import { useDocumentTitle } from '@/lib/hooks'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { pounds } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc'

type LocationState = { totalPence?: number }

export function OrderConfirmationPage() {
  useDocumentTitle('Order Confirmed')
  const { orderId } = useParams<{ orderId: string }>()
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState
  const order = trpc.orders.getById.useQuery(
    { orderId: Number(orderId) },
    { enabled: Boolean(orderId) && /^\d+$/.test(orderId ?? '') },
  )

  const totalPence = order.data?.totalPence ?? state.totalPence

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 pt-24 text-center">
      <CheckCircle2 className="size-14 text-primary" strokeWidth={1.2} aria-hidden />
      <h1 className="mt-6 font-display text-5xl font-bold text-foreground">
        You're all <em className="italic text-accent">set</em>
      </h1>
      <p className="mt-4 max-w-md text-sm font-light text-foreground/60">
        {order.data?.customerName ? `${order.data.customerName}, ` : ''}we've got your
        order in. Look for{' '}
        <span className="font-medium text-foreground">
          order #{orderId ?? '—'}
        </span>
        {totalPence !== undefined && (
          <>
            {' '}
            for <span className="font-medium text-foreground">{pounds(totalPence)}</span>
          </>
        )}{' '}
        on the ticket and we'll have it ready for pickup.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button asChild size="lg">
          <Link to="/menu">
            Order more <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/">Back to the site</Link>
        </Button>
      </div>
    </main>
  )
}
