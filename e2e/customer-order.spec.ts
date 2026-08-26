import { test, expect } from '@playwright/test'

test.describe('Customer order flow', () => {
  test('browse menu → add to cart → checkout → see confirmation', async ({ page }) => {
    await page.goto('/menu')
    await expect(page.getByRole('heading', { name: /menu/i })).toBeVisible()

    const productBtn = page.getByRole('button', { name: /Flat White|Oat Latte|Cortado|Americano|Cappuccino/i }).first()
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
    await expect(page.getByText(/Checkout/i)).toBeVisible({ timeout: 10_000 })

    await page.getByPlaceholder(/For the ticket/i).fill('E2E Test Customer')

    const placeOrderBtn = page.getByRole('button', { name: /Place order/i })
    await expect(placeOrderBtn).toBeEnabled()
    await placeOrderBtn.click()

    await page.waitForURL(/\/order\/\d+/, { timeout: 10_000 })
    const orderId = page.url().match(/\/order\/(\d+)/)?.[1]
    expect(orderId).toBeTruthy()

    await expect(page.getByText(/You're all set|Order collected/i)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(new RegExp(`#${orderId}`))).toBeVisible()
    await expect(page.getByText(/Live/i)).toBeVisible()
  })
})
