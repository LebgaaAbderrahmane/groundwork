import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, Save, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc'
import { clockTime, formatNumber } from '@/lib/format'
import { Badge, Button, Card, Field, Input, Select } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useDocumentTitle, useDebounce } from '@/lib/hooks'
import { notify } from '@/lib/notifications'

const REASONS = [
  { value: 'receipt', label: 'Stock receipt' },
  { value: 'waste', label: 'Waste / spill' },
  { value: 'adjustment', label: 'Manual adjustment' },
] as const

export default function InventoryPage() {
  useDocumentTitle('Inventory')
  const utils = trpc.useUtils()
  const list = trpc.inventory.list.useQuery()
  const movements = trpc.inventory.movements.useQuery()
  const recipesQuery = trpc.inventory.recipes.useQuery()
  const menu = trpc.menu.admin.list.useQuery()

  const invalidate = () => {
    utils.inventory.list.invalidate()
    utils.inventory.movements.invalidate()
    utils.inventory.recipes.invalidate()
    utils.analytics.dashboard.invalidate()
  }

  const adjust = trpc.inventory.adjust.useMutation({
    onSuccess: () => { invalidate(); toast.success('Stock adjusted') },
    onError: (err) => toast.error(err.message),
  })
  const create = trpc.inventory.createIngredient.useMutation({
    onSuccess: () => { invalidate(); toast.success('Ingredient added') },
    onError: (err) => toast.error(err.message),
  })

  const [form, setForm] = useState({
    name: '',
    unit: '',
    stockQty: '',
    lowStockThreshold: '',
    costPerUnit: '',
  })
  const [adjustSel, setAdjustSel] = useState<{
    ingredientId: string
    change: string
    reason: (typeof REASONS)[number]['value']
    note: string
  }>({ ingredientId: '', change: '1', reason: 'receipt', note: '' })

  const ingredients = list.data ?? []
  const ingredientMap = new Map(ingredients.map((i) => [i.id, i]))

  const prevLowRef = useRef<Set<number>>(new Set())
  useEffect(() => {
    if (!list.data) return
    const currentLow = new Set(ingredients.filter((i) => i.low).map((i) => i.id))
    if (prevLowRef.current.size > 0) {
      for (const id of currentLow) {
        if (!prevLowRef.current.has(id)) {
          const ing = ingredientMap.get(id)
          if (ing) {
            notify('Low stock', `${ing.name} is low (${formatNumber(Number(ing.stockQty), 4)} ${ing.unit} left)`)
          }
        }
      }
    }
    prevLowRef.current = currentLow
  }, [list.data, ingredients, ingredientMap])

  const [stockSearch, setStockSearch] = useState('')
  const debouncedSearch = useDebounce(stockSearch, 200)
  const q = debouncedSearch.trim().toLowerCase()
  const filteredIngredients = q
    ? ingredients.filter((i) => i.name.toLowerCase().includes(q) || i.unit.toLowerCase().includes(q))
    : ingredients

  function submitCreate(e: React.FormEvent) {
    e.preventDefault()
    create.mutate({
      name: form.name.trim(),
      unit: form.unit.trim(),
      stockQty: Number(form.stockQty || 0),
      lowStockThreshold: Number(form.lowStockThreshold || 0),
      costPerUnit: Number(form.costPerUnit || 0),
    })
    setForm({ name: '', unit: '', stockQty: '', lowStockThreshold: '', costPerUnit: '' })
  }

  function submitAdjust(e: React.FormEvent) {
    e.preventDefault()
    if (!adjustSel.ingredientId) return
    adjust.mutate({
      ingredientId: Number(adjustSel.ingredientId),
      change: Number(adjustSel.change),
      reason: adjustSel.reason,
      note: adjustSel.note || undefined,
    })
    setAdjustSel({ ingredientId: '', change: '1', reason: 'receipt', note: '' })
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Stock control
        </span>
        <h1 className="mt-1 font-display text-4xl font-bold text-foreground">Inventory</h1>
      </header>

      <div className="mt-8 grid items-stretch gap-4 lg:grid-cols-3">
        <form onSubmit={submitCreate} className="lg:col-span-1">
          <Card className="h-full">
            <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Add ingredient
            </h2>
            <div className="mt-4 space-y-3">
              <Field label="Name" htmlFor="ing-name">
                <Input id="ing-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Oat milk" required />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Unit" htmlFor="ing-unit">
                  <Input id="ing-unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="litres" required />
                </Field>
                <Field label="Stock" htmlFor="ing-stock">
                  <Input id="ing-stock" type="number" step="any" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })} placeholder="0" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Low stock at" htmlFor="ing-low">
                  <Input id="ing-low" type="number" step="any" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} placeholder="0" />
                </Field>
                <Field label="Cost / unit ($)" htmlFor="ing-cost">
                  <Input id="ing-cost" type="number" step="any" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} placeholder="0.00" />
                </Field>
              </div>
            </div>
            <Button type="submit" loading={create.isPending} className="mt-4 w-full">
              <Plus className="size-4" aria-hidden /> Add ingredient
            </Button>
          </Card>
        </form>

        <form onSubmit={submitAdjust} className="lg:col-span-2">
          <Card className="h-full">
            <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Adjust stock
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <Field label="Ingredient" htmlFor="adj-ing">
                <Select id="adj-ing" value={adjustSel.ingredientId} onChange={(e) => setAdjustSel({ ...adjustSel, ingredientId: e.target.value })} required>
                  <option value="">Select…</option>
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.stockQty} {i.unit})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Change" htmlFor="adj-change">
                <Input id="adj-change" type="number" step="any" value={adjustSel.change} onChange={(e) => setAdjustSel({ ...adjustSel, change: e.target.value })} placeholder="+1" required />
              </Field>
              <Field label="Reason" htmlFor="adj-reason">
                <Select id="adj-reason" value={adjustSel.reason} onChange={(e) => setAdjustSel({ ...adjustSel, reason: e.target.value as typeof REASONS[number]['value'] })}>
                  {REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex items-end">
                <Button type="submit" loading={adjust.isPending} className="w-full">
                  Apply
                </Button>
              </div>
            </div>
            <Field label="Note (optional)" htmlFor="adj-note">
              <Input id="adj-note" value={adjustSel.note} onChange={(e) => setAdjustSel({ ...adjustSel, note: e.target.value })} placeholder="e.g. morning delivery" />
            </Field>
          </Card>
        </form>
      </div>

      <section className="mt-6">
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Stock levels
            </h2>
            <div className="relative">
              <Input
                type="search"
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                placeholder="Filter ingredients…"
                className="mt-0 h-9 max-w-xs pl-9"
              />
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="pb-2 pr-3">Ingredient</th>
                  <th className="pb-2 pr-3">On hand</th>
                  <th className="pb-2 pr-3">Low at</th>
                  <th className="pb-2 pr-3">Cost/unit</th>
                  <th className="pb-2 text-right">Quick adjust</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngredients.map((i) => (
                  <tr key={i.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-foreground">
                      {i.name}
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">{i.unit}</span>
                      {i.low && (
                        <Badge className="ml-2 bg-danger/15 text-danger">Low</Badge>
                      )}
                    </td>
                    <td className={cn('py-2.5 pr-3 tabular-nums', i.low ? 'font-semibold text-danger' : 'text-foreground')}>
                      {formatNumber(Number(i.stockQty), 4)}
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{i.lowStockThreshold}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">${Number(i.costPerUnit).toFixed(2)}</td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="outline" className="size-9 p-0 !px-0" title="−1" onClick={() => adjust.mutate({ ingredientId: i.id, change: -1, reason: 'adjustment' })} type="button">
                          <Minus className="size-4" aria-hidden />
                        </Button>
                        <Button variant="outline" className="size-9 p-0 !px-0" title="+1" onClick={() => adjust.mutate({ ingredientId: i.id, change: 1, reason: 'receipt' })} type="button">
                          <Plus className="size-4" aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredIngredients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center font-light text-muted-foreground">
                      {q ? `No ingredients matching "${debouncedSearch}"` : 'No ingredients yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RecipesCard
          recipes={recipesQuery.data ?? []}
          ingredients={ingredients}
          products={menu.data?.products ?? []}
        />
        <Card>
          <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Recent movements
          </h2>
          <ul className="mt-4 space-y-2">
            {(movements.data ?? []).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <span className="font-medium text-foreground">
                    {ingredientMap.get(m.ingredientId)?.name ?? `#${m.ingredientId}`}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {m.reason}
                    {m.note && ` · ${m.note}`}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={cn('font-semibold tabular-nums', Number(m.change) < 0 ? 'text-danger' : 'text-primary')}>
                    {Number(m.change) > 0 ? '+' : ''}
                    {m.change}
                  </span>
                  <span className="text-xs text-muted-foreground">{clockTime(m.createdAt)}</span>
                </div>
              </li>
            ))}
            {(movements.data ?? []).length === 0 && (
              <li className="py-4 text-center text-sm font-light text-muted-foreground">No movements yet.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  )
}

function RecipesCard({
  recipes,
  ingredients,
  products,
}: {
  recipes: Array<{ productId: number; ingredientId: number; qtyPerServe: string }>
  ingredients: Array<{ id: number; name: string; unit: string }>
  products: Array<{ id: number; name: string }>
}) {
  const utils = trpc.useUtils()
  const setRecipes = trpc.inventory.setRecipes.useMutation({
    onSuccess: () => utils.inventory.recipes.invalidate(),
  })

  const [productId, setProductId] = useState('')
  const [rows, setRows] = useState<Array<{ ingredientId: string; qty: string }>>([{ ingredientId: '', qty: '' }])

  const existingForProduct = (pid: number) => recipes.filter((r) => r.productId === pid)

  function loadProduct(pid: string) {
    setProductId(pid)
    const existing = pid ? existingForProduct(Number(pid)) : []
    setRows(
      existing.length > 0
        ? existing.map((r) => ({ ingredientId: String(r.ingredientId), qty: String(r.qtyPerServe) }))
        : [{ ingredientId: '', qty: '' }],
    )
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!productId) return
    const items = rows
      .filter((r) => r.ingredientId && Number(r.qty) > 0)
      .map((r) => ({
        productId: Number(productId),
        ingredientId: Number(r.ingredientId),
        qtyPerServe: Number(r.qty),
      }))
    setRecipes.mutate(items)
  }

  return (
    <Card>
      <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Recipes · stock used per serve
      </h2>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <Field label="Product" htmlFor="rec-product">
          <Select id="rec-product" value={productId} onChange={(e) => loadProduct(e.target.value)} required>
            <option value="">Select product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Select
                value={row.ingredientId}
                onChange={(e) => setRows(rows.map((r, i) => (i === idx ? { ...r, ingredientId: e.target.value } : r)))}
              >
                <option value="">Ingredient…</option>
                {ingredients.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.unit})
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                step="any"
                min="0"
                value={row.qty}
                onChange={(e) => setRows(rows.map((r, i) => (i === idx ? { ...r, qty: e.target.value } : r)))}
                placeholder="Qty"
                className="w-24"
              />
              <Button
                variant="ghost"
               
                className="size-9 shrink-0 p-0 !px-0 text-muted-foreground hover:text-danger"
                type="button"
                onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                disabled={rows.length === 1}
                title="Remove row"
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
           
            className="size-9 p-0 !px-0"
            onClick={() => setRows([...rows, { ingredientId: '', qty: '' }])}
            title="Add row"
          >
            <Plus className="size-4" aria-hidden />
          </Button>
          <Button type="submit" loading={setRecipes.isPending}>
            <Save className="size-4" aria-hidden /> Save recipe
          </Button>
        </div>
      </form>
    </Card>
  )
}
