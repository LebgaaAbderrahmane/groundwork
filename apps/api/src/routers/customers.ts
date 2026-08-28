import { TRPCError } from '@trpc/server'
import { and, desc, eq } from 'drizzle-orm'
import { customers, loyaltyTransactions } from '@cribstone/db'
import { awardPointsInput, customerByPhoneInput, redeemPointsInput, customerSearchInput } from '@cribstone/shared'
import { publicProcedure, managerProcedure, router } from '../trpc'
import { getCustomerByPhone, redeemLoyalty } from '../services/loyalty'
import { getShopId } from '../services/shop'

export const customersRouter = router({
  byPhone: publicProcedure.input(customerByPhoneInput).query(async ({ ctx, input }) => {
    const shopId = await getShopId(ctx.db)
    return getCustomerByPhone(ctx.db, shopId, input.phone)
  }),

  search: managerProcedure.input(customerSearchInput).query(async ({ ctx, input }) => {
    return getCustomerByPhone(ctx.db, ctx.user.shopId, input.phone)
  }),

  list: managerProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(customers)
      .where(eq(customers.shopId, ctx.user.shopId))
      .orderBy(desc(customers.lastVisitAt))
      .limit(100)
  }),

  transactions: managerProcedure
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

  redeemPoints: publicProcedure
    .input(redeemPointsInput)
    .mutation(async ({ ctx, input }) => {
      const result = await redeemLoyalty(ctx.db, input.customerId, input.points, input.rewardId, input.orderId)
      if (!result) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Insufficient points' })
      return result
    }),

  awardPoints: managerProcedure
    .input(awardPointsInput)
    .mutation(async ({ ctx, input }) => {
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
