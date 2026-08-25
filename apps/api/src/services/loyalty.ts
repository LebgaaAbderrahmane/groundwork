import { and, eq } from 'drizzle-orm'
import { customers, loyaltyTransactions } from '@cribstone/db'
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
  opts: { name: string; phone?: string; orderId: number },
) {
  if (!opts.phone) return null

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
        loyaltyPoints: existing.loyaltyPoints + 1,
        lastVisitAt: new Date(),
      })
      .where(eq(customers.id, existing.id))
      .returning()

    await db.insert(loyaltyTransactions).values({
      customerId: customer.id,
      points: 1,
      reason: 'Order placed',
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
      loyaltyPoints: 1,
      lastVisitAt: new Date(),
    })
    .returning()

  await db.insert(loyaltyTransactions).values({
    customerId: customer.id,
    points: 1,
    reason: 'Order placed',
    refOrderId: opts.orderId,
  })
  return customer
}
