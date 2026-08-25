import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { and, asc, eq } from 'drizzle-orm'
import { tables } from '@cribstone/db'
import { tableInput } from '@cribstone/shared'
import { protectedProcedure, ownerProcedure, router } from '../trpc'

const tableIdInput = z.object({ id: z.number().int().positive() })

export const tablesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(tables)
      .where(eq(tables.shopId, ctx.user.shopId))
      .orderBy(asc(tables.label))
  }),

  create: ownerProcedure.input(tableInput).mutation(async ({ ctx, input }) => {
    const [table] = await ctx.db
      .insert(tables)
      .values({
        shopId: ctx.user.shopId,
        label: input.label,
        qrToken: crypto.randomUUID(),
      })
      .returning()
    return table
  }),

  regenerateQR: ownerProcedure.input(tableIdInput).mutation(async ({ ctx, input }) => {
    const [table] = await ctx.db
      .update(tables)
      .set({ qrToken: crypto.randomUUID() })
      .where(and(eq(tables.id, input.id), eq(tables.shopId, ctx.user.shopId)))
      .returning()
    if (!table) throw new TRPCError({ code: 'NOT_FOUND' })
    return table
  }),

  remove: ownerProcedure.input(tableIdInput).mutation(async ({ ctx, input }) => {
    const rows = await ctx.db
      .delete(tables)
      .where(and(eq(tables.id, input.id), eq(tables.shopId, ctx.user.shopId)))
      .returning()
    if (rows.length === 0) throw new TRPCError({ code: 'NOT_FOUND' })
    return { ok: true }
  }),
})
