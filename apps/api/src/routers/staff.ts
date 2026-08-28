import { TRPCError } from '@trpc/server'
import { and, asc, eq } from 'drizzle-orm'
import { staffUsers } from '@cribstone/db'
import { APIError } from 'better-auth'
import {
  inviteStaffInput,
  setActiveInput,
  updateRoleInput,
} from '@cribstone/shared'
import { ownerProcedure, router, type Context } from '../trpc'
import { staffAuth } from '../lib/staffAuth'

const publicUser = {
  id: staffUsers.id,
  name: staffUsers.name,
  email: staffUsers.email,
  role: staffUsers.role,
  active: staffUsers.active,
  createdAt: staffUsers.createdAt,
}

export const staffRouter = router({
  list: ownerProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select(publicUser)
      .from(staffUsers)
      .where(eq(staffUsers.shopId, ctx.user.shopId))
      .orderBy(asc(staffUsers.createdAt))
  }),

  invite: ownerProcedure.input(inviteStaffInput).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db
      .select({ id: staffUsers.id })
      .from(staffUsers)
      .where(eq(staffUsers.email, input.email.toLowerCase().trim()))
      .limit(1)
    if (existing[0]) {
      throw new TRPCError({ code: 'CONFLICT', message: 'A user with this email exists' })
    }

    try {
      const created = await staffAuth.api.signUpEmail({
        body: {
          name: input.name,
          email: input.email.toLowerCase().trim(),
          password: input.password,
          role: input.role,
          shopId: ctx.user.shopId,
          active: true,
        } as {
          name: string
          email: string
          password: string
          role: (typeof input)['role']
          shopId: number
          active: boolean
        },
        headers: sessionHeaders(ctx),
      })
      const user = created.user as {
        id: string
        name: string
        email: string
        role: string
        createdAt?: Date | string
      }
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as typeof input.role,
        active: true,
        createdAt: new Date(user.createdAt ?? Date.now()),
      }
    } catch (e) {
      const statusCode =
        e instanceof APIError ? e.statusCode : (e as { statusCode?: number }).statusCode
      if (statusCode === 422) {
        throw new TRPCError({ code: 'CONFLICT', message: 'A user with this email exists' })
      }
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create staff member' })
    }
  }),

  updateRole: ownerProcedure.input(updateRoleInput).mutation(async ({ ctx, input }) => {
    if (input.userId === ctx.user.id && input.role !== 'owner') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot demote yourself' })
    }
    const [user] = await ctx.db
      .update(staffUsers)
      .set({ role: input.role })
      .where(and(eq(staffUsers.id, input.userId), eq(staffUsers.shopId, ctx.user.shopId)))
      .returning(publicUser)
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' })
    return user
  }),

  setActive: ownerProcedure.input(setActiveInput).mutation(async ({ ctx, input }) => {
    if (input.userId === ctx.user.id && !input.active) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot deactivate yourself' })
    }
    const [user] = await ctx.db
      .update(staffUsers)
      .set({ active: input.active })
      .where(and(eq(staffUsers.id, input.userId), eq(staffUsers.shopId, ctx.user.shopId)))
      .returning(publicUser)
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' })
    return user
  }),
})

function sessionHeaders(ctx: Context): Headers {
  const headers = new Headers()
  // Forward the raw Authorization header so the bearer plugin signs the bare
  // token into a valid session cookie (consistent with getStaffUser).
  if (ctx.req.headers.authorization) {
    headers.set('authorization', ctx.req.headers.authorization)
  }
  return headers
}
