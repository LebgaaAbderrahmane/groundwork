import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SelectedOption = {
  id: number
  label: string
  priceDeltaPence: number
}

export type CartLine = {
  key: string
  productId: number
  name: string
  unitPricePence: number
  quantity: number
  options: SelectedOption[]
}

export type CartTable = {
  id: number
  label: string
  token: string
}

type AddInput = {
  productId: number
  name: string
  basePricePence: number
  options: SelectedOption[]
  quantity?: number
}

type CartState = {
  lines: CartLine[]
  pickupIndex: number
  notes: string
  table: CartTable | null
  add: (input: AddInput) => void
  remove: (key: string) => void
  setQuantity: (key: string, quantity: number) => void
  setPickupIndex: (index: number) => void
  setNotes: (notes: string) => void
  setTable: (table: CartTable | null) => void
  clear: () => void
}

export function lineKey(productId: number, options: SelectedOption[]): string {
  const ids = options
    .map((o) => o.id)
    .sort((a, b) => a - b)
    .join(',')
  return `${productId}:${ids}`
}

function unitPrice(input: AddInput): number {
  return (
    input.basePricePence +
    input.options.reduce((sum, o) => sum + o.priceDeltaPence, 0)
  )
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      pickupIndex: 0,
      notes: '',
      table: null,
      add: (input) =>
        set((state) => {
          const key = lineKey(input.productId, input.options)
          const price = unitPrice(input)
          const existing = state.lines.find((l) => l.key === key)
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.key === key
                  ? { ...l, quantity: l.quantity + (input.quantity ?? 1) }
                  : l,
              ),
            }
          }
          return {
            lines: [
              ...state.lines,
              {
                key,
                productId: input.productId,
                name: input.name,
                unitPricePence: price,
                quantity: input.quantity ?? 1,
                options: input.options,
              },
            ],
          }
        }),
      remove: (key) =>
        set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      setQuantity: (key, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.key !== key)
              : state.lines.map((l) => (l.key === key ? { ...l, quantity } : l)),
        })),
      setPickupIndex: (pickupIndex) => set({ pickupIndex }),
      setNotes: (notes) => set({ notes }),
      setTable: (table) => set({ table }),
      clear: () => set({ lines: [], pickupIndex: 0, notes: '', table: null }),
    }),
    { name: 'cribstone-cart' },
  ),
)

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce(
    (sum, l) => sum + l.unitPricePence * l.quantity,
    0,
  )
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0)
}
