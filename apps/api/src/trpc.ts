import { initTRPC, TRPCError } from '@trpc/server'
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import { db } from './db'
import { ACCESS_COOKIE, verifyAccessToken, type AuthUser } from './lib/auth'

export type Context = {
  db: typeof db
  req: CreateExpressContextOptions['req']
  res: CreateExpressContextOptions['res']
  user: AuthUser | null
}

export function createContext(opts: CreateExpressContextOptions): Context {
  return {
    db,
    req: opts.req,
    res: opts.res,
    user: null,
  }
}

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

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
