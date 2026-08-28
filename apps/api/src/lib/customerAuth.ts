import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import type { IncomingMessage } from 'node:http'
import * as schema from '@cribstone/db'
import { db } from '../db'
import { env } from '../env'

function splitOrigins(value: string): string[] {
  return value
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
}

function socialProviders() {
  const providers: Record<string, { clientId: string; clientSecret: string }> = {}
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.google = { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
  }
  if (env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET) {
    providers.apple = { clientId: env.APPLE_CLIENT_ID, clientSecret: env.APPLE_CLIENT_SECRET }
  }
  return providers
}

export const customerAuth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  trustedOrigins: [env.WEB_ORIGIN, ...splitOrigins(env.BETTER_AUTH_TRUSTED_ORIGINS)],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.authUsers,
      session: schema.authSessions,
      account: schema.authAccounts,
      verification: schema.authVerifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: socialProviders(),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
})

export type CustomerSessionUser = NonNullable<
  Awaited<ReturnType<typeof customerAuth.api.getSession>>
>['user']

/** Build a Headers object from an Express req so Better Auth can validate the session. */
function requestHeaders(req: IncomingMessage): Headers {
  const headers = new Headers()
  if (req.headers.cookie) headers.set('cookie', req.headers.cookie)
  return headers
}

/** Returns the authenticated customer user for a request, or null. */
export async function getCustomerUser(
  req: IncomingMessage,
): Promise<CustomerSessionUser | null> {
  const session = await customerAuth.api.getSession({ headers: requestHeaders(req) })
  return session?.user ?? null
}
