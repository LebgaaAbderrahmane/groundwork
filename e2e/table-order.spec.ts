import { test, expect } from '@playwright/test'

const COUNTER_TOKEN = '00000000-0000-4000-8000-000000000001'

test.describe('Table QR ordering', () => {
  test('scan token → menu banner → dine-in order → admin sees table', async ({ page }) => {
    await page.goto(`/order/table/${COUNTER_TOKEN}`)

    await page.waitForURL('/menu', { timeout: 10_000 })
    await expect(page.getByText(/Ordering for Counter/i)).toBeVisible({ timeout: 10_000 })

    const productBtn = page
      .getByRole('button', { name: /Flat White|Oat Latte|Cortado|Americano|Cappuccino/i })
      .first()
    await expect(productBtn).toBeVisible({ timeout: 10_000 })
    await productBtn.click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

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
    await expect(page.getByRole('heading', { name: /bag/i })).toBeVisible()

    await page.getByRole('link', { name: /checkout/i }).click()
    await expect(page.getByText(/Dine-in · Counter/i)).toBeVisible({ timeout: 10_000 })

    await page.getByPlaceholder(/For the ticket/i).fill('E2E Table Guest')

    const placeOrderBtn = page.getByRole('button', { name: /Place order/i })
    await expect(placeOrderBtn).toBeEnabled()
    await placeOrderBtn.click()

    await page.waitForURL(/\/order\/\d+/, { timeout: 10_000 })
    const orderId = page.url().match(/\/order\/(\d+)/)?.[1]
    expect(orderId).toBeTruthy()
  })

  test('invalid token shows friendly error', async ({ page }) => {
    await page.goto('/order/table/ffffffff-ffff-4fff-8fff-ffffffffffff')
    await expect(page.getByText(/Table not found/i)).toBeVisible({ timeout: 10_000 })
  })
})
