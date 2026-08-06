import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'

const app = createApp()

describe('auth', () => {
  it('logs in with seeded owner credentials and returns a session', async () => {
    const agent = request.agent(app)
    const res = await agent
      .post('/api/trpc/auth.login')
      .send({
        email: 'jamie@groundworkcoffee.co.uk',
        password: 'groundwork2026',
      })

    expect(res.status).toBe(200)
    expect(res.body.result.data.user.email).toBe('jamie@groundworkcoffee.co.uk')
    expect(res.body.result.data.user.role).toBe('owner')

    const me = await agent.get('/api/trpc/auth.me')
    expect(me.status).toBe(200)
    expect(me.body.result.data.user.name).toBe('Jamie Walsh')
  })

  it('rejects invalid credentials', async () => {
    const res = await request(app).post('/api/trpc/auth.login').send({
      email: 'jamie@groundworkcoffee.co.uk',
      password: 'wrong-password',
    })
    expect(res.status).toBe(401)
  })

  it('rejects me without a session', async () => {
    const res = await request(app).get('/api/trpc/auth.me')
    expect(res.status).toBe(401)
  })

  it('logs out and invalidates the session', async () => {
    const agent = request.agent(app)
    await agent
      .post('/api/trpc/auth.login')
      .send({ email: 'jamie@groundworkcoffee.co.uk', password: 'groundwork2026' })
    const logout = await agent.post('/api/trpc/auth.logout').send({})
    expect(logout.status).toBe(200)
    const me = await agent.get('/api/trpc/auth.me')
    expect(me.status).toBe(401)
  })
})
