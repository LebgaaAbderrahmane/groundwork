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
    expect(data.shop.name).toBe('Groundwork Coffee')
    expect(data.categories.length).toBeGreaterThanOrEqual(4)

    const espresso = data.categories.find((c: { name: string }) => c.name === 'Espresso')
    expect(espresso).toBeDefined()

    const flatWhite = espresso.products.find(
      (p: { name: string }) => p.name === 'Flat White',
    )
    expect(flatWhite).toBeDefined()
    expect(flatWhite.pricePence).toBe(350)
    expect(flatWhite.optionGroups).toHaveLength(2)
    expect(flatWhite.optionGroups[0].required).toBe(true)
  })

  it('rejects unauthenticated admin menu access', async () => {
    const res = await request(app).get('/api/trpc/menu.admin.list')
    expect(res.status).toBe(401)
  })
})
