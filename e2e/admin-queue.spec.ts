import { test, expect } from '@playwright/test'

const ADMIN = 'http://localhost:5174'

test.describe('Admin order queue', () => {
  test('login → see live orders → advance status', async ({ page }) => {
    await page.goto(`${ADMIN}/login`)

    await page.getByLabel(/email/i).fill('braxton@cribstonecoffee.com')
    await page.getByLabel(/password/i).fill('cribstone2026')
    await page.getByRole('button', { name: /sign in/i }).click()

    await page.waitForURL(`${ADMIN}/`, { timeout: 10_000 })
    await expect(page.getByText(/Revenue|Orders/i).first()).toBeVisible({ timeout: 10_000 })

    await page.goto(`${ADMIN}/orders`)
    await page.waitForTimeout(2000)

    const startMaking = page.getByRole('button', { name: /Start making/i }).first()
    if (await startMaking.isVisible().catch(() => false)) {
      await startMaking.click()
      await page.waitForTimeout(2000)

      const markReady = page.getByRole('button', { name: /Mark ready/i }).first()
      await expect(markReady).toBeVisible({ timeout: 5_000 })
      await markReady.click()
      await page.waitForTimeout(2000)

      const markCollected = page.getByRole('button', { name: /Mark collected/i }).first()
      await expect(markCollected).toBeVisible({ timeout: 5_000 })
      await markCollected.click()
      await page.waitForTimeout(2000)
    }

    await page.goto(`${ADMIN}/`)
    await expect(page.getByText(/Revenue|Orders|Low stock/i).first()).toBeVisible({ timeout: 10_000 })
  })
})
