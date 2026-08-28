import { defineConfig } from 'vitest/config'

const TEST_DATABASE_URL =
  'postgres://cribstone:cribstone@localhost:5432/cribstone_test'

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: './test/global-setup.ts',
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      BETTER_AUTH_SECRET: 'test-better-auth-secret-1234567890ab',
      STAFF_AUTH_SECRET: 'test-staff-auth-secret-1234567890ab',
      BETTER_AUTH_URL: 'http://localhost:4000',
      PORT: '0',
      NODE_ENV: 'test',
      WEB_ORIGIN: 'http://localhost:5173',
      ADMIN_ORIGIN: 'http://localhost:5174',
    },
  },
})
