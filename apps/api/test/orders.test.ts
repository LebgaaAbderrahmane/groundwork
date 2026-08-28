import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'

const app = createApp()
const ORIGIN = 'http://localhost:5174'
const OWNER_EMAIL = 'braxton@cribstonecoffee.com'
const OWNER_PASSWORD = 'cribstone2026'

type MenuProduct = {
  id: number
  name: string
  pricePence: number
  optionGroups: Array<{
    id: number
    name: string
    required: boolean
    min: number
    max: number
    options: Array<{ id: number; label: string; priceDeltaPence: number }>
  }>
}

async function menuProducts(): Promise<MenuProduct[]> {
  const res = await request(app).get('/api/trpc/menu.publicMenu').query({ input: '{}' })
  expect(res.status).toBe(200)
  return res.body.result.data.categories.flatMap(
    (c: { products: MenuProduct[] }) => c.products,
  )
}

async function flatWhite(): Promise<MenuProduct> {
  const products = await menuProducts()
  const fw = products.find((p) => p.name === 'Flat White')
  if (!fw) throw new Error('Flat White not found in seeded menu')
  return fw
}

function requiredSelection(
  product: MenuProduct,
  groupName: string,
  optionLabel?: string,
): { id: number; label: string; priceDeltaPence: number } {
  const group = product.optionGroups.find((g) => g.name === groupName)
  if (!group) throw new Error(`option group "${groupName}" not found`)
  const option =
    group.options.find((o) => o.label === optionLabel) ?? group.options[0]
  return option
}

/** Sign in as the seeded owner and return a supertest agent with the Bearer token attached. */
async function ownerAgent() {
  const agent = request.agent(app)
  const signIn = await agent
    .post('/api/staff-auth/sign-in/email')
    .set('Origin', ORIGIN)
    .send({ email: OWNER_EMAIL, password: OWNER_PASSWORD })
  expect(signIn.status).toBe(200)
  const token = signIn.body.token
  expect(token).toBeTruthy()
  agent.set('Authorization', `Bearer ${token}`)
  return agent
}

function orderPayload(fw: MenuProduct, phone?: string) {
  const oat = requiredSelection(fw, 'Milk', 'Oat')
  const large = requiredSelection(fw, 'Size', 'Large')
  const lineTotal = fw.pricePence + oat.priceDeltaPence + large.priceDeltaPence
  return {
    payload: {
      type: 'pickup' as const,
      items: [{ productId: fw.id, name: 'Flat White', unitPricePence: 350, quantity: 1, options: [oat, large] }],
      subtotalPence: lineTotal,
      totalPence: lineTotal,
      paymentMethod: 'in_store' as const,
      customerName: 'Test Customer',
      customerPhone: phone,
    },
    lineTotal,
  }
}

describe('orders', () => {
  it('creates an order with server-computed totals and option snapshot', async () => {
    const fw = await flatWhite()
    const { payload, lineTotal } = orderPayload(fw)

    const res = await request(app)
      .post('/api/trpc/orders.create')
      .send(payload)

    expect(res.status).toBe(200)
    const { orderId, totalPence, status } = res.body.result.data
    expect(orderId).toBeGreaterThan(0)
    expect(totalPence).toBe(lineTotal)
    expect(status).toBe('received')
  })

  it('rejects an order missing a required option', async () => {
    const fw = await flatWhite()
    const res = await request(app).post('/api/trpc/orders.create').send({
      type: 'pickup',
      items: [
        { productId: fw.id, name: 'Flat White', unitPricePence: 350, quantity: 1, options: [] },
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
    const fw = await flatWhite()
    const { payload } = orderPayload(fw, '07700 900123')

    const created = await request(app)
      .post('/api/trpc/orders.create')
      .send(payload)
    const orderId = created.body.result.data.orderId

    const queue = await agent.get('/api/trpc/orders.queue')
    expect(queue.status).toBe(200)
    const found = queue.body.result.data.find((o: { id: number }) => o.id === orderId)
    expect(found).toBeDefined()
    expect(found.status).toBe('received')

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

    const fw = await flatWhite()
    const { payload } = orderPayload(fw)
    await request(app).post('/api/trpc/orders.create').send(payload)

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
    const fw = await flatWhite()
    const { payload, lineTotal } = orderPayload(fw, '07700 900456')
    const created = await request(app)
      .post('/api/trpc/orders.create')
      .send(payload)
    expect(created.status).toBe(200)

    const phone = encodeURIComponent(JSON.stringify({ phone: '07700 900456' }))
    const found = await agent.get(`/api/trpc/customers.search?input=${phone}`)
    expect(found.status).toBe(200)
    expect(found.body.result.data).not.toBeNull()
    expect(found.body.result.data.loyaltyPoints).toBe(Math.floor(lineTotal / 100))

    const recent = await request(app).get(`/api/trpc/orders.myRecent?input=${phone}`)
    expect(recent.status).toBe(200)
    expect(recent.body.result.data.length).toBeGreaterThan(0)
  })
})
