import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { env } from './env'
import { createContext } from './trpc'
import { appRouter } from './routers'
import { orderEvents } from './services/events'

export function createApp() {
  const app = express()

  app.use(cors({ origin: [env.WEB_ORIGIN, env.ADMIN_ORIGIN], credentials: true }))
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

  app.use(
    '/api/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  )

  return app
}
