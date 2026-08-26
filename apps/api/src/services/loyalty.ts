import { and, eq } from 'drizzle-orm'
import { customers, loyaltyTransactions } from '@cribstone/db'
import { earnPoints } from '@cribstone/shared'
import type { DB } from '../db'

export async function getCustomerByPhone(db: DB, shopId: number, phone: string) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.shopId, shopId), eq(customers.phone, phone)))
    .limit(1)
  return customer ?? null
}

export async function applyLoyalty(
  db: DB,
  shopId: number,
  opts: { name: string; phone?: string; orderId: number; totalPence: number },
) {
  if (!opts.phone) return null

  const points = earnPoints(opts.totalPence)
  if (points <= 0) return null

  const [existing] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.shopId, shopId), eq(customers.phone, opts.phone)))
    .limit(1)

  if (existing) {
    const [customer] = await db
      .update(customers)
      .set({
        name: opts.name,
        visits: existing.visits + 1,
        loyaltyPoints: existing.loyaltyPoints + points,
        lastVisitAt: new Date(),
      })
      .where(eq(customers.id, existing.id))
      .returning()

    await db.insert(loyaltyTransactions).values({
      customerId: customer.id,
      points,
      reason: `Earned ${points} pts on $${(opts.totalPence / 100).toFixed(2)} order`,
      refOrderId: opts.orderId,
    })
    return customer
  }

  const [customer] = await db
    .insert(customers)
    .values({
      shopId,
      name: opts.name,
      phone: opts.phone,
      visits: 1,
      loyaltyPoints: points,
      lastVisitAt: new Date(),
    })
    .returning()

  await db.insert(loyaltyTransactions).values({
    customerId: customer.id,
    points,
    reason: `Earned ${points} pts on $${(opts.totalPence / 100).toFixed(2)} order`,
    refOrderId: opts.orderId,
  })
  return customer
}

export async function redeemLoyalty(
  db: DB,
  customerId: number,
  points: number,
  rewardId: string,
  orderId: number,
) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1)

  if (!customer || customer.loyaltyPoints < points) return null

  await db
    .update(customers)
    .set({ loyaltyPoints: customer.loyaltyPoints - points })
    .where(eq(customers.id, customerId))

  await db.insert(loyaltyTransactions).values({
    customerId,
    points: -points,
    reason: `Redeemed ${rewardId}`,
    refOrderId: orderId,
  })

  return { ...customer, loyaltyPoints: customer.loyaltyPoints - points }
}
