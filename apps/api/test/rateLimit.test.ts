import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'

const ORIGIN = 'http://localhost:5174'

describe('rate limiting', () => {
  function limitedApp() {
    return createApp({
      authWindowMs: 60_000,
      authLimit: 3,
      orderWindowMs: 60_000,
      orderLimit: 3,
    })
  }

  it('throttles staff sign-in after the per-IP limit', async () => {
    const app = limitedApp()
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post('/api/staff-auth/sign-in/email')
        .set('Origin', ORIGIN)
        .send({ email: 'nobody@cribstonecoffee.com', password: 'wrong' })
      expect(res.status).toBe(401)
    }

    const blocked = await request(app)
      .post('/api/staff-auth/sign-in/email')
      .set('Origin', ORIGIN)
      .send({ email: 'nobody@cribstonecoffee.com', password: 'wrong' })
    expect(blocked.status).toBe(429)
  })

  it('throttles customer auth after the per-IP limit', async () => {
    const app = limitedApp()
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post('/api/auth/sign-in/email')
        .set('Origin', 'http://localhost:5173')
        .send({ email: 'customer@example.com', password: 'wrong' })
      expect(res.status).toBe(401)
    }

    const blocked = await request(app)
      .post('/api/auth/sign-in/email')
      .set('Origin', 'http://localhost:5173')
      .send({ email: 'customer@example.com', password: 'wrong' })
    expect(blocked.status).toBe(429)
  })

  it('throttles public order creation after the per-IP limit', async () => {
    const app = limitedApp()
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post('/api/trpc/orders.create')
        .send({ type: 'pickup', items: [], subtotalPence: 0, totalPence: 0 })
      expect([200, 400]).toContain(res.status)
    }

    const blocked = await request(app)
      .post('/api/trpc/orders.create')
      .send({ type: 'pickup', items: [], subtotalPence: 0, totalPence: 0 })
    expect(blocked.status).toBe(429)
  })

  it('does not throttle health checks', async () => {
    const app = limitedApp()
    for (let i = 0; i < 5; i++) {
      const res = await request(app).get('/api/health')
      expect(res.status).toBe(200)
    }
  })
})
