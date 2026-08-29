import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { staffAgent, STAFF } from './helpers'

const app = createApp()
const COUNTER_TOKEN = '00000000-0000-4000-8000-000000000001'

describe('tables', () => {
  it('resolves a table by its QR token and rejects unknown tokens', async () => {
    const q = encodeURIComponent(JSON.stringify({ token: COUNTER_TOKEN }))
    const res = await request(app).get(`/api/trpc/tables.byToken?input=${q}`)
    expect(res.status).toBe(200)
    expect(res.body.result.data.label).toBe('Counter')

    const bad = encodeURIComponent(JSON.stringify({ token: 'ffffffff-ffff-4fff-8fff-ffffffffffff' }))
    const notFound = await request(app).get(`/api/trpc/tables.byToken?input=${bad}`)
    expect(notFound.status).toBe(404)
  })

  it('requires auth to list tables', async () => {
    const res = await request(app).get('/api/trpc/tables.list')
    expect(res.status).toBe(401)
  })

  it('creates, lists, regenerates QR, and removes a table (owner)', async () => {
    const owner = await staffAgent(app)

    const created = await owner.post('/api/trpc/tables.create').send({ label: 'Test Nook' })
    expect(created.status).toBe(200)
    const id = created.body.result.data.id
    const originalToken = created.body.result.data.qrToken

    const list = await owner.get('/api/trpc/tables.list')
    const labels = list.body.result.data.map((t: { label: string }) => t.label)
    expect(labels).toContain('Counter')
    expect(labels).toContain('Test Nook')

    const regenerated = await owner
      .post('/api/trpc/tables.regenerateQR')
      .send({ id })
    expect(regenerated.status).toBe(200)
    expect(regenerated.body.result.data.qrToken).not.toBe(originalToken)

    const removed = await owner.post('/api/trpc/tables.remove').send({ id })
    expect(removed.status).toBe(200)
  })

  it('forbids a barista from creating tables', async () => {
    const barista = await staffAgent(app, STAFF.barista)
    const res = await barista.post('/api/trpc/tables.create').send({ label: 'Nope' })
    expect(res.status).toBe(403)
  })

  it('orders placed via table token become dine-in', async () => {
    const fwRes = await request(app).get('/api/trpc/menu.publicMenu').query({ input: '{}' })
    const products = fwRes.body.result.data.categories.flatMap(
      (c: { products: unknown[] }) => c.products,
    )
    const fw = products.find((p: { name: string }) => p.name === 'Flat White')
    const g = fw.optionGroups.find((x: { name: string }) => x.name === 'Milk')
    const oat = g.options.find((o: { label: string }) => o.label === 'Oat')
    const size = fw.optionGroups.find((x: { name: string }) => x.name === 'Size').options[0]

    const res = await request(app).post('/api/trpc/orders.create').send({
      type: 'pickup',
      tableToken: COUNTER_TOKEN,
      items: [
        { productId: fw.id, name: 'Flat White', unitPricePence: 350, quantity: 1, options: [oat, size] },
      ],
      subtotalPence: 380,
      totalPence: 380,
      paymentMethod: 'in_store',
      customerName: 'Table Test Guest',
    })
    expect(res.status).toBe(200)

    const orderId = res.body.result.data.orderId
    const owner = await staffAgent(app)
    const q = encodeURIComponent(JSON.stringify({ orderId }))
    const order = await owner.get(`/api/trpc/orders.byId?input=${q}`)
    expect(order.status).toBe(200)
    expect(order.body.result.data.type).toBe('dine_in')
  })
})
