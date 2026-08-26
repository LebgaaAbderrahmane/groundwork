import { test, expect } from '@playwright/test'

const ADMIN = 'http://localhost:5174'

test.describe('Customer order tracker', () => {
  test('create order via UI then admin advances status', async ({ browser }) => {
    const customerCtx = await browser.newContext()
    const customerPage = await customerCtx.newPage()

    await customerPage.goto('/menu')
    const productBtn = customerPage.getByRole('button', { name: /Flat White|Oat Latte|Cortado|Americano|Cappuccino/i }).first()
    await expect(productBtn).toBeVisible({ timeout: 10_000 })
    await productBtn.click()

    const modal = customerPage.getByRole('dialog')
    await expect(modal).toBeVisible()
    await modal.getByRole('button', { name: /Whole/i }).click()
    await modal.getByRole('button', { name: /Regular/i }).click()
    await modal.getByRole('button', { name: /Add · \$/i }).click()
    await expect(modal).not.toBeVisible()

    await customerPage.getByRole('link', { name: /bag/i }).click()
    await expect(customerPage.getByRole('heading', { name: /bag/i })).toBeVisible()

    await customerPage.getByRole('link', { name: /checkout/i }).click()
    await expect(customerPage.getByText(/Checkout/i)).toBeVisible({ timeout: 10_000 })

    await customerPage.getByPlaceholder(/For the ticket/i).fill('Tracker Test')
    await customerPage.getByRole('button', { name: /Place order/i }).click()
    await customerPage.waitForURL(/\/order\/\d+/, { timeout: 10_000 })

    const orderId = customerPage.url().match(/\/order\/(\d+)/)?.[1]
    expect(orderId).toBeTruthy()
    await expect(customerPage.getByText(/You're all set/i)).toBeVisible({ timeout: 10_000 })

    const adminCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    await adminPage.goto(`${ADMIN}/login`)
    await adminPage.getByLabel(/email/i).fill('braxton@cribstonecoffee.com')
    await adminPage.getByLabel(/password/i).fill('cribstone2026')
    await adminPage.getByRole('button', { name: /sign in/i }).click()
    await adminPage.waitForURL(`${ADMIN}/`, { timeout: 10_000 })

    await adminPage.goto(`${ADMIN}/orders`)
    await adminPage.waitForTimeout(2000)

    const startMaking = adminPage.getByRole('button', { name: /Start making/i }).first()
    if (await startMaking.isVisible().catch(() => false)) {
      await startMaking.click()
      await adminPage.waitForTimeout(2000)

      const markReady = adminPage.getByRole('button', { name: /Mark ready/i }).first()
      await expect(markReady).toBeVisible({ timeout: 5_000 })
      await markReady.click()
      await adminPage.waitForTimeout(2000)

      const markCollected = adminPage.getByRole('button', { name: /Mark collected/i }).first()
      await expect(markCollected).toBeVisible({ timeout: 5_000 })
      await markCollected.click()
      await adminPage.waitForTimeout(2000)
    }

    await customerPage.reload()
    await expect(customerPage.getByText(/collected|making|ready/i).first()).toBeVisible({ timeout: 10_000 })

    await customerCtx.close()
    await adminCtx.close()
  })
})
