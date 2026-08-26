import { Link } from 'react-router-dom'
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useDocumentTitle } from '@/lib/hooks'
import { cartSubtotal, useCart } from '@/store/cart'
import { dollars } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Head } from '@/components/Head'

export const PICKUP_OPTIONS = [
  { label: 'As soon as possible', minutes: 0 },
  { label: 'In 10 minutes', minutes: 10 },
  { label: 'In 20 minutes', minutes: 20 },
  { label: 'In 30 minutes', minutes: 30 },
]

export default function CartPage() {
  useDocumentTitle('Your Bag')
  const lines = useCart((s) => s.lines)
  const setQuantity = useCart((s) => s.setQuantity)
  const remove = useCart((s) => s.remove)
  const pickup = useCart((s) => s.pickupIndex)
  const setPickup = useCart((s) => s.setPickupIndex)
  const notes = useCart((s) => s.notes)
  const setNotes = useCart((s) => s.setNotes)

  const subtotal = cartSubtotal(lines)

  if (lines.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 pt-24 text-center">
        <Head title="Your Bag" description="Your Cribstone Coffee bag is empty — head to the menu to find something great." path="/cart" />
        <ShoppingBag className="size-12 text-accent" strokeWidth={1.2} aria-hidden />
        <h1 className="mt-6 font-display text-4xl font-bold text-foreground">
          Your bag is <em className="italic text-accent">empty</em>
        </h1>
        <p className="mt-3 max-w-sm text-sm font-light text-foreground/60">
          Add something good from the menu and it'll show up here.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/menu">
            See the menu <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-surface pb-24 pt-24">
      <Head title="Your Bag" description="Review your Cribstone Coffee order — adjust items, quantities, and pickup time before checkout." path="/cart" />
      <div className="container-site max-w-4xl">
        <header>
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Order ahead
          </span>
          <h1 className="mt-3 font-display text-5xl font-bold text-foreground">
            Your <em className="italic text-accent">bag</em>
          </h1>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {lines.map((line) => (
              <div
                key={line.key}
                className="flex flex-col gap-3 rounded-lg border border-border/70 bg-background p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {line.name}
                    </h3>
                    <span className="text-sm font-medium text-accent">
                      {dollars(line.unitPricePence)}
                    </span>
                  </div>
                  {line.options.length > 0 && (
                    <p className="mt-0.5 text-xs font-light text-muted-foreground">
                      {line.options.map((o) => o.label).join(' · ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(line.key, line.quantity - 1)}
                      className="flex size-9 items-center justify-center text-foreground/70 hover:text-primary"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-7 text-center text-sm font-medium text-foreground">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(line.key, line.quantity + 1)}
                      className="flex size-9 items-center justify-center text-foreground/70 hover:text-primary"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <span className="w-20 text-right text-sm font-medium text-foreground">
                    {dollars(line.unitPricePence * line.quantity)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${line.name}`}
                    onClick={() => remove(line.key)}
                    className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-primary"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="sticky top-24 h-fit rounded-lg border border-border/70 bg-background p-6">
            <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Order summary
            </h2>

            <label className="mt-5 block text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/70">
              Pickup
            </label>
            <select
              value={pickup}
              onChange={(e) => setPickup(Number(e.target.value))}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {PICKUP_OPTIONS.map((opt, i) => (
                <option key={opt.label} value={i}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label className="mt-4 block text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/70">
              Notes for the barista
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="Decaf? Extra shot? Take your time…"
              className="mt-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent"
            />

            <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-foreground/70">
                <span>Subtotal</span>
                <span>{dollars(subtotal)}</span>
              </div>
              <div className="flex justify-between font-medium text-foreground">
                <span>Total</span>
                <span>{dollars(subtotal)}</span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                Paid when you pick up
              </p>
            </div>

            <Button asChild size="lg" className="mt-6 w-full">
              <Link to="/checkout">
                Checkout <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </aside>
        </div>
      </div>
    </main>
  )
}
