import { TRPCError } from '@trpc/server'
import { and, desc, eq } from 'drizzle-orm'
import { customers, loyaltyTransactions } from '@groundwork/db'
import { awardPointsInput, customerSearchInput } from '@groundwork/shared'
import { protectedProcedure, router } from '../trpc'
import { getCustomerByPhone } from '../services/loyalty'

export const customersRouter = router({
  search: protectedProcedure.input(customerSearchInput).query(async ({ ctx, input }) => {
    return getCustomerByPhone(ctx.db, ctx.user.shopId, input.phone)
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(customers)
      .where(eq(customers.shopId, ctx.user.shopId))
      .orderBy(desc(customers.lastVisitAt))
      .limit(100)
  }),

  transactions: protectedProcedure
    .input(customerSearchInput)
    .query(async ({ ctx, input }) => {
      const customer = await getCustomerByPhone(ctx.db, ctx.user.shopId, input.phone)
      if (!customer) return []
      return ctx.db
        .select()
        .from(loyaltyTransactions)
        .where(eq(loyaltyTransactions.customerId, customer.id))
        .orderBy(desc(loyaltyTransactions.createdAt))
    }),

  awardPoints: protectedProcedure
    .input(awardPointsInput)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role === 'barista') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }
      const [customer] = await ctx.db
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.id, input.customerId),
            eq(customers.shopId, ctx.user.shopId),
          ),
        )
        .limit(1)
      if (!customer) throw new TRPCError({ code: 'NOT_FOUND' })

      const [updated] = await ctx.db
        .update(customers)
        .set({ loyaltyPoints: customer.loyaltyPoints + input.points })
        .where(eq(customers.id, customer.id))
        .returning()

      await ctx.db.insert(loyaltyTransactions).values({
        customerId: customer.id,
        points: input.points,
        reason: input.reason,
      })
      return updated
    }),
})
