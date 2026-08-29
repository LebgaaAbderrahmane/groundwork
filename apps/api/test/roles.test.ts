import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { staffAgent, STAFF } from './helpers'

const app = createApp()
const ORIGIN = 'http://localhost:5174'

// Endpoints that exercise each procedure tier (query endpoints only).
const OWNER_ENDPOINTS = ['menu.admin.list', 'staff.list']
const MANAGER_ENDPOINTS = ['inventory.list', 'customers.list']
const STAFF_ENDPOINTS = ['orders.queue', 'analytics.dashboard', 'settings.get']
const OWNER_MUTATION = 'settings.update'

/** POST a mutation and expect FORBIDDEN (procedure-level middleware fires). */
async function expectForbiddenMutation(agent: Awaited<ReturnType<typeof staffAgent>>) {
  const res = await agent.post(`/api/trpc/${OWNER_MUTATION}`).send({
    shopName: 'x', address: 'x', phone: 'x', hours: 'x', paymentMode: 'card',
  })
  expect(res.status).toBe(403)
}

async function createCustomerSession() {
  // Register a fresh customer via Better Auth, then sign in to get a session cookie.
  const email = `role-${Date.now()}@example.com`
  await request(app)
    .post('/api/auth/sign-up/email')
    .set('Origin', 'http://localhost:5173')
    .send({ name: 'Role Test', email, password: 'customer-pass-123' })
  const signIn = await request(app)
    .post('/api/auth/sign-in/email')
    .set('Origin', 'http://localhost:5173')
    .send({ email, password: 'customer-pass-123' })
  expect(signIn.status).toBe(200)

  const raw = signIn.headers['set-cookie']
  const cookies = Array.isArray(raw) ? raw : raw ? [raw] : []
  const sessionCookie = cookies.find((c) => /session/.test(c))
  expect(sessionCookie).toBeTruthy()
  return { sessionCookie: sessionCookie as string }
}

describe('role-based procedure gating', () => {
  it('gives a barista staff-tier access but not manager/owner tiers', async () => {
    const barista = await staffAgent(app, STAFF.barista)

    for (const endpoint of STAFF_ENDPOINTS) {
      const res = await barista.get(`/api/trpc/${endpoint}`).send({})
      expect(res.status, endpoint).toBe(200)
    }
    for (const endpoint of MANAGER_ENDPOINTS) {
      const res = await barista.get(`/api/trpc/${endpoint}`)
      expect(res.status, endpoint).toBe(403)
    }
    for (const endpoint of OWNER_ENDPOINTS) {
      const res = await barista.get(`/api/trpc/${endpoint}`)
      expect(res.status, endpoint).toBe(403)
    }
    await expectForbiddenMutation(barista)
  })

  it('gives a manager manager-tier access but not owner-tier', async () => {
    const manager = await staffAgent(app, STAFF.manager)

    for (const endpoint of STAFF_ENDPOINTS) {
      const res = await manager.get(`/api/trpc/${endpoint}`)
      expect(res.status, endpoint).toBe(200)
    }
    for (const endpoint of MANAGER_ENDPOINTS) {
      const res = await manager.get(`/api/trpc/${endpoint}`)
      expect(res.status, endpoint).toBe(200)
    }
    for (const endpoint of OWNER_ENDPOINTS) {
      const res = await manager.get(`/api/trpc/${endpoint}`)
      expect(res.status, endpoint).toBe(403)
    }
    await expectForbiddenMutation(manager)
  })

  it('owner has full access to all tiers', async () => {
    const owner = await staffAgent(app)
    // Queries (GET) across all tiers must not be blocked for the owner.
    const queries = [
      ...STAFF_ENDPOINTS,
      'inventory.list',
      'customers.list',
      'menu.admin.list',
      'staff.list',
    ]
    for (const endpoint of queries) {
      const res = await owner.get(`/api/trpc/${endpoint}`)
      expect([200, 400], endpoint).toContain(res.status)
    }
  })

  it('a customer session cannot access staff procedures', async () => {
    const { sessionCookie } = await createCustomerSession()
    const res = await request(app)
      .get('/api/trpc/orders.queue')
      .set('Origin', ORIGIN)
      .set('Cookie', sessionCookie)
    expect(res.status).toBe(401)
  })
})
