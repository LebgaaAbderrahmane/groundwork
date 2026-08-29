import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { staffAgent, STAFF } from './helpers'

const app = createApp()

const PHONE = '+1 207 555 0101' // seeded Alice Morgan, 120 points

async function customerId(agent: ReturnType<typeof request.agent>): Promise<number> {
  const q = encodeURIComponent(JSON.stringify({ phone: PHONE }))
  const res = await agent.get(`/api/trpc/customers.search?input=${q}`)
  expect(res.status).toBe(200)
  expect(res.body.result.data).not.toBeNull()
  return res.body.result.data.id
}

describe('customers & loyalty', () => {
  it('looks up a customer by phone (public) and via manager search', async () => {
    const q = encodeURIComponent(JSON.stringify({ phone: PHONE }))
    const pub = await request(app).get(`/api/trpc/customers.byPhone?input=${q}`)
    expect(pub.status).toBe(200)
    expect(pub.body.result.data.name).toBe('Alice Morgan')

    const manager = await staffAgent(app, STAFF.manager)
    const search = await manager.get(`/api/trpc/customers.search?input=${q}`)
    expect(search.status).toBe(200)
  })

  it('lists customers ordered by last visit', async () => {
    const manager = await staffAgent(app, STAFF.manager)
    const res = await manager.get('/api/trpc/customers.list')
    expect(res.status).toBe(200)
    expect(res.body.result.data.length).toBeGreaterThanOrEqual(6)
  })

  it('returns transactions for a customer', async () => {
    const manager = await staffAgent(app, STAFF.manager)
    const id = await customerId(manager)
    const q = encodeURIComponent(JSON.stringify({ phone: PHONE }))
    const res = await manager.get(`/api/trpc/customers.transactions?input=${q}`)
    expect(res.status).toBe(200)
    expect(res.body.result.data).toBeDefined()
    expect(id).toBeGreaterThan(0)
  })

  it('awards points and writes a transaction', async () => {
    const manager = await staffAgent(app, STAFF.manager)
    const id = await customerId(manager)

    const before = await manager.get('/api/trpc/customers.search?input=' + encodeURIComponent(JSON.stringify({ phone: PHONE })))
    const beforePts = before.body.result.data.loyaltyPoints

    const res = await manager
      .post('/api/trpc/customers.awardPoints')
      .send({ customerId: id, points: 10, reason: 'test award' })
    expect(res.status).toBe(200)
    expect(res.body.result.data.loyaltyPoints).toBe(beforePts + 10)

    const after = await manager.get('/api/trpc/customers.search?input=' + encodeURIComponent(JSON.stringify({ phone: PHONE })))
    expect(after.body.result.data.loyaltyPoints).toBe(beforePts + 10)

    const addr = await manager
      .post('/api/trpc/customers.awardPoints')
      .send({ customerId: 999999, points: 1 })
    expect(addr.status).toBe(404)
  })

  it('redeems points when sufficient and rejects when insufficient', async () => {
    const manager = await staffAgent(app, STAFF.manager)
    const id = await customerId(manager)

    const before = await manager.get('/api/trpc/customers.search?input=' + encodeURIComponent(JSON.stringify({ phone: PHONE })))
    const beforePts = before.body.result.data.loyaltyPoints

    // Redemption is a public mutation; use a plain request.
    const ok = await request(app).post('/api/trpc/customers.redeemPoints').send({
      customerId: id,
      points: 10,
      rewardId: 'free_drip',
      orderId: 1,
    })
    expect(ok.status).toBe(200)
    expect(ok.body.result.data.loyaltyPoints).toBe(beforePts - 10)

    // Attempting to redeem more than available (points are now lower) → 400.
    const tooMuch = await request(app).post('/api/trpc/customers.redeemPoints').send({
      customerId: id,
      points: 999999,
      rewardId: 'free_drink',
      orderId: 2,
    })
    expect(tooMuch.status).toBe(400)
  })
})
