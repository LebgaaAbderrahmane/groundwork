#!/usr/bin/env node
// scripts/screenshots.mjs
// Full-site screenshot capture for Cribstone Coffee
// Usage:
//   pnpm shots                              # everything: all apps × light+dark × desktop+mobile
//   pnpm shots --app=web                    # web only
//   pnpm shots --theme=dark --viewport=mobile
//
// Requires dev servers running on :5173 (web) and :5174 (admin).

import { chromium } from 'playwright-core'
import path from 'node:path'
import fs from 'node:fs'

// ─── Config ──────────────────────────────────────────────────────────────────
const WEB_URL  = 'http://localhost:5173'
const ADMIN_URL = 'http://localhost:5174'
const SHOTS = path.resolve('shots')

const DESKTOP = { width: 1440, height: 900 }
const MOBILE  = { width: 390,  height: 844 }

// ─── CLI flags ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const flag = (name, def) => {
  const a = args.find(a => a.startsWith(`--${name}=`))
  return a ? a.split('=')[1] : def
}
const APPS   = flag('app', 'all')
const THEMES = flag('theme', 'light,dark').split(',')
const VIEWS  = flag('viewport', 'desktop,mobile').split(',')

// ─── Helpers ─────────────────────────────────────────────────────────────────
function out(base, ...parts) {
  const p = path.join(base, ...parts)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  return p
}

async function shot(target, filePath) {
  try {
    await target.screenshot({ path: filePath, timeout: 10_000 })
    console.log(`  ✓ ${path.relative(SHOTS, filePath)}`)
  } catch (err) {
    console.log(`  ⚠ skip ${path.relative(SHOTS, filePath)} — ${err.message.split('\n')[0].slice(0, 80)}`)
  }
}

async function shotIf(locator, filePath) {
  try {
    if (await locator.isVisible({ timeout: 2000 })) {
      await shot(locator, filePath)
      return true
    }
  } catch {}
  return false
}

async function adminLogin(page) {
  await page.goto(`${ADMIN_URL}/login`)
  await page.waitForTimeout(400)
  await page.getByLabel(/email/i).fill('braxton@cribstonecoffee.com')
  await page.getByLabel(/password/i).fill('cribstone2026')
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(`${ADMIN_URL}/`, { timeout: 10_000 })
}

async function webAddToCart(page) {
  await page.goto(`${WEB_URL}/menu`)
  await page.waitForSelector('button:has(h3)', { timeout: 10_000 })
  const btn = page.getByRole('button', { name: /Flat White/i })
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click()
  } else {
    await page.locator('button:has(h3)').first().click()
  }
  const modal = page.getByRole('dialog')
  await modal.waitFor({ state: 'visible', timeout: 5_000 })
  for (const name of ['Whole', 'Regular']) {
    const opt = modal.getByRole('button', { name: new RegExp(name, 'i') })
    if (await opt.isVisible({ timeout: 800 }).catch(() => false)) await opt.click()
  }
  await modal.getByRole('button', { name: /Add · \$/ }).click()
  await modal.waitFor({ state: 'hidden' })
}

async function webCreateOrder(page) {
  await webAddToCart(page)
  await page.goto(`${WEB_URL}/checkout`)
  await page.waitForTimeout(500)
  await page.getByPlaceholder(/For the ticket/i).fill('Cribstone')
  await page.getByRole('button', { name: /Place order/i }).click()
  await page.waitForURL(/\/order\/\d+/, { timeout: 10_000 })
  await page.waitForTimeout(1000)
  return page.url().match(/\/order\/(\d+)/)?.[1]
}

function getViewportLabel(vp) { return vp === MOBILE ? 'mobile' : 'desktop' }

