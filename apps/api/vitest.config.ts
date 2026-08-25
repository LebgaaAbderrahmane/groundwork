import { defineConfig } from 'vitest/config'

const TEST_DATABASE_URL =
  'postgres://cribstone:cribstone@localhost:5432/cribstone_test'

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: './test/global-setup.ts',
    testTimeout: 20000,
    hookTimeout: 30000,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_SECRET: 'test-secret-test-secret-12345678',
      PORT: '0',
      NODE_ENV: 'test',
      WEB_ORIGIN: 'http://localhost:5173',
      ADMIN_ORIGIN: 'http://localhost:5174',
    },
  },
})
