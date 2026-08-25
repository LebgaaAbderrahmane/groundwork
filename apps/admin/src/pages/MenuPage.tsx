import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { pounds } from '@/lib/format'
import { Badge, Button, Card, Field, Input, Textarea } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useDocumentTitle } from '@/lib/hooks'

export function MenuPage() {
  useDocumentTitle('Menu')
  const utils = trpc.useUtils()
  const list = trpc.menu.admin.list.useQuery()
  const [newCategory, setNewCategory] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const invalidate = () => utils.menu.admin.list.invalidate()

  const createCategory = trpc.menu.admin.createCategory.useMutation({
    onSuccess: () => {
      invalidate()
      setNewCategory('')
    },
  })

  const deleteCategory = trpc.menu.admin.deleteCategory.useMutation({
    onSuccess: invalidate,
  })

  const updateCategory = trpc.menu.admin.updateCategory.useMutation({
    onSuccess: invalidate,
  })

  const toggleProduct = trpc.menu.admin.updateProduct.useMutation({
    onSuccess: invalidate,
  })

  const deleteProduct = trpc.menu.admin.deleteProduct.useMutation({
    onSuccess: invalidate,
  })

  const data = list.data
  const categories = data?.categories ?? []
  const productsByCategory = new Map<number, NonNullable<typeof data>['products']>()
  for (const cat of categories) productsByCategory.set(cat.id, [])
  for (const p of data?.products ?? []) {
    const arr = productsByCategory.get(p.categoryId) ?? []
    arr.push(p)
    productsByCategory.set(p.categoryId, arr)
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Menu management
          </span>
          <h1 className="mt-1 font-display text-4xl font-bold text-foreground">Menu</h1>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (newCategory.trim()) createCategory.mutate({ name: newCategory.trim() })
          }}
        >
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            className="w-56"
          />
          <Button type="submit" loading={createCategory.isPending}>
            <Plus className="size-4" aria-hidden /> Add
          </Button>
        </form>
      </header>

      <div className="mt-8 space-y-6">
        {list.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!list.isLoading && categories.length === 0 && (
          <p className="text-sm font-light text-muted-foreground">
            No categories yet — add your first one above.
          </p>
        )}

        {categories.map((cat) => (
          <Card key={cat.id}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-foreground">
                  {cat.name}
                </h2>
                <Badge
                  className={cn(
                    cat.active ? 'bg-background text-muted-foreground ring-1 ring-border' : 'bg-surface text-muted-foreground',
                  )}
                >
                  {cat.active ? 'Visible' : 'Hidden'}
                </Badge>
                <Badge className="bg-background text-muted-foreground ring-1 ring-border">
                  {(productsByCategory.get(cat.id) ?? []).length} items
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2" title="Visible to customers">
                  <input
                    type="checkbox"
                    checked={cat.active === 1}
                    onChange={(e) =>
                      updateCategory.mutate({
                        id: cat.id,
                        active: e.target.checked,
                      })
                    }
                    className="size-4 accent-[hsl(var(--primary))]"
                  />
                  <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                    Live
                  </span>
                </label>
                <Button
                  variant="outline"
                  onClick={() =>
                    deleteCategory.mutate(
                      { id: cat.id },
                      {
                        onError: (err) => alert(err.message),
                      },
                    )
                  }
                  loading={deleteCategory.isPending}
                  title="Delete category"
                  type="button"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {(productsByCategory.get(cat.id) ?? []).map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  expanded={expanded === p.id}
                  onToggleExpand={() => setExpanded(expanded === p.id ? null : p.id)}
                  onToggleActive={(active) => toggleProduct.mutate({ id: p.id, active })}
                  onDelete={() =>
                    deleteProduct.mutate({ id: p.id }, { onError: (err) => alert(err.message) })
                  }
                />
              ))}
              <AddProduct categoryId={cat.id} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

type Product = {
  id: number
  name: string
  description: string | null
  pricePence: number
  active: number | boolean
  categoryId: number
}

function ProductRow({
  product,
  expanded,
  onToggleExpand,
  onToggleActive,
  onDelete,
}: {
  product: Product
  expanded: boolean
  onToggleExpand: () => void
  onToggleActive: (active: boolean) => void
  onDelete: () => void
}) {
  const active = product.active === 1 || product.active === true

  return (
    <div className="rounded-lg border border-border/70 bg-surface/50">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <span
            className={cn(
              'size-2 rounded-full',
              active ? 'bg-primary' : 'bg-border',
            )}
          />
          <span className={cn('text-sm font-medium text-foreground', !active && 'text-muted-foreground line-through')}>
            {product.name}
          </span>
          {expanded ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>
        <span className="text-sm font-semibold text-foreground">
          {pounds(product.pricePence)}
        </span>
        <label className="flex cursor-pointer items-center gap-2" title="Visible to customers">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => onToggleActive(e.target.checked)}
            className="size-4 accent-[hsl(var(--primary))]"
          />
          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Live
          </span>
        </label>
        <Button variant="ghost" className="size-9 p-0 text-muted-foreground hover:text-danger" onClick={onDelete} title="Delete product">
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>

      {expanded && (
        <ProductDetail product={product} />
      )}
    </div>
  )
}

function ProductDetail({ product }: { product: Product }) {
  const utils = trpc.useUtils()
  const invalidate = () => utils.menu.admin.list.invalidate()
  const list = utils.menu.admin.list.getData()

  const groups = (list?.optionGroups ?? []).filter((g) => g.productId === product.id)

  const createGroup = trpc.menu.admin.createOptionGroup.useMutation({
    onSuccess: invalidate,
  })
  const deleteGroup = trpc.menu.admin.deleteOptionGroup.useMutation({
    onSuccess: invalidate,
  })
  const createOption = trpc.menu.admin.createOption.useMutation({
    onSuccess: invalidate,
  })
  const deleteOption = trpc.menu.admin.deleteOption.useMutation({
    onSuccess: invalidate,
  })

  const [newGroup, setNewGroup] = useState({ name: '', required: false })
  const [newOption, setNewOption] = useState<{ groupId: number; label: string; price: string }>({
    groupId: groups[0]?.id ?? 0,
    label: '',
    price: '',
  })

  return (
    <div className="space-y-4 border-t border-border/70 px-4 py-4">
      <div>
        <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Option groups
        </h3>
        {groups.length === 0 && (
          <p className="mt-2 text-sm font-light text-muted-foreground">
            No options — sold as-is.
          </p>
        )}
        <div className="mt-2 space-y-3">
          {groups.map((g) => (
            <div key={g.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {g.name}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {g.required ? `required, pick ${g.min}–${g.max}` : `optional, up to ${g.max}`}
                  </span>
                </p>
                <Button
                  variant="ghost"
                 
                  className="size-8 p-0 text-muted-foreground hover:text-danger"
                  onClick={() => deleteGroup.mutate({ id: g.id })}
                  title="Delete group"
                  type="button"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
              <ul className="mt-2 space-y-1">
                {(list?.options ?? [])
                  .filter((o) => o.groupId === g.id)
                  .map((o) => (
                    <li key={o.id} className="flex items-center justify-between text-sm text-foreground/80">
                      <span>
                        {o.label}
                        {o.priceDeltaPence > 0 && (
                          <span className="ml-1 text-xs text-accent">
                            +{pounds(o.priceDeltaPence)}
                          </span>
                        )}
                      </span>
                      <Button
                        variant="ghost"
                       
                        className="size-7 p-0 text-muted-foreground hover:text-danger"
                        onClick={() => deleteOption.mutate({ id: o.id })}
                        title="Delete option"
                        type="button"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </li>
                  ))}
              </ul>
              <form
                className="mt-2 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!newOption.label.trim()) return
                  createOption.mutate({
                    groupId: g.id,
                    label: newOption.label.trim(),
                    priceDeltaPence: Math.round(Number(newOption.price || 0) * 100),
                  })
                  setNewOption({ groupId: g.id, label: '', price: '' })
                }}
              >
                <Input
                  value={newOption.groupId === g.id ? newOption.label : ''}
                  onChange={(e) =>
                    setNewOption({ groupId: g.id, label: e.target.value, price: newOption.groupId === g.id ? newOption.price : '' })
                  }
                  placeholder="e.g. Oat milk"
                  className="flex-1"
                />
                <Input
                  value={newOption.groupId === g.id ? newOption.price : ''}
                  onChange={(e) =>
                    setNewOption({ groupId: g.id, label: newOption.groupId === g.id ? newOption.label : '', price: e.target.value })
                  }
                  placeholder="+£0.30"
                  className="w-24"
                />
                <Button type="submit" className="size-9 px-2">
                  <Plus className="size-4" aria-hidden />
                </Button>
              </form>
            </div>
          ))}
        </div>
      </div>

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!newGroup.name.trim()) return
          createGroup.mutate({
            productId: product.id,
            name: newGroup.name.trim(),
            required: newGroup.required,
            min: newGroup.required ? 1 : 0,
            max: 1,
          })
          setNewGroup({ name: '', required: false })
        }}
      >
        <Field label="Add option group" htmlFor={`group-${product.id}`}>
          <Input
            id={`group-${product.id}`}
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            placeholder="e.g. Milk"
            className="w-48"
          />
        </Field>
        <label className="mb-2.5 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={newGroup.required}
            onChange={(e) => setNewGroup({ ...newGroup, required: e.target.checked })}
            className="size-4 accent-[hsl(var(--primary))]"
          />
          Required
        </label>
        <Button type="submit" className="mb-0">
          <Plus className="size-4" aria-hidden /> Add group
        </Button>
      </form>
    </div>
  )
}

