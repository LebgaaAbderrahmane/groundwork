import { and, asc, desc, eq, gte, lte, ne, sql } from 'drizzle-orm'
import { ingredients, orderItems, orders } from '@cribstone/db'
import { protectedProcedure, router } from '../trpc'

function startOfDay(d: Date) {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return startOfDay(d)
}

export const analyticsRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const shopId = ctx.user.shopId
    const today = startOfDay(new Date())

    const [summary] = await ctx.db
      .select({
        orderCount: sql<number>`count(*)::int`,
        revenuePence: sql<number>`coalesce(sum(${orders.totalPence}), 0)::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.shopId, shopId),
          gte(orders.createdAt, today),
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
          gte(orders.createdAt, today),
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
          gte(orders.createdAt, today),
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

  revenueTrend: protectedProcedure.query(async ({ ctx }) => {
      const shopId = ctx.user.shopId
      const from = daysAgo(29)

      const rows = await ctx.db
        .select({
          day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
          orders: sql<number>`count(*)::int`,
          revenue: sql<number>`coalesce(sum(${orders.totalPence}), 0)::int`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.shopId, shopId),
            gte(orders.createdAt, from),
            ne(orders.status, 'cancelled'),
          ),
        )
        .groupBy(sql`1`)
        .orderBy(asc(sql`1`))

      return rows
    }),

  periodComparison: protectedProcedure.query(async ({ ctx }) => {
    const shopId = ctx.user.shopId
    const today = startOfDay(new Date())
    const yesterday = daysAgo(1)
    const lastWeekStart = daysAgo(13)
    const thisWeekStart = daysAgo(6)

    const [thisWeek] = await ctx.db
      .select({
        orderCount: sql<number>`count(*)::int`,
        revenuePence: sql<number>`coalesce(sum(${orders.totalPence}), 0)::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.shopId, shopId),
          gte(orders.createdAt, thisWeekStart),
          lte(orders.createdAt, today),
          ne(orders.status, 'cancelled'),
        ),
      )

    const [lastWeek] = await ctx.db
      .select({
        orderCount: sql<number>`count(*)::int`,
        revenuePence: sql<number>`coalesce(sum(${orders.totalPence}), 0)::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.shopId, shopId),
          gte(orders.createdAt, lastWeekStart),
          lte(orders.createdAt, yesterday),
          ne(orders.status, 'cancelled'),
        ),
      )

    const [todaySummary] = await ctx.db
      .select({
        orderCount: sql<number>`count(*)::int`,
        revenuePence: sql<number>`coalesce(sum(${orders.totalPence}), 0)::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.shopId, shopId),
          gte(orders.createdAt, today),
          ne(orders.status, 'cancelled'),
        ),
      )

    const avgOrderPence = (rev: number, count: number) =>
      count > 0 ? Math.round(rev / count) : 0

    function delta(current: number, previous: number) {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    return {
      today: {
        orders: todaySummary.orderCount,
        revenue: todaySummary.revenuePence,
        avgOrder: avgOrderPence(todaySummary.revenuePence, todaySummary.orderCount),
      },
      thisWeek: {
        orders: thisWeek.orderCount,
        revenue: thisWeek.revenuePence,
        avgOrder: avgOrderPence(thisWeek.revenuePence, thisWeek.orderCount),
      },
      deltas: {
        revenue: delta(thisWeek.revenuePence, lastWeek.revenuePence),
        orders: delta(thisWeek.orderCount, lastWeek.orderCount),
        avgOrder: delta(
          avgOrderPence(thisWeek.revenuePence, thisWeek.orderCount),
          avgOrderPence(lastWeek.revenuePence, lastWeek.orderCount),
        ),
      },
    }
  }),
})
