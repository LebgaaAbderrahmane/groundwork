import { test, expect } from '@playwright/test'

const ADMIN = 'http://localhost:5174'

test.describe('Kitchen display', () => {
  test('Kanban columns visible, order advances through columns', async ({ page }) => {
    // Create an order using the existing customer-order pattern
    await page.goto('/menu')
    const productBtn = page.getByRole('button', { name: /Flat White|Oat Latte|Cortado/i }).first()
    await expect(productBtn).toBeVisible({ timeout: 10_000 })
    await productBtn.click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // Select required options (milk + size)
    const wholeMilk = modal.getByRole('button', { name: /Whole/i })
    await expect(wholeMilk).toBeVisible()
    await wholeMilk.click()
    const regular = modal.getByRole('button', { name: /Regular/i })
    await regular.click()

    const addBtn = modal.getByRole('button', { name: /Add · \$/i })
    await expect(addBtn).toBeEnabled()
    await addBtn.click()
    await expect(modal).not.toBeVisible()

    await page.getByRole('link', { name: /bag/i }).click()
    await page.getByRole('link', { name: /checkout/i }).click()
    await expect(page.getByText(/Checkout/i)).toBeVisible({ timeout: 10_000 })
    await page.getByPlaceholder(/For the ticket/i).fill('Kitchen Test')
    const placeOrderBtn = page.getByRole('button', { name: /Place order/i })
    await expect(placeOrderBtn).toBeEnabled()
    await placeOrderBtn.click()
    await page.waitForURL(/\/order\/\d+/, { timeout: 10_000 })

    // Kitchen is now login-gated (renders inside the shell like other tabs)
    await page.goto(`${ADMIN}/login`)
    await page.getByLabel(/email/i).fill('braxton@cribstonecoffee.com')
    await page.getByLabel(/password/i).fill('cribstone2026')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(`${ADMIN}/`, { timeout: 10_000 })

    // Open kitchen display
    await page.goto(`${ADMIN}/kitchen`)
    await page.waitForSelector('h1:text("Kitchen Display")', { timeout: 10_000 })

    // Verify Kanban columns
    await expect(page.locator('h2:text("New")')).toBeVisible()
    await expect(page.locator('h2:text("Making")')).toBeVisible()
    await expect(page.locator('h2:text("Ready")')).toBeVisible()

    // Wait for order to appear in New column
    await page.waitForFunction(() => {
      const cols = document.querySelectorAll('section')
      const newCol = cols[0]
      return newCol && newCol.querySelectorAll('[class*="border-l-"]').length > 0
    }, { timeout: 10_000 })

    // Advance: click Start
    const startBtn = page.locator('button:text("Start")').first()
    await expect(startBtn).toBeVisible()
    await startBtn.click()

    // Should now be in Making column
    await page.waitForFunction(() => {
      const cols = document.querySelectorAll('section')
      const makingCol = cols[1]
      return makingCol && makingCol.querySelectorAll('[class*="border-l-"]').length > 0
    }, { timeout: 10_000 })

    // Advance: click Ready
    const readyBtn = page.locator('button:text("Ready")').first()
    await expect(readyBtn).toBeVisible()
    await readyBtn.click()

    // Should now be in Ready column
    await page.waitForFunction(() => {
      const cols = document.querySelectorAll('section')
      const readyCol = cols[2]
      return readyCol && readyCol.querySelectorAll('[class*="border-l-"]').length > 0
    }, { timeout: 10_000 })
  })
})
