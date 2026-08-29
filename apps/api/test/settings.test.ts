import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { staffAgent, STAFF } from './helpers'

const app = createApp()

describe('settings', () => {
  it('requires auth to read settings', async () => {
    const res = await request(app).get('/api/trpc/settings.get')
    expect(res.status).toBe(401)
  })

  it('returns the shop profile for any staff', async () => {
    const barista = await staffAgent(app, STAFF.barista)
    const res = await barista.get('/api/trpc/settings.get')
    expect(res.status).toBe(200)
    expect(res.body.result.data.name).toBe('Cribstone Coffee')
    expect(res.body.result.data).toHaveProperty('address')
  })

  it('only the owner may update settings', async () => {
    const manager = await staffAgent(app, STAFF.manager)
    const forbidden = await manager.post('/api/trpc/settings.update').send({
      shopName: 'Hacked',
      address: 'x',
      phone: 'x',
      hours: 'x',
      paymentMode: 'card',
    })
    expect(forbidden.status).toBe(403)
  })

  it('updates and persists the shop profile (owner)', async () => {
    const owner = await staffAgent(app)
    const res = await owner.post('/api/trpc/settings.update').send({
      shopName: 'Cribstone Coffee',
      address: "1845 Harpswell Islands Road, Orr's Island, ME 04066",
      phone: '+1 207 555 0123',
      hours: 'Open daily',
      paymentMode: 'card',
    })
    expect(res.status).toBe(200)
    expect(res.body.result.data.hours).toBe('Open daily')
    expect(res.body.result.data.paymentMode).toBe('card')

    // Restore the seeded hours so other tests/assertions stay stable.
    const restored = await owner.post('/api/trpc/settings.update').send({
      shopName: 'Cribstone Coffee',
      address: "1845 Harpswell Islands Road, Orr's Island, ME 04066",
      phone: '+1 207 555 0123',
      hours: 'Monday–Friday 7am–5pm · Saturday–Sunday 8am–5pm',
      paymentMode: 'in_store',
    })
    expect(restored.status).toBe(200)
    expect(restored.body.result.data.paymentMode).toBe('in_store')
  })
})
