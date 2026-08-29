import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { staffAgent, STAFF } from './helpers'

const app = createApp()

/** Create a scratch barista via staff.invite and return its id + email. */
async function scratchBarista(agent: Awaited<ReturnType<typeof staffAgent>>) {
  const email = `scratch-${Date.now()}@cribstonecoffee.com`
  const created = await agent.post('/api/trpc/staff.invite').send({
    name: 'Scratch Barista',
    email,
    password: 'cribstone2026',
    role: 'barista',
  })
  expect(created.status).toBe(200)
  return { id: created.body.result.data.id, email }
}

describe('staff management', () => {
  it('lists staff filtered to the owner shop', async () => {
    const agent = await staffAgent(app)
    const res = await agent.get('/api/trpc/staff.list')
    expect(res.status).toBe(200)
    const emails = res.body.result.data.map((s: { email: string }) => s.email)
    expect(emails).toContain(STAFF.owner.email)
    expect(emails).toContain(STAFF.manager.email)
    expect(emails).toContain(STAFF.barista.email)
  })

  it('forbids a barista and a manager from staff management', async () => {
    const barista = await staffAgent(app, STAFF.barista)
    const barRes = await barista.get('/api/trpc/staff.list')
    expect(barRes.status).toBe(403)

    const manager = await staffAgent(app, STAFF.manager)
    const mgrRes = await manager.get('/api/trpc/staff.list')
    expect(mgrRes.status).toBe(403)
  })

  it('invites a new barista and conflicts on duplicate email', async () => {
    const agent = await staffAgent(app)
    const email = `invited-${Date.now()}@cribstonecoffee.com`

    const created = await agent.post('/api/trpc/staff.invite').send({
      name: 'Invited Person',
      email,
      password: 'cribstone2026',
      role: 'barista',
    })
    expect(created.status).toBe(200)
    expect(created.body.result.data.role).toBe('barista')

    const duplicate = await agent.post('/api/trpc/staff.invite').send({
      name: 'Again',
      email,
      password: 'cribstone2026',
      role: 'barista',
    })
    expect(duplicate.status).toBe(409)
  })

  it('updates a scratch user role and refuses owner self-demotion', async () => {
    const owner = await staffAgent(app)
    const { id } = await scratchBarista(owner)

    // Promote scratch barista up the roles using scratch data only.
    const promoted = await owner
      .post('/api/trpc/staff.updateRole')
      .send({ userId: id, role: 'manager' })
    expect(promoted.status).toBe(200)
    expect(promoted.body.result.data.role).toBe('manager')

    const demoted = await owner
      .post('/api/trpc/staff.updateRole')
      .send({ userId: id, role: 'barista' })
    expect(demoted.status).toBe(200)
    expect(demoted.body.result.data.role).toBe('barista')

    // The owner cannot demote themselves off `owner`.
    const list = await owner.get('/api/trpc/staff.list')
    const ownerRecord = list.body.result.data.find(
      (s: { email: string }) => s.email === STAFF.owner.email,
    )
    const selfDemote = await owner
      .post('/api/trpc/staff.updateRole')
      .send({ userId: ownerRecord.id, role: 'barista' })
    expect(selfDemote.status).toBe(400)
  })

  it('deactivates and reactivates a scratch user, refusing self-deactivation', async () => {
    const owner = await staffAgent(app)
    const { id } = await scratchBarista(owner)

    const deactivate = await owner
      .post('/api/trpc/staff.setActive')
      .send({ userId: id, active: false })
    expect(deactivate.status).toBe(200)
    expect(deactivate.body.result.data.active).toBe(false)

    const reactivate = await owner
      .post('/api/trpc/staff.setActive')
      .send({ userId: id, active: true })
    expect(reactivate.status).toBe(200)
    expect(reactivate.body.result.data.active).toBe(true)

    const list = await owner.get('/api/trpc/staff.list')
    const ownerRecord = list.body.result.data.find(
      (s: { email: string }) => s.email === STAFF.owner.email,
    )
    const selfDeactivate = await owner
      .post('/api/trpc/staff.setActive')
      .send({ userId: ownerRecord.id, active: false })
    expect(selfDeactivate.status).toBe(400)
  })
})
