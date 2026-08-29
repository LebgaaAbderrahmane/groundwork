import type { RequestHandler } from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

export type RateLimitConfig = {
  /** Per-IP window for auth endpoints (staff + customer sign-in etc). */
  authWindowMs: number
  /** Max auth requests per window per IP. */
  authLimit: number
  /** Per-IP window for public order creation. */
  orderWindowMs: number
  /** Max order-create requests per window per IP. */
  orderLimit: number
}

export const defaultRateLimitConfig: RateLimitConfig = {
  authWindowMs: 15 * 60 * 1000,
  authLimit: 20,
  orderWindowMs: 60 * 1000,
  orderLimit: 20,
}

const blockedMessage = { error: 'Too many requests. Please try again later.' }

function limiter(windowMs: number, limit: number): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: blockedMessage,
    keyGenerator: (req) => ipKeyGenerator(req.ip ?? ''),
    // trust proxy is unset (single-instance, direct connections), so tolerate
    // any stray X-Forwarded-For header without aborting the process.
    validate: {
      trustProxy: false,
      xForwardedForHeader: false,
      forwardedHeader: false,
    },
  })
}

/** Per-IP limiter for the Better Auth sign-in/sign-up endpoints. */
export function authRateLimit(config: RateLimitConfig): RequestHandler {
  return limiter(config.authWindowMs, config.authLimit)
}

/** Per-IP limiter guarding the public order-create endpoint. */
export function orderCreateRateLimit(config: RateLimitConfig): RequestHandler {
  return limiter(config.orderWindowMs, config.orderLimit)
}
