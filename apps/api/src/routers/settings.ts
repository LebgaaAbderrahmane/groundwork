import { eq } from 'drizzle-orm'
import { shops } from '@groundwork/db'
import { settingsInput } from '@groundwork/shared'
import { protectedProcedure, router, ownerProcedure } from '../trpc'

export const settingsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const [shop] = await ctx.db
      .select()
      .from(shops)
      .where(eq(shops.id, ctx.user.shopId))
      .limit(1)
    return shop
  }),

  update: ownerProcedure.input(settingsInput).mutation(async ({ ctx, input }) => {
    const [shop] = await ctx.db
      .update(shops)
      .set({
        name: input.shopName,
        address: input.address,
        phone: input.phone,
        hours: input.hours,
        paymentMode: input.paymentMode,
      })
      .where(eq(shops.id, ctx.user.shopId))
      .returning()
    return shop
  }),
})
