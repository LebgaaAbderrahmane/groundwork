import { createHash, randomBytes } from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import { env } from '../env'
import type { UserRole } from '@groundwork/shared'

export const ACCESS_COOKIE = 'gw_access'
export const REFRESH_COOKIE = 'gw_refresh'

export type AuthUser = {
  id: number
  shopId: number
  email: string
  role: UserRole
}

const secret = new TextEncoder().encode(env.JWT_SECRET)
const ACCESS_TTL = '15m'

export async function signAccessToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    shopId: user.shopId,
    role: user.role,
    email: user.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(secret)
}

export async function verifyAccessToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    if (
      !payload.sub ||
      typeof payload.shopId !== 'number' ||
      typeof payload.role !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      return null
    }
    return {
      id: Number(payload.sub),
      shopId: payload.shopId,
      role: payload.role as UserRole,
      email: payload.email,
    }
  } catch {
    return null
  }
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
