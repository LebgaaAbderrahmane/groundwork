import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env'),
})

const { Pool } = pg

const TABLES = [
  'audit_log',
  'loyalty_transactions',
  'inventory_movements',
  'order_status_events',
  'order_items',
  'orders',
  'customers',
  'recipes',
  'ingredients',
  'options',
  'option_groups',
  'products',
  'categories',
  'refresh_tokens',
  'users',
  'tables',
  'shops',
] as const

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  console.log('Truncating all tables…')
  await pool.query(`TRUNCATE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`)
  await pool.end()

  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

  console.log('Running migrations…')
  execSync('pnpm db:migrate', { cwd: root, stdio: 'inherit' })

  console.log('Seeding…')
  execSync('pnpm db:seed', { cwd: root, stdio: 'inherit' })

  console.log('\nReset complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
