import { useCallback, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useDocumentTitle } from '@/lib/hooks'
import { ArrowRight, AlertTriangle, CheckCircle2, Coffee, Package, RefreshCw, Star } from 'lucide-react'
import { earnPoints } from '@cribstone/shared'
import { dollars } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { PaymentStatusBadge } from '@/components/payment'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { Head } from '@/components/Head'

type LocationState = { totalPence?: number }

const STATUS_STEPS = [
  { key: 'received', label: 'Received', icon: Package },
  { key: 'making', label: 'Making', icon: Coffee },
  { key: 'ready', label: 'Ready', icon: CheckCircle2 },
] as const

const STATUS_ORDER = ['received', 'making', 'ready', 'collected'] as const

function StatusTracker({ status }: { status: string }) {
  const currentIdx = STATUS_ORDER.indexOf(status as typeof STATUS_ORDER[number])

  return (
    <div className="flex items-center gap-3">
      {STATUS_STEPS.map((step, i) => {
        const active = currentIdx >= i
        const current = currentIdx === i
        const Icon = step.icon
        return (
          <div key={step.key} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-full transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'bg-surface text-muted-foreground',
                  current && 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background',
                )}
              >
                <Icon className="size-4" strokeWidth={1.6} />
              </div>
              <span className={cn('text-[10px] font-medium uppercase tracking-[0.1em]', active ? 'text-foreground' : 'text-muted-foreground')}>
                {step.label}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={cn('mb-5 h-0.5 w-10 rounded-full', currentIdx > i ? 'bg-primary' : 'bg-surface')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function OrderConfirmationPage() {
  useDocumentTitle('Order Confirmed')
  const { orderId } = useParams<{ orderId: string }>()
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const user = useAuth((s) => s.user)
  const order = trpc.orders.getById.useQuery(
    { orderId: Number(orderId) },
    {
      enabled: Boolean(orderId) && /^\d+$/.test(orderId ?? ''),
      refetchInterval: (query) => {
        const status = query.state.data?.status
        if (status === 'collected' || status === 'cancelled') return false
        return 5000
      },
    },
  )

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === 0) return
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(delta, 120))
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 80) {
      setRefreshing(true)
      order.refetch().finally(() => {
        setRefreshing(false)
        setPullDistance(0)
      })
    } else {
      setPullDistance(0)
    }
    touchStartY.current = 0
  }, [pullDistance, order])

  const totalPence = order.data?.totalPence ?? state.totalPence

  if (order.isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 pt-24 text-center">
        <Head title="Order Confirmed" description="Your Cribstone Coffee order is being prepared — track its status here." path="/order" />
        <div className="size-14 animate-pulse rounded-full bg-surface" />
        <div className="mt-6 h-10 w-64 animate-pulse rounded bg-surface" />
        <div className="mt-4 h-4 w-80 animate-pulse rounded bg-surface/60" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded bg-surface/60" />
      </main>
    )
  }

  if (order.isError || (!order.data && !state.totalPence)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 pt-24 text-center">
        <Head title="Order Confirmed" description="Your Cribstone Coffee order is being prepared — track its status here." path="/order" />
        <AlertTriangle className="size-14 text-accent" strokeWidth={1.2} aria-hidden />
        <h1 className="mt-6 font-display text-4xl font-bold text-foreground">
          Order not found
        </h1>
        <p className="mt-3 max-w-sm text-sm font-light text-foreground/60">
          We couldn't find order #{orderId ?? '—'}. It may have expired or the link
          may be incorrect.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/menu">
              See the menu <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/">Back to the site</Link>
          </Button>
        </div>
      </main>
    )
  }

  const data = order.data
  const isLive = data && data.status !== 'collected' && data.status !== 'cancelled'

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 pt-24 text-center"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Head title="Order Confirmed" description="Your Cribstone Coffee order is confirmed — track status and pickup details." path="/order" />
      {(pullDistance > 0 || refreshing) && (
        <div
          className="mb-4 flex items-center gap-2 text-xs text-muted-foreground"
          style={{ opacity: Math.min(1, pullDistance / 80) }}
        >
          <RefreshCw
            className={cn('size-4', refreshing && 'animate-spin')}
            style={{ transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg)` }}
          />
          {refreshing ? 'Refreshing…' : pullDistance > 80 ? 'Release to refresh' : 'Pull to refresh'}
        </div>
      )}
      {data?.status === 'collected' ? (
        <CheckCircle2 className="size-14 text-primary" strokeWidth={1.2} aria-hidden />
      ) : data?.status === 'cancelled' ? (
        <AlertTriangle className="size-14 text-danger" strokeWidth={1.2} aria-hidden />
      ) : (
        <Coffee className="size-14 text-accent" strokeWidth={1.2} aria-hidden />
      )}

      <h1 className="mt-6 font-display text-5xl font-bold text-foreground">
        {data?.status === 'collected'
          ? 'Order collected'
          : data?.status === 'cancelled'
            ? 'Order cancelled'
            : "You're all set"}
      </h1>

      <p className="mt-4 max-w-md text-sm font-light text-foreground/60">
        {data?.customerName ? `${data.customerName}, ` : ''}we've got your
        order in. Look for{' '}
        <span className="font-medium text-foreground">
          order #{orderId ?? '—'}
        </span>
        {totalPence !== undefined && (
          <>
            {' '}
            for <span className="font-medium text-foreground">{dollars(totalPence)}</span>
          </>
        )}{' '}
        on the ticket and we'll have it ready for pickup.
      </p>

      {data?.paymentStatus && (
        <div className="mt-3">
          <PaymentStatusBadge status={data.paymentStatus} />
        </div>
      )}

      {totalPence && earnPoints(totalPence) > 0 && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">
          <Star className="size-3.5" aria-hidden />
          +{earnPoints(totalPence)} loyalty {earnPoints(totalPence) === 1 ? 'point' : 'points'} earned
        </div>
      )}

      {data && isLive && (
        <div className="mt-8">
          <StatusTracker status={data.status} />
        </div>
      )}

      {isLive && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          Live — status updates automatically
        </p>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button asChild size="lg">
          <Link to={`/receipt/${orderId}`}>
            View receipt
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/menu">
            Order more <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/">Back to the site</Link>
        </Button>
        {user && (
          <Button asChild size="lg" variant="outline">
            <Link to="/my-orders">
              Track all orders <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        )}
      </div>
    </main>
  )
}