// ═══════════════════════════════════════════════════════════════════════════════
// WEB CAPTURES
// ═══════════════════════════════════════════════════════════════════════════════
async function captureWeb(ctx, baseDir) {
  const s  = async (t, ...p) => shot(t, out(baseDir, ...p))
  const sf = async (l, ...p) => shotIf(l, out(baseDir, ...p))

  // ── HOME ─────────────────────────────────────────────────────────────────
  console.log('  [web] Home')
  const home = await ctx.newPage()
  await home.goto(`${WEB_URL}/`)
  await home.waitForSelector('#top h1', { timeout: 15_000 })
  await home.waitForTimeout(600)

  await s(home, 'home', 'home-full.png')

  for (const [id, name] of [
    ['#top',   'section-hero'],
    ['#menu',  'section-menu-highlights'],
    ['#coffee','section-our-coffee'],
    ['#about', 'section-about'],
    ['#find',  'section-find-us'],
  ]) {
    await sf(home.locator(id), 'home', `${name}.png`)
  }

  await sf(home.locator('header').first(), 'home', 'navbar.png')
  await sf(home.locator('footer').first(), 'home', 'footer.png')

  const heroBtns = home.locator('#top a[href="/menu"], #top a[href="/find-us"]')
  if (await heroBtns.count() > 0) await s(heroBtns.first(), 'home', 'hero-cta.png')

  // Menu highlight cards (articles inside section#menu)
  const menuCards = home.locator('#menu article')
  const mcN = Math.min(await menuCards.count(), 4)
  for (let i = 0; i < mcN; i++) {
    if (!(await menuCards.nth(i).isVisible({ timeout: 1000 }).catch(() => false))) break
    await s(menuCards.nth(i), 'home', `card-menu-${i}.png`)
  }

  // Testimonial cards (figure > blockquote)
  const testimonials = home.locator('figure').filter({ has: home.locator('blockquote') })
  const ttN = Math.min(await testimonials.count(), 3)
  for (let i = 0; i < ttN; i++) {
    if (!(await testimonials.nth(i).isVisible({ timeout: 1000 }).catch(() => false))) break
    await s(testimonials.nth(i), 'home', `card-testimonial-${i}.png`)
  }

  // Gallery items
  const galleryItems = home.locator('figure:has(img)')
  const giN = Math.min(await galleryItems.count(), 3)
  for (let i = 0; i < giN; i++) {
    if (!(await galleryItems.nth(i).isVisible({ timeout: 1000 }).catch(() => false))) break
    await s(galleryItems.nth(i), 'home', `gallery-item-${i}.png`)
  }

  await home.close()

  // ── MENU PAGE ────────────────────────────────────────────────────────────
  console.log('  [web] Menu')
  const menu = await ctx.newPage()
  await menu.goto(`${WEB_URL}/menu`)
  await menu.waitForSelector('button:has(h3)', { timeout: 10_000 })
  await menu.waitForTimeout(300)

  await s(menu, 'menu', 'menu-full.png')

  // Category tabs
  const tabs = menu.locator('nav button')
  const tabN = Math.min(await tabs.count(), 5)
  for (let i = 0; i < tabN; i++) {
    if (!(await tabs.nth(i).isVisible({ timeout: 1000 }).catch(() => false))) break
    await s(tabs.nth(i), 'menu', `tab-${i}.png`)
  }

  // Product cards
  const prods = menu.locator('main button:has(h3)')
  const prodN = Math.min(await prods.count(), 6)
  for (let i = 0; i < prodN; i++) {
    if (!(await prods.nth(i).isVisible({ timeout: 1000 }).catch(() => false))) break
    await s(prods.nth(i), 'menu', `product-card-${i}.png`)
  }

  // ── PRODUCT MODAL ────────────────────────────────────────────────────────
  console.log('  [web] Product modal')
  const fmBtn = menu.getByRole('button', { name: /Flat White/i })
  if (await fmBtn.isVisible({ timeout: 2000 }).catch(() => false)) await fmBtn.click()
  else await prods.first().click()

  const modal = menu.getByRole('dialog')
  await modal.waitFor({ state: 'visible', timeout: 5_000 })
  await menu.waitForTimeout(300)

  await s(menu, 'menu', 'modal-full.png')

  // Individual option buttons
  const optBtns = modal.locator('fieldset button')
  const optN = Math.min(await optBtns.count(), 2)
  for (let i = 0; i < optN; i++) {
    if (!(await optBtns.nth(i).isVisible({ timeout: 1000 }).catch(() => false))) break
    await s(optBtns.nth(i), 'menu', `modal-option-${i}.png`)
  }

  // Select options → "selected" state
  for (const name of ['Whole', 'Regular']) {
    const ob = modal.getByRole('button', { name: new RegExp(name, 'i') })
    if (await ob.isVisible({ timeout: 800 }).catch(() => false)) await ob.click()
  }
  await menu.waitForTimeout(200)
  await s(modal, 'menu', 'modal-selected.png')

  // Close modal
  const closeBtn = modal.getByRole('button', { name: /close/i })
  if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeBtn.click()
    await modal.waitFor({ state: 'hidden' })
  }
  await menu.close()

  // ── CART (empty) ─────────────────────────────────────────────────────────
  console.log('  [web] Cart (empty)')
  const cartE = await ctx.newPage()
  await cartE.goto(`${WEB_URL}/cart`)
  await cartE.waitForTimeout(600)
  await s(cartE, 'cart', 'cart-empty.png')
  await cartE.close()

  // ── CART (filled) ────────────────────────────────────────────────────────
  console.log('  [web] Cart (filled)')
  const cartF = await ctx.newPage()
  await webAddToCart(cartF)
  await cartF.goto(`${WEB_URL}/cart`)
  await cartF.waitForTimeout(500)

  await s(cartF, 'cart', 'cart-filled-full.png')

  // Line item
  const itemName = cartF.locator('h3').first()
  if (await itemName.isVisible().catch(() => false))
    await s(itemName.locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]'), 'cart', 'cart-line-item.png')

  // Summary aside
  await sf(cartF.locator('aside'), 'cart', 'cart-summary.png')
  await cartF.close()

  // ── CHECKOUT ─────────────────────────────────────────────────────────────
  console.log('  [web] Checkout')
  const co = await ctx.newPage()
  await webAddToCart(co)
  await co.goto(`${WEB_URL}/checkout`)
  await co.waitForTimeout(500)

  await s(co, 'checkout', 'checkout-full.png')

  // "Your details" card
  await sf(co.locator('h2').filter({ hasText: 'Your details' }).locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]'), 'checkout', 'checkout-details.png')

  // "Payment" card
  await sf(co.locator('h2').filter({ hasText: 'Payment' }).locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]'), 'checkout', 'checkout-payment.png')

  // Payment method row
  const payBtns = co.locator('button').filter({ hasText: /Pay at the counter|Pay by card/ })
  if (await payBtns.count() > 0) await s(payBtns.first(), 'checkout', 'payment-method-row.png')

  // Summary aside
  await sf(co.locator('aside'), 'checkout', 'checkout-summary.png')
  await co.close()

  // ── ORDER CONFIRMATION ───────────────────────────────────────────────────
  console.log('  [web] Order confirmation')
  const oc = await ctx.newPage()
  const orderId = await webCreateOrder(oc)
  await s(oc, 'order', 'order-confirmation.png')

  // Status tracker — find the status labels container
  const tracker = oc.locator('text=Received').locator('xpath=ancestor::div[contains(@class,"flex") and contains(@class,"items-center") and contains(@class,"gap-3")][1]')
  await sf(tracker, 'order', 'order-status-tracker.png')

  // CTA buttons row
  const ctaRow = oc.locator('a').filter({ hasText: /View receipt|Order more/ }).locator('xpath=ancestor::div[contains(@class,"flex")][1]')
  await sf(ctaRow, 'order', 'order-cta-row.png')
  await oc.close()

  // ── RECEIPT ──────────────────────────────────────────────────────────────
  if (orderId) {
    console.log('  [web] Receipt')
    const rp = await ctx.newPage()
    await rp.goto(`${WEB_URL}/receipt/${orderId}`)
    await rp.waitForTimeout(1000)
    await s(rp, 'receipt', 'receipt-full.png')

    // Receipt card (narrow centered card)
    await sf(rp.locator('.max-w-sm, [class*="max-w-sm"]').first(), 'receipt', 'receipt-card.png')
    await rp.close()
  }

  // ── OUR COFFEE ───────────────────────────────────────────────────────────
  console.log('  [web] Our Coffee')
  const coffee = await ctx.newPage()
  await coffee.goto(`${WEB_URL}/our-coffee`)
  await coffee.waitForSelector('h2', { timeout: 10_000 })
  await coffee.waitForTimeout(400)
  await s(coffee, 'our-coffee', 'our-coffee-full.png')

  // Origin cards
  const originCards = coffee.locator('section').filter({ has: coffee.locator('h2').filter({ hasText: /Grinder|origins/i }) }).locator('div').filter({ has: coffee.locator('h3, p.text-sm') })
  // Simpler: find cards with border + p text content in the origins grid
  await sf(coffee.locator('[class*="rounded-xl"][class*="border"]').first(), 'our-coffee', 'origin-card.png')
  await coffee.close()

  // ── ABOUT ────────────────────────────────────────────────────────────────
  console.log('  [web] About')
  const about = await ctx.newPage()
  await about.goto(`${WEB_URL}/about`)
  await about.waitForSelector('h2', { timeout: 10_000 })
  await about.waitForTimeout(400)
  await s(about, 'about', 'about-full.png')
  await about.close()

  // ── FIND US ──────────────────────────────────────────────────────────────
  console.log('  [web] Find Us')
  const find = await ctx.newPage()
  await find.goto(`${WEB_URL}/find-us`)
  await find.waitForSelector('h2', { timeout: 10_000 })
  await find.waitForTimeout(400)
  await s(find, 'find-us', 'find-us-full.png')

  // Hours/location card
  await sf(find.locator('h2').filter({ hasText: /Hours|Location/i }).locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]'), 'find-us', 'hours-location-card.png')

  // Map iframe
  await sf(find.locator('iframe'), 'find-us', 'map-embed.png')

  // FAQ — all closed first
  const faqSection = find.locator('section').filter({ hasText: /Frequently.*Asked/i })
  const faqRows = faqSection.locator('button[aria-expanded]')
  const faqCount = await faqRows.count()
  if (faqCount > 0) {
    // Screenshot the FAQ section (all closed)
    const faqContainer = faqRows.first().locator('xpath=ancestor::div[contains(@class,"space-y-3")][1]')
    await sf(faqContainer, 'find-us', 'faq-all-closed.png')

    // Open first FAQ
    await faqRows.first().click()
    await find.waitForTimeout(400)
    await sf(faqContainer, 'find-us', 'faq-one-open.png')
  }

  // Getting-here section
  await sf(find.locator('section').filter({ hasText: /Getting here/i }).first(), 'find-us', 'getting-here.png')
  await find.close()

  // ── 404 ──────────────────────────────────────────────────────────────────
  console.log('  [web] 404')
  const nf = await ctx.newPage()
  await nf.goto(`${WEB_URL}/nonexistent-xyz-123`)
  await nf.waitForTimeout(600)
  await s(nf, '404', '404.png')
  await nf.close()
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN CAPTURES
// ═══════════════════════════════════════════════════════════════════════════════
async function captureAdmin(ctx, baseDir) {
  const s  = async (t, ...p) => shot(t, out(baseDir, ...p))
  const sf = async (l, ...p) => shotIf(l, out(baseDir, ...p))

  // ── LOGIN ────────────────────────────────────────────────────────────────
  console.log('  [admin] Login')
  const pg = await ctx.newPage()
  await pg.goto(`${ADMIN_URL}/login`)
  await pg.waitForTimeout(500)
  await s(pg, 'login', 'login.png')

  await adminLogin(pg)

  // ── DASHBOARD ────────────────────────────────────────────────────────────
  console.log('  [admin] Dashboard')
  await pg.waitForTimeout(1000)
  await s(pg, 'dashboard', 'dashboard-full.png')

  // Stats cards — find by label text inside <p> tags
  for (const [label, slug] of [
    ['Revenue',    'stat-revenue'],
    ['Orders',     'stat-orders'],
    ['Low stock',  'stat-low-stock'],
  ]) {
    const card = pg.locator('p').filter({ hasText: label }).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]')
    await sf(card, 'dashboard', `${slug}.png`)
  }

  // Top products card
  await sf(pg.locator('h2').filter({ hasText: 'Top products' }).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]'), 'dashboard', 'card-top-products.png')

  // Busy hours chart
  await sf(pg.locator('h2').filter({ hasText: 'Busy hours' }).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]'), 'dashboard', 'card-busy-hours.png')

  // Low stock card
  await sf(pg.locator('h2').filter({ hasText: 'Low stock' }).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]'), 'dashboard', 'card-low-stock.png')

  // ── ORDERS ───────────────────────────────────────────────────────────────
  console.log('  [admin] Orders')
  await pg.goto(`${ADMIN_URL}/orders`)
  await pg.waitForTimeout(2000)
  await s(pg, 'orders', 'orders-full.png')

  // Order ticket cards — find by order ID spans (#N)
  const tickets = pg.locator('span').filter({ hasText: /^#\d+$/ }).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]')
  const tkN = Math.min(await tickets.count(), 3)
  for (let i = 0; i < tkN; i++) {
    if (!(await tickets.nth(i).isVisible({ timeout: 1000 }).catch(() => false))) break
    await s(tickets.nth(i), 'orders', `ticket-${i}.png`)
  }

  // Action button row from first ticket
  if (await tickets.count() > 0) {
    await sf(tickets.first().locator('button').last(), 'orders', 'ticket-action-btn.png')
  }

  // Live badge
  await sf(pg.locator('span').filter({ hasText: /Live/ }).first(), 'orders', 'live-badge.png')

  // ── MENU ─────────────────────────────────────────────────────────────────
  console.log('  [admin] Menu management')
  await pg.goto(`${ADMIN_URL}/menu`)
  await pg.waitForTimeout(1000)
  await s(pg, 'menu', 'menu-full.png')

  // Category card
  const catCard = pg.locator('h2').filter({ hasText: /Espresso|Filter|Brunch|Baked/i }).first().locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]')
  await sf(catCard, 'menu', 'category-card.png')

  // Expand first product
  const expandBtn = pg.locator('button[aria-expanded]').first()
  if (await expandBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await expandBtn.click()
    await pg.waitForTimeout(400)
    await s(pg, 'menu', 'product-expanded.png')

    // Option groups detail
    const detail = pg.locator('h3').filter({ hasText: /Option groups/i }).locator('xpath=ancestor::div[contains(@class,"space-y-4")][1]')
    await sf(detail, 'menu', 'option-groups.png')

    // Collapse
    const collapse = pg.locator('button[aria-expanded="true"]').first()
    if (await collapse.isVisible().catch(() => false)) await collapse.click()
  }

  // "Add product" button
  const addProdBtn = pg.locator('button').filter({ hasText: /Add product to category/ }).first()
  if (await addProdBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await addProdBtn.click()
    await pg.waitForTimeout(300)
    await s(pg, 'menu', 'add-product-form.png')
  }

  // ── INVENTORY ────────────────────────────────────────────────────────────
  console.log('  [admin] Inventory')
  await pg.goto(`${ADMIN_URL}/inventory`)
  await pg.waitForTimeout(1000)
  await s(pg, 'inventory', 'inventory-full.png')

  // Add ingredient form
  await sf(pg.locator('h2').filter({ hasText: 'Add ingredient' }).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]'), 'inventory', 'form-add-ingredient.png')

  // Adjust stock card
  await sf(pg.locator('h2').filter({ hasText: 'Adjust stock' }).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]'), 'inventory', 'card-adjust-stock.png')

  // Stock table
  await sf(pg.locator('h2').filter({ hasText: 'Stock levels' }).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]'), 'inventory', 'stock-table.png')

  // Recipes card
  await sf(pg.locator('h2').filter({ hasText: /Recipes/i }).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]'), 'inventory', 'card-recipes.png')

  // Recent movements
  await sf(pg.locator('h2').filter({ hasText: /movements/i }).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]'), 'inventory', 'card-movements.png')

  // ── STAFF ────────────────────────────────────────────────────────────────
  console.log('  [admin] Staff')
  await pg.goto(`${ADMIN_URL}/staff`)
  await pg.waitForTimeout(1000)
  await s(pg, 'staff', 'staff-full.png')

  // Invite form card
  await sf(pg.locator('h2').filter({ hasText: /Invite/i }).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]'), 'staff', 'invite-form.png')

  // Staff member rows
  const staffRows = pg.locator('div').filter({ has: pg.locator('[class*="size-10"][class*="rounded-full"]') }).filter({ hasText: /@/ })
  const srN = Math.min(await staffRows.count(), 3)
  for (let i = 0; i < srN; i++) {
    if (!(await staffRows.nth(i).isVisible({ timeout: 1000 }).catch(() => false))) break
    await s(staffRows.nth(i), 'staff', `member-${i}.png`)
  }

  // ── CUSTOMERS ────────────────────────────────────────────────────────────
  console.log('  [admin] Customers')
  await pg.goto(`${ADMIN_URL}/customers`)
  await pg.waitForTimeout(1000)
  await s(pg, 'customers', 'customers-full.png')

  // Lookup card
  await sf(pg.locator('h2').filter({ hasText: /Look up/i }).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]'), 'customers', 'lookup-card.png')

  // Search for a customer
  const phoneInput = pg.locator('input[placeholder*="phone" i], input[type="tel"], input[placeholder*="Phone" i]').first()
  if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await phoneInput.fill('207')
    const searchBtn = pg.locator('button').filter({ hasText: /search/i }).first()
    if (await searchBtn.isVisible().catch(() => false)) await searchBtn.click()
    await pg.waitForTimeout(1000)
    await s(pg, 'customers', 'customers-search-result.png')
  }

  // Recent customers table
  await sf(pg.locator('h2').filter({ hasText: /Recent/i }).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]'), 'customers', 'recent-customers.png')

  // ── TABLES ───────────────────────────────────────────────────────────────
  console.log('  [admin] Tables')
  await pg.goto(`${ADMIN_URL}/tables`)
  await pg.waitForTimeout(1000)
  await s(pg, 'tables', 'tables-full.png')

  // Add table form
  await sf(pg.locator('h2').filter({ hasText: /Add a table/i }).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]'), 'tables', 'form-add-table.png')

  // Table tile with QR
  const tableTiles = pg.locator('span').filter({ hasText: /Table \d/ }).locator('xpath=ancestor::div[contains(@class,"rounded-xl") or contains(@class,"border")][1]')
  if (await tableTiles.count() > 0) {
    await s(tableTiles.first(), 'tables', 'table-tile.png')

    // Click QR to enlarge
    const qr = tableTiles.first().locator('img').first()
    if (await qr.isVisible({ timeout: 1000 }).catch(() => false)) {
      await qr.click()
      await pg.waitForTimeout(300)
      await s(tableTiles.first(), 'tables', 'qr-enlarged.png')
    }
  }

  // ── SETTINGS ─────────────────────────────────────────────────────────────
  console.log('  [admin] Settings')
  await pg.goto(`${ADMIN_URL}/settings`)
  await pg.waitForTimeout(1000)
  await s(pg, 'settings', 'settings-full.png')

  // Shop details card
  await sf(pg.locator('h2').filter({ hasText: /Shop details/i }).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]'), 'settings', 'shop-details.png')

  // Business hours card
  await sf(pg.locator('h2').filter({ hasText: /hours|Hours/i }).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]'), 'settings', 'business-hours.png')

  await pg.close()
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('╔════════════════════════════════════════════════╗')
  console.log('║  Cribstone Coffee — Full-site Screenshot Capture')
  console.log('║  Themes:', THEMES.join(', '), ' │ Viewports:', VIEWS.join(', '))
  console.log('║  Apps:', APPS, ' │ Output:', SHOTS)
  console.log('╚════════════════════════════════════════════════╝\n')

  const browser = await chromium.launch({ headless: true })
  const start = Date.now()
  let total = 0

  for (const theme of THEMES) {
    for (const vpName of VIEWS) {
      const vp = vpName === 'mobile' ? MOBILE : DESKTOP
      const label = `${theme}/${vpName}`

      console.log(`\n── ${label} (${vp.width}×${vp.height}) ──`)

      const ctx = await browser.newContext({
        viewport: vp,
        deviceScaleFactor: vpName === 'mobile' ? 3 : 2,
        colorScheme: 'light',
      })

      if (theme === 'dark') {
        await ctx.addInitScript(() => {
          localStorage.setItem('cc-theme', 'dark')
        })
      }

      if (APPS === 'all' || APPS === 'web') {
        console.log(`\n  ── Web app ──`)
        await captureWeb(ctx, path.join(SHOTS, 'web', theme, vpName))
      }

      if (APPS === 'all' || APPS === 'admin') {
        console.log(`\n  ── Admin app ──`)
        await captureAdmin(ctx, path.join(SHOTS, 'admin', theme, vpName))
      }

      await ctx.close()
    }
  }

  await browser.close()

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`\n✅ Done in ${elapsed}s`)
}

main().catch(err => {
  console.error('❌ Screenshot capture failed:', err.message)
  process.exit(1)
})
