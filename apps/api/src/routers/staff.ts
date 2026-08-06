import { TRPCError } from '@trpc/server'
import { and, asc, eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { users } from '@groundwork/db'
import {
  inviteStaffInput,
  setActiveInput,
  updateRoleInput,
} from '@groundwork/shared'
import { ownerProcedure, router } from '../trpc'

const publicUser = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  active: users.active,
  createdAt: users.createdAt,
}

export const staffRouter = router({
  list: ownerProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select(publicUser)
      .from(users)
      .where(eq(users.shopId, ctx.user.shopId))
      .orderBy(asc(users.createdAt))
  }),

  invite: ownerProcedure.input(inviteStaffInput).mutation(async ({ ctx, input }) => {
    const [existing] = await ctx.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email.toLowerCase().trim()))
      .limit(1)
    if (existing) {
      throw new TRPCError({ code: 'CONFLICT', message: 'A user with this email exists' })
    }

    const [user] = await ctx.db
      .insert(users)
      .values({
        shopId: ctx.user.shopId,
        name: input.name,
        email: input.email.toLowerCase().trim(),
        passwordHash: await bcrypt.hash(input.password, 12),
        role: input.role,
        active: 1,
      })
      .returning(publicUser)
    return user
  }),

  updateRole: ownerProcedure.input(updateRoleInput).mutation(async ({ ctx, input }) => {
    if (input.userId === ctx.user.id && input.role !== 'owner') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot demote yourself' })
    }
    const [user] = await ctx.db
      .update(users)
      .set({ role: input.role })
      .where(and(eq(users.id, input.userId), eq(users.shopId, ctx.user.shopId)))
      .returning(publicUser)
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' })
    return user
  }),

  setActive: ownerProcedure.input(setActiveInput).mutation(async ({ ctx, input }) => {
    if (input.userId === ctx.user.id && !input.active) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot deactivate yourself' })
    }
    const [user] = await ctx.db
      .update(users)
      .set({ active: input.active ? 1 : 0 })
      .where(and(eq(users.id, input.userId), eq(users.shopId, ctx.user.shopId)))
      .returning(publicUser)
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' })
    return user
  }),
})
