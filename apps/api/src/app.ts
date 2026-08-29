import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { toNodeHandler } from 'better-auth/node'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { env } from './env'
import { createContext } from './trpc'
import { appRouter } from './routers'
import { customerAuth } from './lib/customerAuth'
import { staffAuth, STAFF_BASE_PATH } from './lib/staffAuth'
import { orderEvents } from './services/events'
import {
  authRateLimit,
  orderCreateRateLimit,
  defaultRateLimitConfig,
  type RateLimitConfig,
} from './services/rateLimit'

export function createApp(rateLimit?: Partial<RateLimitConfig>) {
  const app = express()
  const limitConfig: RateLimitConfig = { ...defaultRateLimitConfig, ...rateLimit }
  const authLimit = authRateLimit(limitConfig)
  const orderLimit = orderCreateRateLimit(limitConfig)

  const additional = env.ADDITIONAL_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  const allowedOrigins = [
    env.WEB_ORIGIN,
    env.ADMIN_ORIGIN,
    'tauri://localhost',
    'http://tauri.localhost',
    ...additional,
  ]

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
        return callback(null, false)
      },
      credentials: true,
    }),
  )

  // Better Auth must be mounted before body-parsing middleware. Rate-limit the
  // auth endpoints per-IP to blunt brute-force / credential-stuffing attempts.
  app.all('/api/auth/*splat', authLimit, toNodeHandler(customerAuth))
  app.all(`${STAFF_BASE_PATH}/*splat`, authLimit, toNodeHandler(staffAuth))

  app.use(express.json())
  app.use(cookieParser())

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    res.write('retry: 3000\n\n')
    const handler = (data: unknown) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }
    orderEvents.on('order:update', handler)
    req.on('close', () => orderEvents.off('order:update', handler))
  })

  // Rate-limit public order creation (spam / abuse protection).
  app.post('/api/trpc/orders.create', orderLimit)

  app.use(
    '/api/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  )

  return app
}
