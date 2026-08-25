import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useLocation } from 'react-router-dom'
import { Coffee, Menu, ShoppingBag, X } from 'lucide-react'
import { BRAND } from '@cribstone/shared'
import { NAV_LINKS } from '@/data/content'
import { Button } from '@/components/ui/button'
import { cartCount, useCart } from '@/store/cart'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'
import { springMicro } from '@/lib/motion'

function isNavActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const count = useCart((s) => cartCount(s.lines))
  const { pathname } = useLocation()

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-[10px]">
      <div className="container-site flex h-16 items-center justify-between">
        <Link
          to="/"
          className="group flex items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <Coffee
            className="size-5 text-accent transition-transform duration-200 ease-out group-hover:-rotate-12"
            strokeWidth={1.8}
          />
          <span className="font-display text-xl italic text-foreground">
            {BRAND.shortName}
          </span>
        </Link>

        <nav className="hidden h-full items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const active = isNavActive(link.href, pathname)
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'relative flex h-full items-center text-[10px] font-medium uppercase tracking-[0.12em] transition-colors duration-200 ease-out',
                  active ? 'text-primary' : 'text-foreground/80 hover:text-primary',
                )}
              >
                {link.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    transition={springMicro}
                    className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-accent"
                  />
                )}
              </Link>
            )
          })}
          <div className="flex items-center gap-1">
            <Link
              to="/cart"
              aria-label={`Shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`}
              className="relative flex size-10 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-surface hover:text-primary"
            >
              <ShoppingBag className="size-5" strokeWidth={1.7} />
              <AnimatePresence initial={false}>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={springMicro}
                  className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
            </Link>
            <ThemeToggle />
          </div>
          <Button asChild>
            <Link to="/menu">
              Order ahead
              <span aria-hidden>→</span>
            </Link>
          </Button>
        </nav>

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex size-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div
        className={cn(
          'overflow-hidden border-border/60 bg-background/95 backdrop-blur-[10px] transition-[max-height] duration-300 ease-out md:hidden',
          open ? 'max-h-[30rem] border-t' : 'max-h-0',
        )}
      >
        <nav className="container-site flex flex-col gap-1 py-4">
          {NAV_LINKS.map((link) => {
            const active = isNavActive(link.href, pathname)
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-lg px-3 py-3 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors',
                  active
                    ? 'bg-surface text-primary'
                    : 'text-foreground/80 hover:bg-surface hover:text-primary',
                )}
              >
                {link.label}
              </Link>
            )
          })}
          <ThemeToggle layout="full" />
          <Link
            to="/cart"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between rounded-lg px-3 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-foreground/80 transition-colors hover:bg-surface hover:text-primary"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="size-4" /> Bag
            </span>
            {count > 0 && (
              <AnimatePresence initial={false}>
                <motion.span
                  key={count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={springMicro}
                  className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
                >
                  {count}
                </motion.span>
              </AnimatePresence>
            )}
          </Link>
          <Button asChild className="mt-2 w-full">
            <Link to="/menu" onClick={() => setOpen(false)}>
              Order ahead <span aria-hidden>→</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
