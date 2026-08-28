import { initTRPC, TRPCError } from '@trpc/server'
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import { db } from './db'
import type { AuthUser } from './lib/auth'
import { getStaffUser } from './lib/staffAuth'
import { getCustomerUser, type CustomerSessionUser } from './lib/customerAuth'

export type Context = {
  db: typeof db
  req: CreateExpressContextOptions['req']
  res: CreateExpressContextOptions['res']
  user: AuthUser | null
  customer: CustomerSessionUser | null
}

export async function createContext(opts: CreateExpressContextOptions): Promise<Context> {
  const cookies = opts.req.cookies as Record<string, string> | undefined
  const [customer, user] = await Promise.all([
    getCustomerUser(opts.req),
    getStaffUser(opts.req, cookies),
  ])
  return {
    db,
    req: opts.req,
    res: opts.res,
    user,
    customer,
  }
}

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const customerProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.customer) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx })
})

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})

export const ownerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'owner') {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})

/** Owner and Manager only (Barista is restricted to order/kitchen ops). */
export const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role === 'barista') {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})
