import { z } from 'zod'
import { INVENTORY_REASON } from './domain'

export const ingredientInput = z.object({
  name: z.string().min(1).max(80),
  unit: z.string().min(1).max(20),
  stockQty: z.number().nonnegative(),
  lowStockThreshold: z.number().nonnegative().default(0),
  costPerUnit: z.number().nonnegative().default(0),
})

export const adjustStockInput = z.object({
  ingredientId: z.number().int().positive(),
  change: z.number().finite(),
  reason: z.enum(INVENTORY_REASON),
  note: z.string().max(300).optional(),
})

export const recipeInput = z.object({
  productId: z.number().int().positive(),
  ingredientId: z.number().int().positive(),
  qtyPerServe: z.number().positive(),
})
