import path from 'node:path'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

const { Pool } = pg

const TEST_DB = 'groundwork_test'
const ADMIN_URL = 'postgres://groundwork:groundwork@localhost:5432/postgres'
const TEST_URL =
  process.env.DATABASE_URL ??
  `postgres://groundwork:groundwork@localhost:5432/${TEST_DB}`

export default async function globalSetup() {
  const admin = new Pool({ connectionString: ADMIN_URL })
  await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`)
  await admin.query(`CREATE DATABASE ${TEST_DB}`)
  await admin.end()

  process.env.DATABASE_URL = TEST_URL

  const pool = new Pool({ connectionString: TEST_URL })
  const db = drizzle(pool)
  const migrationsFolder = path.resolve('../../packages/db/migrations')
  await migrate(db, { migrationsFolder })
  await pool.end()

  await import('../../../packages/db/scripts/seed.ts')

  console.log('Test database ready at', TEST_URL)
}
