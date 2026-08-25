import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useDocumentTitle } from '@/lib/hooks'
import { cartSubtotal, useCart } from '@/store/cart'
import { trpc } from '@/lib/trpc'
import { pounds } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { PICKUP_OPTIONS } from './CartPage'
import { cn } from '@/lib/utils'

type LocationState = { pickupIndex?: number; notes?: string }

export function CheckoutPage() {
  useDocumentTitle('Checkout')
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState

  const lines = useCart((s) => s.lines)
  const clear = useCart((s) => s.clear)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [payment, setPayment] = useState<'in_store' | 'card'>('in_store')
  const [error, setError] = useState<string | null>(null)

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      clear()
      navigate(`/order/${data.orderId}`, {
        state: { totalPence: data.totalPence },
      })
    },
    onError: (err) => {
      setError(err.message ?? 'Something went wrong placing your order.')
    },
  })

  const pickupMinutes = PICKUP_OPTIONS[state.pickupIndex ?? 0]?.minutes ?? 0
  const subtotal = cartSubtotal(lines)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    createOrder.mutate({
      type: 'pickup',
      items: lines.map((l) => ({
        productId: l.productId,
        name: l.name,
        unitPricePence: l.unitPricePence,
        quantity: l.quantity,
        options: l.options,
      })),
      subtotalPence: subtotal,
      totalPence: subtotal,
      paymentMethod: payment,
      customerName: name,
      customerPhone: phone.trim() || undefined,
      notes: state.notes || undefined,
      pickupAt: new Date(Date.now() + pickupMinutes * 60_000).toISOString(),
    })
  }

  return (
    <main className="min-h-screen bg-surface pb-24 pt-24">
      <div className="container-site max-w-3xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back to bag
        </button>

        <h1 className="mt-4 font-display text-5xl font-bold text-foreground">
          Checkout
        </h1>

        <form onSubmit={submit} className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="rounded-lg border border-border/70 bg-background p-6">
              <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Your details
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/70">
                    Name *
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="For the ticket"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/70">
                    Phone (optional)
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="For loyalty points"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
              <p className="mt-3 text-xs font-light text-muted-foreground">
                Add your phone and earn a loyalty point on every order.
              </p>
            </div>

            <div className="rounded-lg border border-border/70 bg-background p-6">
              <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Payment
              </h2>
              <div className="mt-4 space-y-2">
                {(
                  [
                    { value: 'in_store', label: 'Pay at the counter', note: 'Card or cash on pickup' },
                    { value: 'card', label: 'Pay by card now', note: 'Mock checkout for this version' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPayment(opt.value)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
                      payment === opt.value
                        ? 'border-primary bg-surface'
                        : 'border-border hover:border-primary/40',
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{opt.label}</p>
                      <p className="text-xs font-light text-muted-foreground">{opt.note}</p>
                    </div>
                    <span
                      className={cn(
                        'size-4 rounded-full border-2',
                        payment === opt.value
                          ? 'border-primary bg-primary'
                          : 'border-border',
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-lg border border-border/70 bg-background p-6">
            <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Summary
            </h2>
            <div className="mt-4 space-y-2 text-sm">
              {lines.map((line) => (
                <div key={line.key} className="flex justify-between gap-3 text-foreground/70">
                  <span className="truncate">
                    {line.quantity} × {line.name}
                  </span>
                  <span className="shrink-0">
                    {pounds(line.unitPricePence * line.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-3 font-medium text-foreground">
                <span>Total</span>
                <span>{pounds(subtotal)}</span>
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-accent/15 px-3 py-2 text-xs text-accent">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="mt-6 w-full"
              disabled={createOrder.isPending}
            >
              {createOrder.isPending && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              Place order · {pounds(subtotal)}
            </Button>
          </aside>
        </form>
      </div>
    </main>
  )
}
