import { TRPCError } from '@trpc/server'
import { shops } from '@cribstone/db'
import type { DB } from '../db'

export async function getShopId(db: DB) {
  const [shop] = await db.select({ id: shops.id }).from(shops).limit(1)
  if (!shop) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No shop configured' })
  }
  return shop.id
}
