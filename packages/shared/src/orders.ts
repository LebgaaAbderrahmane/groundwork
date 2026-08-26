import { z } from 'zod'
import { PAYMENT_METHOD, ORDER_TYPE } from './domain'

export const optionSelectionSchema = z.object({
  id: z.number().int().positive(),
  label: z.string(),
  priceDeltaPence: z.number().int(),
})

export const cartLineSchema = z.object({
  productId: z.number().int().positive(),
  name: z.string(),
  unitPricePence: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
  options: z.array(optionSelectionSchema).default([]),
})

export const createOrderInput = z.object({
  type: z.enum(ORDER_TYPE).default('pickup'),
  items: z.array(cartLineSchema).min(1),
  subtotalPence: z.number().int().nonnegative(),
  totalPence: z.number().int().nonnegative(),
  paymentMethod: z.enum(PAYMENT_METHOD).default('in_store'),
  customerName: z.string().min(1).max(80),
  customerPhone: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
  pickupAt: z.string().datetime().optional(),
  tableToken: z.string().uuid().optional(),
})

export const tableByTokenInput = z.object({
  token: z.string().uuid(),
})

export const advanceOrderInput = z.object({
  orderId: z.number().int().positive(),
})

export const cancelOrderInput = z.object({
  orderId: z.number().int().positive(),
})

export const myOrdersInput = z.object({
  phone: z.string().min(3).max(20),
})
