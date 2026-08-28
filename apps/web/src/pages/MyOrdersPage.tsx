import { Link, useNavigate } from 'react-router-dom'
import { Coffee, Loader2, Package, ShoppingBag, User } from 'lucide-react'
import { signOut } from '@/lib/auth'
import { useAuth } from '@/store/auth'
import { useSession } from '@/lib/auth'
import { trpc } from '@/lib/trpc'
import { dollars } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Head } from '@/components/Head'

const STATUS_LABEL: Record<string, string> = {
  received: 'Received',
  making: 'Making',
  ready: 'Ready for pickup',
  collected: 'Collected',
  cancelled: 'Cancelled',
}

const STATUS_STYLE: Record<string, string> = {
  received: 'bg-surface text-foreground',
  making: 'bg-accent/15 text-accent',
  ready: 'bg-primary/15 text-primary',
  collected: 'bg-surface text-muted-foreground',
  cancelled: 'bg-danger/10 text-danger',
}

export default function MyOrdersPage() {
  useDocumentTitle('My orders')
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const session = useSession()
  const orders = trpc.orders.myOrders.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  })

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  if (session.isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface pt-24">
        <Loader2 className="size-6 animate-spin text-accent" />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 pt-24 text-center">
        <Head title="My orders" description="Sign in to see and track your Cribstone Coffee orders." path="/my-orders" />
        <User className="size-12 text-accent" strokeWidth={1.2} aria-hidden />
        <h1 className="mt-6 font-display text-4xl font-bold text-foreground">Sign in to see your orders</h1>
        <p className="mt-3 max-w-sm text-sm font-light text-foreground/60">
          Create an account or sign in to track your coffee orders, past and present.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/register">Create account</Link>
          </Button>
        </div>
      </main>
    )
  }

  const list = orders.data ?? []

  return (
    <main className="min-h-screen bg-surface pb-24 pt-24">
      <Head title="My orders" description="View and track your Cribstone Coffee orders." path="/my-orders" />
      <div className="container-site max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-5xl font-bold text-foreground">My orders</h1>
            <p className="mt-2 text-sm font-light text-muted-foreground">
              Signed in as <span className="text-foreground">{user.email}</span>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>

        <div className="mt-8">
          {orders.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-accent" />
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-lg border border-border/70 bg-background p-10 text-center">
              <ShoppingBag className="mx-auto size-10 text-accent" strokeWidth={1.2} aria-hidden />
              <p className="mt-4 text-sm font-light text-foreground/60">No orders yet.</p>
              <Button asChild className="mt-6">
                <Link to="/menu">Order ahead</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {list.map((o) => (
                <li key={o.id}>
                  <Link
                    to={`/order/${o.id}`}
                    className="block rounded-lg border border-border/70 bg-background p-6 transition-colors hover:border-accent/40"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Coffee className="size-5 text-accent" strokeWidth={1.5} aria-hidden />
                        <span className="font-display text-lg text-foreground">
                          Order #{o.id}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {dollars(o.totalPence)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-light text-muted-foreground">
                        {new Date(o.createdAt).toLocaleString()} ·{' '}
                        {o.items.reduce((n, i) => n + i.quantity, 0)} item
                        {o.items.reduce((n, i) => n + i.quantity, 0) === 1 ? '' : 's'}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[o.status] ?? 'bg-surface text-foreground'}`}
                      >
                        <Package className="size-3" aria-hidden />
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {o.items.map((i) => (
                        <span
                          key={i.id}
                          className="rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-light text-foreground/70"
                        >
                          {i.quantity}× {i.name}
                        </span>
                      ))}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
