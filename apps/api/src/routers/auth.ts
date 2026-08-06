import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { users, refreshTokens } from '@groundwork/db'
import { loginInput } from '@groundwork/shared'
import { publicProcedure, protectedProcedure, router, type Context } from '../trpc'
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  generateRefreshToken,
  hashToken,
  signAccessToken,
} from '../lib/auth'
import { env } from '../env'

const accessCookieMaxAge = 15 * 60 * 1000
const refreshCookieMaxAge = 30 * 24 * 60 * 60 * 1000

function setAuthCookies(
  res: Context['res'],
  accessToken: string,
  refreshToken: string,
) {
  const secure = env.NODE_ENV === 'production'
  res.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: accessCookieMaxAge,
  })
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: refreshCookieMaxAge,
  })
}

export const authRouter = router({
  login: publicProcedure.input(loginInput).mutation(async ({ ctx, input }) => {
    const [user] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.email, input.email.toLowerCase().trim()))

    if (!user || user.active !== 1) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash)
    if (!valid) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' })
    }

    const accessToken = await signAccessToken({
      id: user.id,
      shopId: user.shopId,
      email: user.email,
      role: user.role,
    })
    const refreshToken = generateRefreshToken()

    const expiresAt = new Date(Date.now() + refreshCookieMaxAge)
    await ctx.db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    })

    setAuthCookies(ctx.res, accessToken, refreshToken)

    return { user: { id: user.id, name: user.name, email: user.email, role: user.role } }
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const token = ctx.req.cookies?.[REFRESH_COOKIE]
    if (token) {
      await ctx.db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, hashToken(token)))
    }
    ctx.res.clearCookie(ACCESS_COOKIE, { path: '/' })
    ctx.res.clearCookie(REFRESH_COOKIE, { path: '/' })
    return { ok: true }
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        shopId: users.shopId,
      })
      .from(users)
      .where(and(eq(users.id, ctx.user.id), eq(users.active, 1)))

    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return { user }
  }),
})
