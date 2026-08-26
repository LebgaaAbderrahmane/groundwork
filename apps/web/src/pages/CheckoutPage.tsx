import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { useDocumentTitle } from '@/lib/hooks'
import { cartSubtotal, useCart } from '@/store/cart'
import { trpc } from '@/lib/trpc'
import { dollars } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { PaymentMethodSelector } from '@/components/payment'
import { PICKUP_OPTIONS } from './CartPage'

export function CheckoutPage() {
  useDocumentTitle('Checkout')
  const navigate = useNavigate()

  const lines = useCart((s) => s.lines)
  const clear = useCart((s) => s.clear)
  const pickup = useCart((s) => s.pickupIndex)
  const notes = useCart((s) => s.notes)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [payment, setPayment] = useState<'in_store' | 'card'>('in_store')
  const [error, setError] = useState<string | null>(null)

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      navigate(`/order/${data.orderId}`, {
        state: { totalPence: data.totalPence },
      })
      clear()
      toast.success('Order placed! See you soon.')
    },
    onError: (err) => {
      const msg = err.message ?? 'Something went wrong placing your order.'
      setError(msg)
      toast.error(msg)
    },
  })

  const pickupMinutes = PICKUP_OPTIONS[pickup]?.minutes ?? 0
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
      notes: notes || undefined,
      pickupAt: new Date(Date.now() + pickupMinutes * 60_000).toISOString(),
    })
  }

  if (lines.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 pt-24 text-center">
        <ShoppingBag className="size-12 text-accent" strokeWidth={1.2} aria-hidden />
        <h1 className="mt-6 font-display text-4xl font-bold text-foreground">
          Nothing to check out
        </h1>
        <p className="mt-3 max-w-sm text-sm font-light text-foreground/60">
          Your bag is empty — head to the menu to add something.
        </p>
      </main>
    )
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
              <div className="mt-4">
                <PaymentMethodSelector value={payment} onChange={(v) => setPayment(v as 'in_store' | 'card')} />
              </div>
            </div>
          </div>

          <aside className="sticky top-24 h-fit rounded-lg border border-border/70 bg-background p-6">
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
                    {dollars(line.unitPricePence * line.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-3 font-medium text-foreground">
                <span>Total</span>
                <span>{dollars(subtotal)}</span>
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
              Place order · {dollars(subtotal)}
            </Button>
          </aside>
        </form>
      </div>
    </main>
  )
}
