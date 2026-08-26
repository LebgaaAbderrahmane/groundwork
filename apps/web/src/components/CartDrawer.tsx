import { Link } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cartCount, cartSubtotal, useCart } from '@/store/cart'
import { dollars } from '@/lib/format'
import { Button } from '@/components/ui/button'

export function CartDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const lines = useCart((s) => s.lines)
  const count = useCart((s) => cartCount(s.lines))
  const subtotal = useCart((s) => cartSubtotal(s.lines))
  const setQuantity = useCart((s) => s.setQuantity)
  const remove = useCart((s) => s.remove)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[55] bg-foreground/40 sm:hidden"
            onClick={onClose}
          />
          <motion.div
            key="cart-drawer"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[60] max-h-[80vh] overflow-y-auto rounded-t-2xl bg-background shadow-2xl sm:hidden"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="size-4 text-accent" />
                <span className="font-display text-lg font-semibold text-foreground">
                  Your bag
                </span>
                <span className="text-xs text-muted-foreground">
                  {count} {count === 1 ? 'item' : 'items'}
                </span>
              </div>
              <button
                type="button"
                aria-label="Close cart"
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface"
              >
                <X className="size-4" />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <ShoppingBag className="size-10 text-accent/30" strokeWidth={1.2} />
                <p className="mt-3 text-sm font-light text-foreground/60">
                  Your bag is empty
                </p>
                <Button asChild size="sm" className="mt-4" onClick={onClose}>
                  <Link to="/menu">Browse the menu</Link>
                </Button>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-border px-5">
                  {lines.map((line) => (
                    <li key={line.key} className="flex gap-3 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {line.name}
                        </p>
                        {line.options.length > 0 && (
                          <p className="mt-0.5 text-xs text-muted-foreground truncate">
                            {line.options.map((o) => o.label).join(', ')}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => setQuantity(line.key, line.quantity - 1)}
                            className="flex size-7 items-center justify-center rounded-full border border-border text-foreground/60 hover:border-primary hover:text-primary"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => setQuantity(line.key, line.quantity + 1)}
                            className="flex size-7 items-center justify-center rounded-full border border-border text-foreground/60 hover:border-primary hover:text-primary"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button
                          type="button"
                          aria-label={`Remove ${line.name}`}
                          onClick={() => remove(line.key)}
                          className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-danger"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                        <span className="text-sm font-medium text-foreground">
                          {dollars(line.unitPricePence * line.quantity)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="sticky bottom-0 border-t border-border bg-background px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="font-display text-lg font-bold text-foreground">
                      {dollars(subtotal)}
                    </span>
                  </div>
                  <Button asChild className="mt-3 w-full" onClick={onClose}>
                    <Link to="/cart">Go to bag</Link>
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
