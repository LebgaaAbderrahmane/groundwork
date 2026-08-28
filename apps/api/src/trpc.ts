import { initTRPC, TRPCError } from '@trpc/server'
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import { db } from './db'
import { ACCESS_COOKIE, verifyAccessToken, type AuthUser } from './lib/auth'
import { getCustomerUser, type CustomerSessionUser } from './lib/customerAuth'

export type Context = {
  db: typeof db
  req: CreateExpressContextOptions['req']
  res: CreateExpressContextOptions['res']
  user: AuthUser | null
  customer: CustomerSessionUser | null
}

export async function createContext(opts: CreateExpressContextOptions): Promise<Context> {
  const customer = await getCustomerUser(opts.req)
  return {
    db,
    req: opts.req,
    res: opts.res,
    user: null,
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

const resolveUser = t.middleware(async ({ ctx, next }) => {
  const token = ctx.req.cookies?.[ACCESS_COOKIE]
  if (!token) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  const user = await verifyAccessToken(token)
  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, user } })
})

export const protectedProcedure = t.procedure.use(resolveUser)

const resolveOwner = t.middleware(({ ctx, next }) => {
  if (ctx.user?.role !== 'owner') {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})

export const ownerProcedure = protectedProcedure.use(resolveOwner)
