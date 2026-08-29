import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { staffAgent } from './helpers'

const app = createApp()

type MenuProduct = {
  id: number
  name: string
  optionGroups: Array<{
    name: string
    options: Array<{ id: number; label: string; priceDeltaPence: number }>
  }>
}

async function flatWhite(): Promise<MenuProduct> {
  const res = await request(app).get('/api/trpc/menu.publicMenu').query({ input: '{}' })
  const products = res.body.result.data.categories.flatMap(
    (c: { products: MenuProduct[] }) => c.products,
  )
  return products.find((p: MenuProduct) => p.name === 'Flat White') as MenuProduct
}

function pickOption(product: MenuProduct, group: string, label?: string) {
  const g = product.optionGroups.find((x) => x.name === group)
  if (!g) throw new Error(`group ${group} missing`)
  return g.options.find((o) => o.label === label) ?? g.options[0]
}

/** Place a real order so the analytics aggregates see it. */
async function placeOrder() {
  const fw = await flatWhite()
  const milk = pickOption(fw, 'Milk', 'Oat')
  const size = pickOption(fw, 'Size', 'Large')
  const res = await request(app).post('/api/trpc/orders.create').send({
    type: 'pickup',
    items: [
      {
        productId: fw.id,
        name: 'Flat White',
        unitPricePence: 350,
        quantity: 1,
        options: [milk, size],
      },
    ],
    subtotalPence: 350,
    totalPence: 350,
    paymentMethod: 'card',
    customerName: 'Analytics Test',
  })
  expect(res.status).toBe(200)
}

describe('analytics', () => {
  it('forbids an unauthenticated request', async () => {
    const res = await request(app).get('/api/trpc/analytics.dashboard')
    expect(res.status).toBe(401)
  })

  it('dashboard reflects today orders, revenue, top products, and low stock', async () => {
    const agent = await staffAgent(app)
    await placeOrder()

    const res = await agent.get('/api/trpc/analytics.dashboard')
    expect(res.status).toBe(200)
    const data = res.body.result.data

    expect(data.summary.orderCount).toBeGreaterThan(0)
    expect(data.summary.revenuePence).toBeGreaterThan(0)

    const top = data.topProducts.find((p: { name: string }) => p.name === 'Flat White')
    expect(top).toBeDefined()
    expect(top.quantity).toBeGreaterThan(0)

    expect(Array.isArray(data.busyHours)).toBe(true)
    expect(data.lowStock.some((i: { name: string }) => i.name === 'Oat milk')).toBe(true)
  })

  it('revenueTrend returns a time series', async () => {
    const agent = await staffAgent(app)
    await placeOrder()

    const res = await agent.get('/api/trpc/analytics.revenueTrend')
    expect(res.status).toBe(200)
    const rows = res.body.result.data
    expect(Array.isArray(rows)).toBe(true)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0]).toHaveProperty('day')
    expect(rows[0]).toHaveProperty('revenue')
  })

  it('periodComparison returns today/thisWeek and deltas', async () => {
    const agent = await staffAgent(app)
    await placeOrder()

    const res = await agent.get('/api/trpc/analytics.periodComparison')
    expect(res.status).toBe(200)
    const data = res.body.result.data
    expect(data.today.orders).toBeGreaterThan(0)
    expect(typeof data.thisWeek.revenue).toBe('number')
    expect(data.deltas).toHaveProperty('revenue')
    expect(data.deltas).toHaveProperty('orders')
    expect(data.deltas).toHaveProperty('avgOrder')
  })
})