function AddProduct({ categoryId }: { categoryId: number }) {
  const utils = trpc.useUtils()
  const invalidate = () => utils.menu.admin.list.invalidate()
  const create = trpc.menu.admin.createProduct.useMutation({
    onSuccess: invalidate,
  })

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', price: '', description: '' })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const price = Math.round(Number(form.price) * 100)
    if (!form.name.trim() || !Number.isFinite(price) || price < 0) return
    create.mutate({
      categoryId,
      name: form.name.trim(),
      pricePence: price,
      description: form.description.trim() || undefined,
    })
    setForm({ name: '', price: '', description: '' })
    setOpen(false)
  }

  if (!open) {
    return (
      <Button variant="outline" className="mt-3 w-full border-dashed" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden /> Add product to {categoryId ? 'category' : 'menu'}
      </Button>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="mt-3 grid gap-3 rounded-lg border border-dashed border-border bg-background p-4 sm:grid-cols-3"
    >
      <Field label="Name" htmlFor={`p-name-${categoryId}`}>
        <Input
          id={`p-name-${categoryId}`}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Cortado"
          required
        />
      </Field>
      <Field label="Price (£)" htmlFor={`p-price-${categoryId}`}>
        <Input
          id={`p-price-${categoryId}`}
          type="number"
          step="0.05"
          min="0"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          placeholder="3.40"
          required
        />
      </Field>
      <div className="flex items-end gap-2">
        <Button type="submit" loading={create.isPending}>Save</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      <div className="sm:col-span-3">
        <Field label="Description (optional)" htmlFor={`p-desc-${categoryId}`}>
          <Textarea
            id={`p-desc-${categoryId}`}
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Two shots, single origin, velvety milk…"
          />
        </Field>
      </div>
    </form>
  )
}
