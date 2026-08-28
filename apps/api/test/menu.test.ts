import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'

const app = createApp()

describe('menu', () => {
  it('returns the public menu with nested structure', async () => {
    const res = await request(app)
      .get('/api/trpc/menu.publicMenu')
      .query({ input: '{}' })

    expect(res.status).toBe(200)
    const data = res.body.result.data
    expect(data.shop.name).toBe('Cribstone Coffee')
    expect(data.categories.length).toBeGreaterThanOrEqual(4)

    const espresso = data.categories.find((c: { name: string }) => c.name === 'Espresso')
    expect(espresso).toBeDefined()

    const flatWhite = espresso.products.find(
      (p: { name: string }) => p.name === 'Flat White',
    )
    expect(flatWhite).toBeDefined()
    expect(flatWhite.pricePence).toBe(350)
    const groupNames = flatWhite.optionGroups.map(
      (g: { name: string }) => g.name,
    )
    const milk = flatWhite.optionGroups.find(
      (g: { name: string }) => g.name === 'Milk',
    )
    expect(groupNames).toContain('Milk')
    expect(groupNames).toContain('Size')
    expect(milk.required).toBe(true)
    expect(milk.options.length).toBeGreaterThan(0)
  })

  it('rejects unauthenticated admin menu access', async () => {
    const res = await request(app).get('/api/trpc/menu.admin.list')
    expect(res.status).toBe(401)
  })
})
