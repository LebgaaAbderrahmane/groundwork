import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'

const app = createApp()
const ORIGIN = 'http://localhost:5174'
const OWNER_EMAIL = 'braxton@cribstonecoffee.com'
const OWNER_PASSWORD = 'cribstone2026'

async function signIn(email: string, password: string) {
  return request(app)
    .post('/api/staff-auth/sign-in/email')
    .set('Origin', ORIGIN)
    .send({ email, password })
}

function authedAgent() {
  return request.agent(app).set('Origin', ORIGIN)
}

describe('staff auth', () => {
  it('signs in with seeded owner credentials and resolves a staff session', async () => {
    const agent = authedAgent()
    const res = await signIn(OWNER_EMAIL, OWNER_PASSWORD)
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(OWNER_EMAIL)
    expect(res.body.user.role).toBe('owner')
    expect(res.body.token).toBeTruthy()

    agent.set('Authorization', `Bearer ${res.body.token}`)
    const list = await agent.get('/api/trpc/staff.list')
    expect(list.status).toBe(200)
    const emails = list.body.result.data.map((s: { email: string }) => s.email)
    expect(emails).toContain(OWNER_EMAIL)
  })

  it('rejects invalid credentials', async () => {
    const res = await signIn(OWNER_EMAIL, 'wrong-password')
    expect(res.status).toBe(401)
  })

  it('rejects a protected procedure without a session', async () => {
    const res = await request(app).get('/api/trpc/staff.list')
    expect(res.status).toBe(401)
  })

  it('signs out and invalidates the session token', async () => {
    const agent = authedAgent()
    const signInRes = await signIn(OWNER_EMAIL, OWNER_PASSWORD)
    const token = signInRes.body.token
    agent.set('Authorization', `Bearer ${token}`)

    const out = await agent.post('/api/staff-auth/sign-out').send({})
    expect(out.status).toBe(200)

    const list = await agent.get('/api/trpc/staff.list')
    expect(list.status).toBe(401)
  })
})
