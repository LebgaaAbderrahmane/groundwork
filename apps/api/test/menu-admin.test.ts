import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { staffAgent, STAFF } from './helpers'

const app = createApp()

async function adminList(agent: ReturnType<typeof request.agent>) {
  const res = await agent.get('/api/trpc/menu.admin.list')
  expect(res.status).toBe(200)
  return res.body.result.data
}

// Discover an existing seeded category via publicMenu (no hardcoded IDs).
async function firstCategoryId(): Promise<number> {
  const res = await request(app).get('/api/trpc/menu.publicMenu').query({ input: '{}' })
  const cats = res.body.result.data.categories
  expect(cats.length).toBeGreaterThan(0)
  return cats[0].id
}

describe('menu admin CRUD', () => {
  describe('role gating', () => {
    it('allows the owner to list admin menu', async () => {
      const agent = await staffAgent(app)
      const data = await adminList(agent)
      expect(data.categories.length).toBeGreaterThanOrEqual(4)
      expect(data.products.length).toBeGreaterThan(0)
    })

    it('forbids a barista from owner menu procedures', async () => {
      const barista = await staffAgent(app, STAFF.barista)
      const res = await barista.get('/api/trpc/menu.admin.list')
      expect(res.status).toBe(403)
    })
  })

  describe('category', () => {
    it('creates, updates, and deletes a category', async () => {
      const agent = await staffAgent(app)

      const created = await agent.post('/api/trpc/menu.admin.createCategory').send({
        name: 'Test Category',
        sort: 99,
        active: true,
      })
      expect(created.status).toBe(200)
      const catId = created.body.result.data.id

      const listed = await adminList(agent)
      const found = listed.categories.find((c: { id: number }) => c.id === catId)
      expect(found.name).toBe('Test Category')

      const updated = await agent
        .post('/api/trpc/menu.admin.updateCategory')
        .send({ id: catId, name: 'Renamed Category', active: true })
      expect(updated.status).toBe(200)
      expect(updated.body.result.data.name).toBe('Renamed Category')

      const deleted = await agent.post('/api/trpc/menu.admin.deleteCategory').send({ id: catId })
      expect(deleted.status).toBe(200)

      const after = await agent.get('/api/trpc/menu.admin.list')
      const stillThere = after.body.result.data.categories.find(
        (c: { id: number }) => c.id === catId,
      )
      expect(stillThere).toBeUndefined()
    })

    it('rejects deleting a category that still has products', async () => {
      const agent = await staffAgent(app)
      const catId = await firstCategoryId()
      const res = await agent.post('/api/trpc/menu.admin.deleteCategory').send({ id: catId })
      expect(res.status).toBe(409)
    })

    it('returns NOT_FOUND when updating a missing category', async () => {
      const agent = await staffAgent(app)
      const res = await agent
        .post('/api/trpc/menu.admin.updateCategory')
        .send({ id: 999999, name: 'Nope' })
      expect(res.status).toBe(404)
    })
  })

  describe('product', () => {
    it('creates, updates, and deletes a product under a category', async () => {
      const agent = await staffAgent(app)
      const catId = await firstCategoryId()

      const created = await agent.post('/api/trpc/menu.admin.createProduct').send({
        categoryId: catId,
        name: 'Test Latte',
        description: 'For tests',
        pricePence: 420,
        dietaryTags: ['vegan'],
        sort: 0,
        active: true,
      })
      expect(created.status).toBe(200)
      const prodId = created.body.result.data.id

      const updated = await agent
        .post('/api/trpc/menu.admin.updateProduct')
        .send({ id: prodId, name: 'Test Latte XL', pricePence: 500 })
      expect(updated.status).toBe(200)
      expect(updated.body.result.data.pricePence).toBe(500)

      const deleted = await agent.post('/api/trpc/menu.admin.deleteProduct').send({ id: prodId })
      expect(deleted.status).toBe(200)
    })

    it('rejects creating a product in an unknown category', async () => {
      const agent = await staffAgent(app)
      const res = await agent
        .post('/api/trpc/menu.admin.createProduct')
        .send({ categoryId: 999999, name: 'Ghost', pricePence: 100 })
      expect(res.status).toBe(400)
    })

    it('conflicts when deleting a product that has past orders (deactivate instead)', async () => {
      const agent = await staffAgent(app)
      // Discover a seeded product that definitely has orders: Flat White.
      const publicMenu = await request(app)
        .get('/api/trpc/menu.publicMenu')
        .query({ input: '{}' })
      const flatWhite = publicMenu.body.result.data.categories
        .flatMap((c: { products: unknown[] }) => c.products)
        .find((p: { name: string }) => p.name === 'Flat White')

      const res = await agent
        .post('/api/trpc/menu.admin.deleteProduct')
        .send({ id: flatWhite.id })
      expect(res.status).toBe(409)
    })
  })

  describe('option groups & options', () => {
    it('creates an option group and an option, then deletes them', async () => {
      const agent = await staffAgent(app)
      const catId = await firstCategoryId()

      const product = await agent.post('/api/trpc/menu.admin.createProduct').send({
        categoryId: catId,
        name: 'Option Test Drink',
        pricePence: 300,
        active: true,
      })
      const productId = product.body.result.data.id

      const group = await agent
        .post('/api/trpc/menu.admin.createOptionGroup')
        .send({ productId, name: 'Topping', required: false, min: 0, max: 2 })
      expect(group.status).toBe(200)
      const groupId = group.body.result.data.id

      const opt = await agent
        .post('/api/trpc/menu.admin.createOption')
        .send({ groupId, label: 'Extra Whip', priceDeltaPence: 40 })
      expect(opt.status).toBe(200)
      const optId = opt.body.result.data.id

      // Verify it shows up in the public menu.
      const pub = await request(app).get('/api/trpc/menu.publicMenu').query({ input: '{}' })
      const drink = pub.body.result.data.categories
        .flatMap((c: { products: unknown[] }) => c.products)
        .find((p: { name: string }) => p.name === 'Option Test Drink')
      expect(drink.optionGroups[0].options.some((o: { id: number }) => o.id === optId)).toBe(true)

      const delOpt = await agent.post('/api/trpc/menu.admin.deleteOption').send({ id: optId })
      expect(delOpt.status).toBe(200)

      const delGroup = await agent.post('/api/trpc/menu.admin.deleteOptionGroup').send({ id: groupId })
      expect(delGroup.status).toBe(200)
    })
  })

  describe('reorder', () => {
    it('reorders categories and products without error', async () => {
      const agent = await staffAgent(app)
      const data = await adminList(agent)
      const cat = data.categories[0]

      const res = await agent
        .post('/api/trpc/menu.admin.reorderCategories')
        .send({ items: [{ id: cat.id, sort: 5 }] })
      expect(res.status).toBe(200)

      // Verify the renamed sort is reflected.
      const listed = await adminList(agent)
      const updated = listed.categories.find((c: { id: number }) => c.id === cat.id)
      expect(updated.sort).toBe(5)
    })
  })
})
