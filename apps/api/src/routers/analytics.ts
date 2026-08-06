import { and, asc, desc, eq, gte, lte, ne, sql } from 'drizzle-orm'
import { ingredients, orderItems, orders } from '@groundwork/db'
import { protectedProcedure, router } from '../trpc'

export const analyticsRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const shopId = ctx.user.shopId
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const [summary] = await ctx.db
      .select({
        orderCount: sql<number>`count(*)::int`,
        revenuePence: sql<number>`coalesce(sum(${orders.totalPence}), 0)::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.shopId, shopId),
          gte(orders.createdAt, startOfDay),
          ne(orders.status, 'cancelled'),
        ),
      )

    const topProducts = await ctx.db
      .select({
        name: orderItems.nameSnapshot,
        quantity: sql<number>`sum(${orderItems.quantity})::int`,
        revenuePence: sql<number>`sum(${orderItems.lineTotalPence})::int`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.shopId, shopId),
          gte(orders.createdAt, startOfDay),
          ne(orders.status, 'cancelled'),
        ),
      )
      .groupBy(orderItems.nameSnapshot)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(5)

    const busyHours = await ctx.db
      .select({
        hour: sql<number>`extract(hour from ${orders.createdAt})::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.shopId, shopId),
          gte(orders.createdAt, startOfDay),
          ne(orders.status, 'cancelled'),
        ),
      )
      .groupBy(sql`1`)
      .orderBy(asc(sql`1`))

    const lowStock = await ctx.db
      .select({ id: ingredients.id, name: ingredients.name })
      .from(ingredients)
      .where(
        and(
          eq(ingredients.shopId, shopId),
          lte(ingredients.stockQty, ingredients.lowStockThreshold),
        ),
      )
      .orderBy(asc(ingredients.name))

    return {
      summary: {
        orderCount: summary.orderCount,
        revenuePence: summary.revenuePence,
        averageOrderPence:
          summary.orderCount > 0
            ? Math.round(summary.revenuePence / summary.orderCount)
            : 0,
      },
      topProducts,
      busyHours,
      lowStock,
    }
  }),
})
