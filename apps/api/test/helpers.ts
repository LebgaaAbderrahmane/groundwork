import request from 'supertest'
import { expect } from 'vitest'
import { createApp } from '../src/app'

export const ORIGIN = 'http://localhost:5174'

export const STAFF = {
  owner: { email: 'braxton@cribstonecoffee.com', password: 'cribstone2026' },
  manager: { email: 'julia@cribstonecoffee.com', password: 'cribstone2026' },
  barista: { email: 'quinn@cribstonecoffee.com', password: 'cribstone2026' },
}

/** Sign in as a seeded staff member and return a supertest agent with the Bearer token attached. */
export async function staffAgent(
  app: ReturnType<typeof createApp>,
  creds = STAFF.owner,
): Promise<ReturnType<typeof request.agent>> {
  const agent = request.agent(app)
  const signIn = await agent
    .post('/api/staff-auth/sign-in/email')
    .set('Origin', ORIGIN)
    .send({ email: creds.email, password: creds.password })
  expect(signIn.status).toBe(200)
  expect(signIn.body.token).toBeTruthy()
  agent.set('Authorization', `Bearer ${signIn.body.token}`)
  return agent
}

/** Like staffAgent but returns a fresh `request()` that is not cookie-bound. */
export async function staffToken(
  app: ReturnType<typeof createApp>,
  creds = STAFF.owner,
): Promise<string> {
  const res = await request(app)
    .post('/api/staff-auth/sign-in/email')
    .set('Origin', ORIGIN)
    .send({ email: creds.email, password: creds.password })
  expect(res.status).toBe(200)
  return res.body.token as string
}
