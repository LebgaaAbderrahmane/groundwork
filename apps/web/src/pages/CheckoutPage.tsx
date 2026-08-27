import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Gift, Loader2, ShoppingBag, Star, UtensilsCrossed, X } from 'lucide-react'
import { toast } from 'sonner'
import { LOYALTY, bestAffordableReward, earnPoints } from '@cribstone/shared'
import { useDocumentTitle } from '@/lib/hooks'
import { cartSubtotal, useCart } from '@/store/cart'
import { trpc } from '@/lib/trpc'
import { dollars } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { PaymentMethodSelector } from '@/components/payment'
import { PICKUP_OPTIONS } from './CartPage'
import { Head } from '@/components/Head'

export default function CheckoutPage() {
  useDocumentTitle('Checkout')
  const navigate = useNavigate()

  const lines = useCart((s) => s.lines)
  const clear = useCart((s) => s.clear)
  const pickup = useCart((s) => s.pickupIndex)
  const notes = useCart((s) => s.notes)
  const setNotes = useCart((s) => s.setNotes)
  const table = useCart((s) => s.table)
  const setTable = useCart((s) => s.setTable)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [payment, setPayment] = useState<'in_store' | 'card'>('in_store')
  const [error, setError] = useState<string | null>(null)
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null)

  const pickupMinutes = PICKUP_OPTIONS[pickup]?.minutes ?? 0
  const subtotal = cartSubtotal(lines)

  const customerLookup = trpc.customers.byPhone.useQuery(
    { phone },
    { enabled: phone.length >= 3, retry: false },
  )

  const customer = customerLookup.data
  const pointsToEarn = earnPoints(subtotal)
  const bestReward = customer ? bestAffordableReward(customer.loyaltyPoints) : null
  const selectedReward = selectedRewardId
    ? LOYALTY.rewards.find((r) => r.id === selectedRewardId) ?? null
    : null
  const discountPence = selectedReward?.discountPence ?? 0
  const totalAfterDiscount = Math.max(0, subtotal - discountPence)

  useEffect(() => {
    setSelectedRewardId(null)
  }, [phone])

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      if (selectedReward && customer) {
        redeemMutation.mutate({
          customerId: customer.id,
          points: selectedReward.points,
          rewardId: selectedReward.id,
          orderId: data.orderId,
        })
        return
      }
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

  const redeemMutation = trpc.customers.redeemPoints.useMutation({
    onSuccess: () => {
      const orderId = createOrder.data?.orderId
      if (orderId) {
        navigate(`/order/${orderId}`, {
          state: { totalPence: createOrder.data?.totalPence },
        })
        clear()
        toast.success(`Order placed! Redeemed ${selectedReward!.name}.`)
      }
    },
    onError: () => {
      const orderId = createOrder.data?.orderId
      if (orderId) {
        navigate(`/order/${orderId}`, {
          state: { totalPence: createOrder.data?.totalPence },
        })
        clear()
        toast.success('Order placed! See you soon.')
      }
    },
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    createOrder.mutate({
      type: table ? 'dine_in' : 'pickup',
      items: lines.map((l) => ({
        productId: l.productId,
        name: l.name,
        unitPricePence: l.unitPricePence,
        quantity: l.quantity,
        options: l.options,
      })),
      subtotalPence: subtotal,
      totalPence: totalAfterDiscount,
      paymentMethod: payment,
      customerName: name,
      customerPhone: phone.trim() || undefined,
      notes: notes || undefined,
      pickupAt:
        table || !pickupMinutes
          ? undefined
          : new Date(Date.now() + pickupMinutes * 60_000).toISOString(),
      tableToken: table?.token,
    })
  }

  if (lines.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 pt-24 text-center">
        <Head title="Checkout" description="Complete your Cribstone Coffee order — enter details and choose a payment method." path="/checkout" />
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
      <Head title="Checkout" description="Complete your Cribstone Coffee order — enter details and choose a payment method." path="/checkout" />
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

        {table && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground">
            <UtensilsCrossed className="size-3.5" aria-hidden />
            Dine-in · {table.label}
            <button
              type="button"
              aria-label={`Switch to pickup (remove ${table.label})`}
              onClick={() => setTable(null)}
              className="ml-1 flex size-4 items-center justify-center rounded-full text-primary-foreground/70 transition-colors hover:text-primary-foreground"
            >
              <X className="size-4" />
            </button>
          </p>
        )}

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
                    onBlur={() => {
                      if (phone.length >= 3) customerLookup.refetch()
                    }}
                    placeholder="For loyalty points"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
              <p className="mt-3 text-xs font-light text-muted-foreground">
                Add your phone and earn {LOYALTY.pointsPerDollar} point per dollar on every order.
              </p>
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/70">
                Special instructions (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any allergies or preferences?"
                rows={2}
                className="mt-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {customer && (
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-accent/15">
                    <Star className="size-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {customer.name || 'Returning customer'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {customer.loyaltyPoints} loyalty {customer.loyaltyPoints === 1 ? 'point' : 'points'} · {customer.visits} {customer.visits === 1 ? 'visit' : 'visits'}
                    </p>
                  </div>
                </div>

                {bestReward && (
                  <div className="mt-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      Redeem a reward
                    </p>
                    <div className="mt-2 space-y-2">
                      {LOYALTY.rewards.map((reward) => {
                        const canAfford = customer.loyaltyPoints >= reward.points
                        const isSelected = selectedRewardId === reward.id
                        return (
                          <button
                            key={reward.id}
                            type="button"
                            disabled={!canAfford}
                            onClick={() => setSelectedRewardId(isSelected ? null : reward.id)}
                            className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                              isSelected
                                ? 'border-accent bg-accent/10 text-accent'
                                : canAfford
                                  ? 'border-border hover:border-accent/50 text-foreground'
                                  : 'border-border text-muted-foreground/50 cursor-not-allowed'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <Gift className="size-4" aria-hidden />
                              {reward.name}
                            </span>
                            <span className="text-xs">
                              {reward.points} pts · {dollars(reward.discountPence)}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <p className="mt-3 text-xs font-light text-muted-foreground">
                  You'll earn {pointsToEarn} {pointsToEarn === 1 ? 'point' : 'points'} on this order.
                </p>
              </div>
            )}

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
              {discountPence > 0 && (
                <div className="flex justify-between text-accent">
                  <span>{selectedReward!.name}</span>
                  <span>−{dollars(discountPence)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3 font-medium text-foreground">
                <span>Total</span>
                <span>{dollars(totalAfterDiscount)}</span>
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
              disabled={createOrder.isPending || redeemMutation.isPending}
            >
              {(createOrder.isPending || redeemMutation.isPending) && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              Place order · {dollars(totalAfterDiscount)}
            </Button>
          </aside>
        </form>
      </div>
    </main>
  )
}
