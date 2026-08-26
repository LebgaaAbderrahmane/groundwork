import { z } from 'zod'

export const customerSearchInput = z.object({
  phone: z.string().min(3).max(20),
})

export const customerByPhoneInput = z.object({
  phone: z.string().min(3).max(20),
})

export const awardPointsInput = z.object({
  customerId: z.number().int().positive(),
  points: z.number().int(),
  reason: z.string().max(200).optional(),
})

export const redeemPointsInput = z.object({
  customerId: z.number().int().positive(),
  points: z.number().int().positive(),
  rewardId: z.string().max(40),
  orderId: z.number().int().positive(),
})

export const settingsInput = z.object({
  shopName: z.string().min(1).max(80),
  address: z.string().max(200),
  phone: z.string().max(20),
  hours: z.string().max(200),
  paymentMode: z.enum(['in_store', 'card']).default('in_store'),
})

export const tableInput = z.object({
  label: z.string().min(1).max(40),
})
