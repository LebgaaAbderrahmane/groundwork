import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { staffAgent, STAFF } from './helpers'

const app = createApp()

async function list(agent: ReturnType<typeof request.agent>) {
  const res = await agent.get('/api/trpc/inventory.list')
  expect(res.status).toBe(200)
  return res.body.result.data
}

/** Create a scratch ingredient so we never mutate seeded stock other suites rely on. */
async function scratchIngredient(agent: ReturnType<typeof request.agent>) {
  const res = await agent.post('/api/trpc/inventory.createIngredient').send({
    name: `Scratch ${Date.now()}`,
    unit: 'L',
    stockQty: 5,
    lowStockThreshold: 1,
    costPerUnit: 2,
  })
  expect(res.status).toBe(200)
  return res.body.result.data
}

describe('inventory', () => {
  describe('role gating', () => {
    it('allows a manager to list inventory but not a barista', async () => {
      const manager = await staffAgent(app, STAFF.manager)
      const mgrRes = await manager.get('/api/trpc/inventory.list')
      expect(mgrRes.status).toBe(200)

      const barista = await staffAgent(app, STAFF.barista)
      const barRes = await barista.get('/api/trpc/inventory.list')
      expect(barRes.status).toBe(403)
    })
  })

  it('lists ingredients with computed low flag', async () => {
    const agent = await staffAgent(app)
    const rows = await list(agent)
    const wholeMilk = rows.find((r: { name: string }) => r.name === 'Whole milk')
    const oatMilk = rows.find((r: { name: string }) => r.name === 'Oat milk')
    expect(wholeMilk.low).toBe(false)
    expect(oatMilk.low).toBe(true)
  })

  it('lowStock only returns ingredients at or below threshold', async () => {
    const agent = await staffAgent(app)
    const res = await agent.get('/api/trpc/inventory.lowStock')
    expect(res.status).toBe(200)
    const names = res.body.result.data.map((r: { name: string }) => r.name)
    expect(names).toContain('Oat milk')
    expect(names).not.toContain('Whole milk')
  })

  it('adjust updates stock and writes a movement (on a scratch ingredient)', async () => {
    const agent = await staffAgent(app)
    const scratch = await scratchIngredient(agent)
    const before = Number(scratch.stockQty)

    const res = await agent
      .post('/api/trpc/inventory.adjust')
      .send({ ingredientId: scratch.id, change: 5, reason: 'receipt', note: 'test restock' })
    expect(res.status).toBe(200)
    expect(Number(res.body.result.data.stockQty)).toBe(before + 5)

    const movements = await agent.get('/api/trpc/inventory.movements')
    const ids = movements.body.result.data.map((m: { ingredientId: number }) => m.ingredientId)
    expect(ids).toContain(scratch.id)
  })

  it('does not push stock below zero', async () => {
    const agent = await staffAgent(app)
    const scratch = await scratchIngredient(agent)
    const res = await agent
      .post('/api/trpc/inventory.adjust')
      .send({ ingredientId: scratch.id, change: -1000, reason: 'waste' })
    expect(res.status).toBe(200)
    expect(Number(res.body.result.data.stockQty)).toBe(0)
  })

  it('creates and updates an ingredient', async () => {
    const agent = await staffAgent(app)
    const created = await agent.post('/api/trpc/inventory.createIngredient').send({
      name: `Syrup ${Date.now()}`,
      unit: 'L',
      stockQty: 2,
      lowStockThreshold: 1,
      costPerUnit: 5,
    })
    expect(created.status).toBe(200)
    const id = created.body.result.data.id

    const updated = await agent
      .post('/api/trpc/inventory.updateIngredient')
      .send({ id, name: 'Test Syrup v2', stockQty: 3 })
    expect(updated.status).toBe(200)
    expect(updated.body.result.data.name).toBe('Test Syrup v2')
    expect(Number(updated.body.result.data.stockQty)).toBe(3)

    const updated404 = await agent
      .post('/api/trpc/inventory.updateIngredient')
      .send({ id: 999999, name: 'Nope' })
    expect(updated404.status).toBe(404)
  })

  it('lists recipes joined with ingredient names and units', async () => {
    const agent = await staffAgent(app)
    const res = await agent.get('/api/trpc/inventory.recipes')
    expect(res.status).toBe(200)
    const rows = res.body.result.data
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0]).toHaveProperty('ingredientName')
    expect(rows[0]).toHaveProperty('unit')
  })

  it('setRecipes replaces the recipe set for a scratch product', async () => {
    const agent = await staffAgent(app)
    // Create a scratch category + product so we don't touch seeded recipes that
    // the orders test (inventory deduction) relies on.
    const menu = await request(app).get('/api/trpc/menu.publicMenu').query({ input: '{}' })
    const baseCat = menu.body.result.data.categories[0]
    const product = await agent.post('/api/trpc/menu.admin.createProduct').send({
      categoryId: baseCat.id,
      name: `Recipe Test ${Date.now()}`,
      pricePence: 300,
      active: true,
    })
    const productId = product.body.result.data.id

    const ingA = await scratchIngredient(agent)
    const ingB = await scratchIngredient(agent)

    const res = await agent.post('/api/trpc/inventory.setRecipes').send([
      { productId, ingredientId: ingA.id, qtyPerServe: 0.1 },
      { productId, ingredientId: ingB.id, qtyPerServe: 0.02 },
    ])
    expect(res.status).toBe(200)
    expect(res.body.result.data.count).toBe(2)

    const empty = await agent.post('/api/trpc/inventory.setRecipes').send([])
    expect(empty.status).toBe(200)
    expect(empty.body.result.data.count).toBe(0)
  })
})
