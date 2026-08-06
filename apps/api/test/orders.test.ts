import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'

const app = createApp()
const FLAT_WHITE_ID = 1
const OAT = { id: 2, label: 'Oat', priceDeltaPence: 30 }
const LARGE = { id: 5, label: 'Large', priceDeltaPence: 50 }

async function ownerAgent() {
  const agent = request.agent(app)
  await agent
    .post('/api/trpc/auth.login')
    .send({ email: 'jamie@groundworkcoffee.co.uk', password: 'groundwork2026' })
  return agent
}

function orderPayload(opts: { phone?: string } = {}) {
  return {
    type: 'pickup',
    items: [
      {
        productId: FLAT_WHITE_ID,
        name: 'Flat White',
        unitPricePence: 350,
        quantity: 1,
        options: [OAT, LARGE],
      },
    ],
    subtotalPence: 430,
    totalPence: 430,
    paymentMethod: 'in_store',
    customerName: 'Test Customer',
    customerPhone: opts.phone,
  }
}

describe('orders', () => {
  it('creates an order with server-computed totals and option snapshot', async () => {
    const res = await request(app)
      .post('/api/trpc/orders.create')
      .send(orderPayload())

    expect(res.status).toBe(200)
    const { orderId, totalPence, status } = res.body.result.data
    expect(orderId).toBeGreaterThan(0)
    expect(totalPence).toBe(430)
    expect(status).toBe('received')
  })

  it('rejects an order missing a required option', async () => {
    const res = await request(app).post('/api/trpc/orders.create').send({
      type: 'pickup',
      items: [
        {
          productId: FLAT_WHITE_ID,
          name: 'Flat White',
          unitPricePence: 350,
          quantity: 1,
          options: [],
        },
      ],
      subtotalPence: 350,
      totalPence: 350,
      paymentMethod: 'in_store',
      customerName: 'No Milk Person',
    })
    expect(res.status).toBe(400)
  })

  it('appears in the admin queue and advances through the pipeline', async () => {
    const agent = await ownerAgent()

    const created = await request(app)
      .post('/api/trpc/orders.create')
      .send(orderPayload({ phone: '07700 900123' }))
    const orderId = created.body.result.data.orderId

    const queue = await agent.get('/api/trpc/orders.queue')
    expect(queue.status).toBe(200)
    const found = queue.body.result.data.find((o: { id: number }) => o.id === orderId)
    expect(found).toBeDefined()
    expect(found.status).toBe('received')
    expect(found.items[0].name).toBe('Flat White')

    for (const expected of ['making', 'ready', 'collected']) {
      const adv = await agent
        .post('/api/trpc/orders.advanceStatus')
        .send({ orderId })
      expect(adv.status).toBe(200)
      expect(adv.body.result.data.status).toBe(expected)
    }
  })

  it('deducts inventory via recipes when an order is placed', async () => {
    const agent = await ownerAgent()
    const before = await agent.get('/api/trpc/inventory.list')
    const beforeStock = (name: string) =>
      Number(
        before.body.result.data.find((i: { name: string }) => i.name === name)
          .stockQty,
      )

    await request(app).post('/api/trpc/orders.create').send(orderPayload())

    const after = await agent.get('/api/trpc/inventory.list')
    const afterStock = (name: string) =>
      Number(
        after.body.result.data.find((i: { name: string }) => i.name === name)
          .stockQty,
      )

    expect(afterStock('Whole milk')).toBeCloseTo(beforeStock('Whole milk') - 0.15, 5)
    expect(afterStock('Espresso beans')).toBeCloseTo(beforeStock('Espresso beans') - 0.02, 5)
  })

  it('creates a loyalty customer from a phone number', async () => {
    const agent = await ownerAgent()
    const created = await request(app)
      .post('/api/trpc/orders.create')
      .send(orderPayload({ phone: '07700 900456' }))
    expect(created.status).toBe(200)

    const phone = encodeURIComponent(JSON.stringify({ phone: '07700 900456' }))
    const found = await agent.get(`/api/trpc/customers.search?input=${phone}`)
    expect(found.status).toBe(200)
    expect(found.body.result.data).not.toBeNull()
    expect(found.body.result.data.loyaltyPoints).toBe(1)

    const recent = await request(app).get(`/api/trpc/orders.myRecent?input=${phone}`)
    expect(recent.status).toBe(200)
    expect(recent.body.result.data.length).toBeGreaterThan(0)
  })
})
