import { betterAuth } from 'better-auth'
import { bearer } from 'better-auth/plugins'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import type { IncomingMessage } from 'node:http'
import * as schema from '@cribstone/db'
import { db } from '../db'
import { env } from '../env'
import type { AuthUser } from './auth'

export const STAFF_BASE_PATH = '/api/staff-auth'
export const STAFF_COOKIE = 'gw.session_token'

/** Mount/browser origins allowed for the staff (admin) instance. */
const staffOrigins = [
  env.ADMIN_ORIGIN,
  'tauri://localhost',
  'http://tauri.localhost',
  ...env.ADDITIONAL_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
]

export const staffAuth = betterAuth({
  secret: env.STAFF_AUTH_SECRET ?? env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: STAFF_BASE_PATH,
  trustedOrigins: staffOrigins,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.staffUsers,
      session: schema.staffSessions,
      account: schema.staffAccounts,
      verification: schema.staffVerifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'barista',
        input: true,
      },
      shopId: {
        type: 'number',
        required: true,
        input: true,
      },
      active: {
        type: 'boolean',
        required: true,
        defaultValue: true,
        input: true,
      },
    },
  },
  advanced: {
    cookiePrefix: 'gw',
  },
  plugins: [bearer()],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh every day
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
})

export type StaffSessionUser = NonNullable<
  Awaited<ReturnType<typeof staffAuth.api.getSession>>
>['user']

/** The Better Auth user record plus our additional fields (typed at runtime). */
type StaffBAUser = {
  id: string
  email: string
  role?: string
  shopId?: number | string
  active?: boolean
}

/** Build session headers from an Express req (Bearer transport or cookies). */
function sessionHeaders(
  req: IncomingMessage,
  cookies: Record<string, string> | undefined,
): Headers {
  const headers = new Headers()
  // Forward the raw Authorization header when present so the bearer plugin can
  // sign the bare token into a proper session cookie for getSession to resolve.
  if (req.headers.authorization) {
    headers.set('authorization', req.headers.authorization)
    return headers
  }
  const token = cookies?.[STAFF_COOKIE]
  if (token) headers.set('cookie', `${STAFF_COOKIE}=${token}`)
  return headers
}

/** Resolve the authenticated staff user (AuthUser shape) for a request, or null. */
export async function getStaffUser(
  req: IncomingMessage,
  cookies?: Record<string, string>,
): Promise<AuthUser | null> {
  const session = await staffAuth.api.getSession({
    headers: sessionHeaders(req, cookies),
  })
  const user = session?.user as StaffBAUser | undefined
  if (!user || user.active === false) return null
  return {
    id: user.id,
    shopId: Number(user.shopId),
    email: user.email,
    role: (user.role as AuthUser['role']) ?? 'barista',
  }
}
