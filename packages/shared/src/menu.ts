import { z } from 'zod'

export const categoryInput = z.object({
  name: z.string().min(1).max(60),
  sort: z.number().int().default(0),
  active: z.boolean().default(true),
})

export const productInput = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  pricePence: z.number().int().nonnegative(),
  imageUrl: z.string().url().optional(),
  dietaryTags: z.array(z.string()).default([]),
  sort: z.number().int().default(0),
  active: z.boolean().default(true),
})

export const optionGroupInput = z.object({
  productId: z.number().int().positive(),
  name: z.string().min(1).max(60),
  required: z.boolean().default(false),
  min: z.number().int().min(0).default(0),
  max: z.number().int().min(1).default(1),
})

export const optionInput = z.object({
  groupId: z.number().int().positive(),
  label: z.string().min(1).max(60),
  priceDeltaPence: z.number().int().default(0),
})

export const reorderInput = z.object({
  items: z.array(
    z.object({
      id: z.number().int().positive(),
      sort: z.number().int(),
    }),
  ),
})
