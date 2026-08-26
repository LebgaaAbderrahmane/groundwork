import { useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { BRAND } from '@cribstone/shared'
import { useDocumentTitle } from '@/lib/hooks'
import { trpc } from '@/lib/trpc'
import { dollars } from '@/lib/format'
import { useCart, type SelectedOption } from '@/store/cart'
import { ProductModal, type MenuProduct } from '@/components/ProductModal'
import { cn } from '@/lib/utils'

export default function MenuPage() {
  useDocumentTitle('Menu')
  const menu = trpc.menu.publicMenu.useQuery()
  const addToCart = useCart((s) => s.add)
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all')
  const [activeProduct, setActiveProduct] = useState<MenuProduct | null>(null)
  const [query, setQuery] = useState('')

  const categories = menu.data?.categories ?? []
  const q = query.trim().toLowerCase()

  const visible = categories
    .filter((c) => activeCategory === 'all' || c.id === activeCategory)
    .map((c) => ({
      ...c,
      products: q
        ? c.products.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              (p.description ?? '').toLowerCase().includes(q) ||
              p.dietaryTags.some((t) => t.toLowerCase().includes(q)),
          )
        : c.products,
    }))
    .filter((c) => c.products.length > 0)

  function handleAdd(product: MenuProduct, options: SelectedOption[], quantity: number) {
    addToCart({
      productId: product.id,
      name: product.name,
      basePricePence: product.pricePence,
      options,
      quantity,
    })
    toast.success(`${product.name} added to your bag`, {
      action: {
        label: 'View bag',
        onClick: () => window.location.assign('/cart'),
      },
    })
  }

  return (
    <main className="min-h-screen bg-surface pb-24 pt-24">
      <div className="container-site">
        <header className="text-center">
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Order ahead · {menu.data?.shop?.name ?? BRAND.name}
          </span>
          <h1 className="mt-3 font-display text-5xl font-bold text-foreground md:text-6xl">
            The <em className="italic text-accent">Menu</em>
          </h1>
          {menu.data?.shop?.hours && (
            <p className="mt-3 text-sm font-light text-foreground/60">
              {menu.data.shop.hours}
            </p>
          )}
        </header>

        <div className="relative mx-auto mt-10 max-w-md">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search espresso, avocado, vegan…"
            className="w-full rounded-full border border-border bg-background py-3 pl-11 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-primary"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <nav className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={cn(
              'rounded-full px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors',
              activeCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-background text-foreground/70 hover:border-primary/40',
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'rounded-full px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors',
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-background text-foreground/70 hover:border-primary/40',
              )}
            >
              {cat.name}
            </button>
          ))}
        </nav>

        {menu.isLoading ? (
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border border-border/60 bg-background">
                <div className="aspect-[4/3] bg-surface" />
                <div className="space-y-2 p-5">
                  <div className="h-4 w-2/3 rounded bg-surface" />
                  <div className="h-3 w-full rounded bg-surface/60" />
                </div>
              </div>
            ))}
          </div>
        ) : menu.isError ? (
          <div className="mt-20 text-center">
            <p className="font-display text-2xl font-bold text-foreground">
              Couldn't load the menu
            </p>
            <p className="mt-2 text-sm font-light text-muted-foreground">
              Something went wrong on our end. Give it another go in a moment.
            </p>
            <button
              type="button"
              onClick={() => menu.refetch()}
              className="mt-6 rounded-full border border-border bg-background px-5 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-foreground transition-colors hover:border-primary/40"
            >
              Try again
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-20 text-center">
            <p className="font-display text-2xl font-bold text-foreground">
              Nothing matches “{query.trim()}”
            </p>
            <p className="mt-2 text-sm font-light text-muted-foreground">
              Try another word — or clear the search to see the whole menu.
            </p>
          </div>
        ) : (
          <div className="mt-14 space-y-16">
            {visible.map((category) => (
              <section key={category.id}>
                <h2 className="font-display text-3xl font-bold text-foreground">
                  {category.name}
                </h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {category.products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => setActiveProduct(product as MenuProduct)}
                      className="group overflow-hidden rounded-lg border border-border/70 bg-background text-left transition-colors duration-200 ease-out hover:border-primary"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
                          />
                        )}
                        <span className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-background/90 text-primary shadow transition-transform duration-200 group-hover:scale-110">
                          <Plus className="size-4" />
                        </span>
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-display text-xl font-semibold text-foreground">
                            {product.name}
                          </h3>
                          <span className="shrink-0 text-sm font-medium text-accent">
                            {dollars(product.pricePence)}
                          </span>
                        </div>
                        {product.description && (
                          <p className="mt-1.5 text-sm font-light text-foreground/60">
                            {product.description}
                          </p>
                        )}
                        {product.dietaryTags.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {product.dietaryTags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-accent/15 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-accent"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {activeProduct && (
        <ProductModal
          product={activeProduct}
          onClose={() => setActiveProduct(null)}
          onAdd={(options, quantity) => handleAdd(activeProduct, options, quantity)}
        />
      )}
    </main>
  )
}
