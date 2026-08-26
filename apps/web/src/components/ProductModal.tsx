import { useEffect, useState } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import type { SelectedOption } from '@/store/cart'
import { dollars } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ProductOption = {
  id: number
  label: string
  priceDeltaPence: number
}

export type ProductOptionGroup = {
  id: number
  name: string
  required: boolean
  min: number
  max: number
  options: ProductOption[]
}

export type MenuProduct = {
  id: number
  name: string
  description: string | null
  pricePence: number
  imageUrl: string | null
  dietaryTags: string[]
  optionGroups: ProductOptionGroup[]
}

type ProductModalProps = {
  product: MenuProduct
  onClose: () => void
  onAdd: (options: SelectedOption[], quantity: number) => void
}

export function ProductModal({ product, onClose, onAdd }: ProductModalProps) {
  const [selected, setSelected] = useState<Record<number, number[]>>({})
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function toggle(groupId: number, optionId: number, max: number) {
    setSelected((prev) => {
      const current = prev[groupId] ?? []
      if (max === 1) {
        return { ...prev, [groupId]: current.includes(optionId) ? [] : [optionId] }
      }
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      return { ...prev, [groupId]: next }
    })
  }

  const selectedOptions = product.optionGroups.flatMap((group) =>
    (selected[group.id] ?? [])
      .map((id) => group.options.find((o) => o.id === id))
      .filter((o): o is ProductOption => Boolean(o)),
  )

  const valid = product.optionGroups.every((group) => {
    const count = (selected[group.id] ?? []).length
    return count >= group.min && count <= group.max
  })

  const unitPrice =
    product.pricePence +
    selectedOptions.reduce((sum, o) => sum + o.priceDeltaPence, 0)

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-background shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-52 w-full overflow-hidden sm:h-60">
          {product.imageUrl && (
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          )}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow transition-transform hover:scale-105"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-display text-2xl font-semibold text-foreground">
              {product.name}
            </h3>
            <span className="shrink-0 text-sm font-medium text-accent">
              {dollars(product.pricePence)}
            </span>
          </div>
          {product.description && (
            <p className="mt-1 text-sm font-light text-foreground/60">
              {product.description}
            </p>
          )}

          <div className="mt-6 space-y-6">
            {product.optionGroups.map((group) => {
              const count = (selected[group.id] ?? []).length
              return (
                <fieldset key={group.id}>
                  <legend className="flex w-full items-center justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-foreground">
                    {group.name}
                    <span className="text-muted-foreground">
                      {group.required ? `Select ${group.min}${group.max > 1 ? `–${group.max}` : ''}` : 'Optional'}
                    </span>
                  </legend>
                  <div className="mt-3 space-y-2">
                    {group.options.map((option) => {
                      const isSelected = (selected[group.id] ?? []).includes(option.id)
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggle(group.id, option.id, group.max)}
                          className={cn(
                            'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors duration-200',
                            isSelected
                              ? 'border-primary bg-surface font-medium text-primary'
                              : 'border-border text-foreground/70 hover:border-primary/40',
                          )}
                        >
                          <span>{option.label}</span>
                          {option.priceDeltaPence > 0 && (
                            <span className="text-muted-foreground">
                              +{dollars(option.priceDeltaPence)}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {group.required && count < group.min && (
                    <p className="mt-1.5 text-[10px] uppercase tracking-[0.1em] text-accent">
                      Please select at least {group.min}
                    </p>
                  )}
                </fieldset>
              )
            })}
          </div>

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-5">
            <div className="flex items-center rounded-full border border-border">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex size-10 items-center justify-center text-foreground/70 hover:text-primary"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center text-sm font-medium text-foreground">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex size-10 items-center justify-center text-foreground/70 hover:text-primary"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <Button
              disabled={!valid}
              onClick={() => {
                onAdd(selectedOptions, quantity)
                onClose()
              }}
            >
              Add · {dollars(unitPrice * quantity)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
