import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import {
  categories,
  customers,
  ingredients,
  inventoryMovements,
  optionGroups,
  options,
  orderItems,
  orderStatusEvents,
  orders,
  products,
  recipes,
  shops,
  tables,
  users,
} from '../src/schema'

const { Pool } = pg

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env'),
})

const IMG = {
  fw: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80',
  latte: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80',
  cortado: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=800&q=80',
  americano: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=800&q=80',
  cappuccino: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80',
  v60: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  coldBrew: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
  chemex: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  batchBrew: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80',
  avo: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=800&q=80',
  eggs: 'https://images.unsplash.com/photo-1608039829572-9b1234ef4fbb?auto=format&fit=crop&w=800&q=80',
  granola: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=800&q=80',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
  croissant: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
  bananaBread: 'https://images.unsplash.com/photo-1605090930601-2b483e3e6f33?auto=format&fit=crop&w=800&q=80',
  cinnamon: 'https://images.unsplash.com/photo-1509365390695-33aee754301f?auto=format&fit=crop&w=800&q=80',
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
}

const HASH = await bcrypt.hash('cribstone2026', 12)

function ts(h: number, m = 0): Date {
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

// ─── MAIN ───────────────────────────────────────────────────────────
export default async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool)

  // ── SHOP ─────────────────────────────────────────────────────────
  const [shop] = await db
    .insert(shops)
    .values({
      name: 'Cribstone Coffee',
      slug: 'cribstone',
      address: "1845 Harpswell Islands Road, Orr's Island, ME 04066",
      phone: '+1 207 555 0123',
      hours: 'Monday–Friday 7am–5pm · Saturday–Sunday 8am–5pm',
      paymentMode: 'in_store',
    })
    .returning()

  // ── USERS ────────────────────────────────────────────────────────
  const [braxton, julia, quinn, maya] = await db
    .insert(users)
    .values([
      { shopId: shop.id, name: 'Braxton Jarratt', email: 'braxton@cribstonecoffee.com', passwordHash: HASH, role: 'owner' },
      { shopId: shop.id, name: 'Julia Jarratt', email: 'julia@cribstonecoffee.com', passwordHash: HASH, role: 'manager' },
      { shopId: shop.id, name: 'Quinn Jarratt', email: 'quinn@cribstonecoffee.com', passwordHash: HASH, role: 'barista' },
      { shopId: shop.id, name: 'Maya Chen', email: 'maya@cribstonecoffee.com', passwordHash: HASH, role: 'barista' },
    ])
    .returning()

  // ── CATEGORIES ───────────────────────────────────────────────────
  const [espressoCat, filterCat, brunchCat, bakedCat] = await db
    .insert(categories)
    .values([
      { shopId: shop.id, name: 'Espresso', sort: 0 },
      { shopId: shop.id, name: 'Filter', sort: 1 },
      { shopId: shop.id, name: 'Brunch', sort: 2 },
      { shopId: shop.id, name: 'Baked Goods', sort: 3 },
    ])
    .returning()

  // ── PRODUCTS ─────────────────────────────────────────────────────
  const productRows = await db
    .insert(products)
    .values([
      // Espresso
      { shopId: shop.id, categoryId: espressoCat.id, name: 'Flat White', description: 'Double shot, velvety steamed milk', pricePence: 350, imageUrl: IMG.fw, sort: 0 },
      { shopId: shop.id, categoryId: espressoCat.id, name: 'Oat Latte', description: 'Smooth oat milk, signature house blend', pricePence: 380, imageUrl: IMG.latte, dietaryTags: ['vegan'], sort: 1 },
      { shopId: shop.id, categoryId: espressoCat.id, name: 'Cortado', description: 'Equal parts espresso and warm milk', pricePence: 320, imageUrl: IMG.cortado, sort: 2 },
      { shopId: shop.id, categoryId: espressoCat.id, name: 'Americano', description: 'Bold single origin, clean and bright', pricePence: 300, imageUrl: IMG.americano, sort: 3 },
      { shopId: shop.id, categoryId: espressoCat.id, name: 'Cappuccino', description: 'Rich foam, dusted with cocoa', pricePence: 360, imageUrl: IMG.cappuccino, sort: 4 },
      // Filter
      { shopId: shop.id, categoryId: filterCat.id, name: 'V60', description: 'Seasonal single origin, bright and delicate', pricePence: 380, imageUrl: IMG.v60, sort: 0 },
      { shopId: shop.id, categoryId: filterCat.id, name: 'Cold Brew', description: 'Slow-steeped 18 hours, sweet and mellow', pricePence: 400, imageUrl: IMG.coldBrew, dietaryTags: ['vegan'], sort: 1 },
      { shopId: shop.id, categoryId: filterCat.id, name: 'Chemex', description: 'Smooth, full-bodied, paper-filtered clarity', pricePence: 400, imageUrl: IMG.chemex, sort: 2 },
      { shopId: shop.id, categoryId: filterCat.id, name: 'Batch Brew', description: 'Fresh pot, ready to pour', pricePence: 280, imageUrl: IMG.batchBrew, dietaryTags: ['vegan'], sort: 3 },
      // Brunch
      { shopId: shop.id, categoryId: brunchCat.id, name: 'Avocado Toast', description: 'Sourdough, smashed avo, chilli flakes, poached egg', pricePence: 900, imageUrl: IMG.avo, dietaryTags: ['vegetarian'], sort: 0 },
      { shopId: shop.id, categoryId: brunchCat.id, name: 'Eggs Benedict', description: 'Poached eggs, hollandaise, English muffin', pricePence: 1050, imageUrl: IMG.eggs, dietaryTags: ['vegetarian'], sort: 1 },
      { shopId: shop.id, categoryId: brunchCat.id, name: 'Granola Bowl', description: 'House granola, Greek yoghurt, seasonal fruit', pricePence: 750, imageUrl: IMG.granola, dietaryTags: ['vegetarian', 'gluten-free'], sort: 2 },
      { shopId: shop.id, categoryId: brunchCat.id, name: 'Breakfast Sandwich', description: 'Free-range egg, cheddar, aioli, toasted roll', pricePence: 700, imageUrl: IMG.sandwich, sort: 3 },
      // Baked
      { shopId: shop.id, categoryId: bakedCat.id, name: 'Butter Croissant', description: 'Baked in-house every morning', pricePence: 280, imageUrl: IMG.croissant, sort: 0 },
      { shopId: shop.id, categoryId: bakedCat.id, name: 'Banana Bread', description: 'Moist, walnut-studded, lightly spiced', pricePence: 320, imageUrl: IMG.bananaBread, dietaryTags: ['vegetarian'], sort: 1 },
      { shopId: shop.id, categoryId: bakedCat.id, name: 'Cinnamon Roll', description: 'Glazed, warm, impossible to resist', pricePence: 350, imageUrl: IMG.cinnamon, sort: 2 },
      { shopId: shop.id, categoryId: bakedCat.id, name: 'Cake of the Day', description: "Ask your barista what's fresh", pricePence: 400, imageUrl: IMG.cake, dietaryTags: ['vegetarian'], sort: 3 },
    ])
    .returning()

  const byName = Object.fromEntries(productRows.map((p) => [p.name, p]))
  const {
    'Flat White': flatWhite, 'Oat Latte': oatLatte, 'Cortado': cortado,
    'Americano': americano, 'Cappuccino': cappuccino, 'V60': v60,
    'Cold Brew': coldBrew, 'Chemex': chemex, 'Batch Brew': batchBrew,
    'Avocado Toast': avoToast, 'Eggs Benedict': eggsBenedict,
    'Granola Bowl': granolaBowl, 'Breakfast Sandwich': breakfastSandwich,
    'Butter Croissant': croissant, 'Banana Bread': bananaBread,
    'Cinnamon Roll': cinnamonRoll, 'Cake of the Day': cake,
  } = byName

  // ── OPTION GROUPS & OPTIONS ──────────────────────────────────────
  const espressoProducts = [flatWhite, oatLatte, cortado, americano, cappuccino]
  const milkAndFilter = [...espressoProducts, v60, coldBrew, chemex, batchBrew]

  const milkGroups = await db
    .insert(optionGroups)
    .values(espressoProducts.map((p) => ({ shopId: shop.id, productId: p.id, name: 'Milk', required: 1, min: 1, max: 1, sort: 0 })))
    .returning()
  const milkOpts = await db
    .insert(options)
    .values(
      milkGroups.flatMap((g) => [
        { shopId: shop.id, groupId: g.id, label: 'Whole', priceDeltaPence: 0, sort: 0 },
        { shopId: shop.id, groupId: g.id, label: 'Oat', priceDeltaPence: 30, sort: 1 },
        { shopId: shop.id, groupId: g.id, label: 'Soya', priceDeltaPence: 30, sort: 2 },
        { shopId: shop.id, groupId: g.id, label: 'Almond', priceDeltaPence: 40, sort: 3 },
      ]),
    )
    .returning()

  const sizeGroups = await db
    .insert(optionGroups)
    .values(milkAndFilter.map((p) => ({ shopId: shop.id, productId: p.id, name: 'Size', required: 1, min: 1, max: 1, sort: 1 })))
    .returning()
  const sizeOpts = await db
    .insert(options)
    .values(
      sizeGroups.flatMap((g) => [
        { shopId: shop.id, groupId: g.id, label: 'Regular', priceDeltaPence: 0, sort: 0 },
        { shopId: shop.id, groupId: g.id, label: 'Large', priceDeltaPence: 50, sort: 1 },
        { shopId: shop.id, groupId: g.id, label: 'Extra Large', priceDeltaPence: 80, sort: 2 },
      ]),
    )
    .returning()

  const espressoGroups2 = await db
    .insert(optionGroups)
    .values(espressoProducts.map((p) => ({ shopId: shop.id, productId: p.id, name: 'Extras', required: 0, min: 0, max: 3, sort: 2 })))
    .returning()
  await db
    .insert(options)
    .values(
      espressoGroups2.flatMap((g) => [
        { shopId: shop.id, groupId: g.id, label: 'Extra Shot', priceDeltaPence: 80, sort: 0 },
        { shopId: shop.id, groupId: g.id, label: 'Decaf', priceDeltaPence: 0, sort: 1 },
        { shopId: shop.id, groupId: g.id, label: 'Iced', priceDeltaPence: 60, sort: 2 },
      ]),
    )

  const brunchGroups = await db
    .insert(optionGroups)
    .values([
      { shopId: shop.id, productId: avoToast.id, name: 'Extras', required: 0, min: 0, max: 3, sort: 0 },
      { shopId: shop.id, productId: eggsBenedict.id, name: 'Extras', required: 0, min: 0, max: 3, sort: 0 },
      { shopId: shop.id, productId: breakfastSandwich.id, name: 'Extras', required: 0, min: 0, max: 3, sort: 0 },
    ])
    .returning()
  const brunchExtrasOpts = await db
    .insert(options)
    .values(
      brunchGroups.flatMap((g) => [
        { shopId: shop.id, groupId: g.id, label: 'Extra Egg', priceDeltaPence: 120, sort: 0 },
        { shopId: shop.id, groupId: g.id, label: 'Bacon', priceDeltaPence: 150, sort: 1 },
        { shopId: shop.id, groupId: g.id, label: 'Side Salad', priceDeltaPence: 100, sort: 2 },
      ]),
    )
    .returning()

  // ── INGREDIENTS ──────────────────────────────────────────────────
  const [wholeMilk, oatMilkRow, coffeeBeans, sourdough, butter, eggs, avocado, cheddar, granola, bananas, cinnamon] = await db
    .insert(ingredients)
    .values([
      { shopId: shop.id, name: 'Whole milk', unit: 'L', stockQty: '12', lowStockThreshold: '3', costPerUnit: '1.20' },
      { shopId: shop.id, name: 'Oat milk', unit: 'L', stockQty: '1.5', lowStockThreshold: '2', costPerUnit: '1.80' },
      { shopId: shop.id, name: 'Espresso beans', unit: 'kg', stockQty: '8', lowStockThreshold: '2', costPerUnit: '28' },
      { shopId: shop.id, name: 'Sourdough loaf', unit: 'loaf', stockQty: '3', lowStockThreshold: '4', costPerUnit: '3.50' },
      { shopId: shop.id, name: 'Butter', unit: 'kg', stockQty: '4', lowStockThreshold: '1', costPerUnit: '7' },
      { shopId: shop.id, name: 'Eggs', unit: 'dozen', stockQty: '6', lowStockThreshold: '2', costPerUnit: '4' },
      { shopId: shop.id, name: 'Avocado', unit: 'kg', stockQty: '4', lowStockThreshold: '2', costPerUnit: '5' },
      { shopId: shop.id, name: 'Cheddar', unit: 'kg', stockQty: '2', lowStockThreshold: '1', costPerUnit: '8' },
      { shopId: shop.id, name: 'Granola', unit: 'kg', stockQty: '3', lowStockThreshold: '1', costPerUnit: '6' },
      { shopId: shop.id, name: 'Bananas', unit: 'kg', stockQty: '3', lowStockThreshold: '1', costPerUnit: '1.50' },
      { shopId: shop.id, name: 'Cinnamon', unit: 'kg', stockQty: '0.8', lowStockThreshold: '0.5', costPerUnit: '12' },
    ])
    .returning()

  // ── RECIPES ──────────────────────────────────────────────────────
  await db.insert(recipes).values([
    { shopId: shop.id, productId: flatWhite.id, ingredientId: wholeMilk.id, qtyPerServe: '0.15' },
    { shopId: shop.id, productId: flatWhite.id, ingredientId: coffeeBeans.id, qtyPerServe: '0.02' },
    { shopId: shop.id, productId: oatLatte.id, ingredientId: oatMilkRow.id, qtyPerServe: '0.20' },
    { shopId: shop.id, productId: oatLatte.id, ingredientId: coffeeBeans.id, qtyPerServe: '0.02' },
    { shopId: shop.id, productId: cortado.id, ingredientId: wholeMilk.id, qtyPerServe: '0.06' },
    { shopId: shop.id, productId: cortado.id, ingredientId: coffeeBeans.id, qtyPerServe: '0.02' },
    { shopId: shop.id, productId: americano.id, ingredientId: coffeeBeans.id, qtyPerServe: '0.02' },
    { shopId: shop.id, productId: cappuccino.id, ingredientId: wholeMilk.id, qtyPerServe: '0.18' },
    { shopId: shop.id, productId: cappuccino.id, ingredientId: coffeeBeans.id, qtyPerServe: '0.02' },
    { shopId: shop.id, productId: v60.id, ingredientId: coffeeBeans.id, qtyPerServe: '0.015' },
    { shopId: shop.id, productId: coldBrew.id, ingredientId: coffeeBeans.id, qtyPerServe: '0.03' },
    { shopId: shop.id, productId: chemex.id, ingredientId: coffeeBeans.id, qtyPerServe: '0.015' },
    { shopId: shop.id, productId: batchBrew.id, ingredientId: coffeeBeans.id, qtyPerServe: '0.012' },
    { shopId: shop.id, productId: avoToast.id, ingredientId: sourdough.id, qtyPerServe: '1' },
    { shopId: shop.id, productId: avoToast.id, ingredientId: avocado.id, qtyPerServe: '0.15' },
    { shopId: shop.id, productId: avoToast.id, ingredientId: eggs.id, qtyPerServe: '0.17' },
    { shopId: shop.id, productId: eggsBenedict.id, ingredientId: sourdough.id, qtyPerServe: '1' },
    { shopId: shop.id, productId: eggsBenedict.id, ingredientId: eggs.id, qtyPerServe: '0.34' },
    { shopId: shop.id, productId: granolaBowl.id, ingredientId: granola.id, qtyPerServe: '0.1' },
    { shopId: shop.id, productId: breakfastSandwich.id, ingredientId: eggs.id, qtyPerServe: '0.17' },
    { shopId: shop.id, productId: breakfastSandwich.id, ingredientId: cheddar.id, qtyPerServe: '0.05' },
    { shopId: shop.id, productId: croissant.id, ingredientId: butter.id, qtyPerServe: '0.05' },
    { shopId: shop.id, productId: bananaBread.id, ingredientId: bananas.id, qtyPerServe: '0.12' },
    { shopId: shop.id, productId: bananaBread.id, ingredientId: butter.id, qtyPerServe: '0.03' },
    { shopId: shop.id, productId: cinnamonRoll.id, ingredientId: butter.id, qtyPerServe: '0.04' },
    { shopId: shop.id, productId: cinnamonRoll.id, ingredientId: cinnamon.id, qtyPerServe: '0.01' },
    { shopId: shop.id, productId: cake.id, ingredientId: butter.id, qtyPerServe: '0.05' },
    { shopId: shop.id, productId: cake.id, ingredientId: eggs.id, qtyPerServe: '0.17' },
  ])

  // ── TABLES ───────────────────────────────────────────────────────
  // 'Counter' keeps a deterministic token so E2E and dev QR flows can target it.
  await db.insert(tables).values([
    { shopId: shop.id, label: 'Counter', qrToken: '00000000-0000-4000-8000-000000000001' },
    { shopId: shop.id, label: 'Window 1', qrToken: crypto.randomUUID() },
    { shopId: shop.id, label: 'Window 2', qrToken: crypto.randomUUID() },
    { shopId: shop.id, label: 'Patio 1', qrToken: crypto.randomUUID() },
    { shopId: shop.id, label: 'Patio 2', qrToken: crypto.randomUUID() },
  ])

  // ── CUSTOMERS ────────────────────────────────────────────────────
  const [cAlice, cBen, cClaire, cDev, cEmma, cFrank] = await db
    .insert(customers)
    .values([
      { shopId: shop.id, name: 'Alice Morgan', phone: '+1 207 555 0101', loyaltyPoints: 120, visits: 18, lastVisitAt: ts(10, 30) },
      { shopId: shop.id, name: 'Ben Harper', phone: '+1 207 555 0102', loyaltyPoints: 45, visits: 8, lastVisitAt: ts(9, 15) },
      { shopId: shop.id, name: 'Claire Dubois', phone: '+1 207 555 0103', loyaltyPoints: 210, visits: 32, lastVisitAt: ts(11, 0) },
      { shopId: shop.id, name: 'Daniel Reeves', phone: '+1 207 555 0104', loyaltyPoints: 80, visits: 12, lastVisitAt: ts(8, 45) },
      { shopId: shop.id, name: 'Emma Walsh', phone: '+1 207 555 0105', loyaltyPoints: 15, visits: 3, lastVisitAt: ts(7, 30) },
      { shopId: shop.id, name: 'Frank Okafor', phone: '+1 207 555 0106', loyaltyPoints: 95, visits: 15, lastVisitAt: ts(12, 0) },
    ])
    .returning()

  // ── ORDERS ───────────────────────────────────────────────────────
  type Snapshot = { id: number; label: string; priceDeltaPence: number }

  function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  type OrderDef = {
    hour: number; min: number
    customer?: typeof customers.$inferInsert
    status: 'collected' | 'received' | 'making' | 'ready' | 'cancelled'
    paymentStatus?: 'paid' | 'pending'
    type?: 'pickup' | 'dine_in'
    items: { product: typeof products.$inferSelect; qty: number; opts: Snapshot[] }[]
  }

  const orderDefs: OrderDef[] = [
    // Morning rush (7-9) — mostly collected
    { hour: 7, min: 12, customer: cEmma, status: 'collected', items: [
      { product: americano, qty: 1, opts: [{ ...sizeOpts[0], label: 'Regular' }] },
      { product: croissant, qty: 1, opts: [] },
    ]},
    { hour: 7, min: 28, status: 'collected', items: [
      { product: flatWhite, qty: 2, opts: [{ ...milkOpts[0], label: 'Whole' }, { ...sizeOpts[0], label: 'Regular' }] },
    ]},
    { hour: 7, min: 45, customer: cBen, status: 'collected', items: [
      { product: oatLatte, qty: 1, opts: [{ ...milkOpts[4], label: 'Oat' }, { ...sizeOpts[3], label: 'Large' }] },
    ]},
    { hour: 8, min: 5, status: 'collected', items: [
      { product: cortado, qty: 1, opts: [{ ...milkOpts[0], label: 'Whole' }, { ...sizeOpts[0], label: 'Regular' }] },
      { product: granolaBowl, qty: 1, opts: [] },
    ]},
    { hour: 8, min: 18, customer: cAlice, status: 'collected', items: [
      { product: flatWhite, qty: 1, opts: [{ ...milkOpts[0], label: 'Whole' }, { ...sizeOpts[0], label: 'Regular' }] },
      { product: avoToast, qty: 1, opts: [{ ...brunchExtrasOpts[0], label: 'Extra Egg' }] },
    ]},
    { hour: 8, min: 35, status: 'collected', items: [
      { product: americano, qty: 1, opts: [{ ...sizeOpts[0], label: 'Regular' }] },
    ]},
    { hour: 8, min: 52, customer: cDev, status: 'collected', items: [
      { product: cappuccino, qty: 1, opts: [{ ...milkOpts[0], label: 'Whole' }, { ...sizeOpts[0], label: 'Regular' }] },
      { product: breakfastSandwich, qty: 1, opts: [{ ...brunchExtrasOpts[6], label: 'Bacon' }] },
    ]},
    { hour: 9, min: 10, status: 'collected', items: [
      { product: v60, qty: 1, opts: [{ ...sizeOpts[0], label: 'Regular' }] },
      { product: bananaBread, qty: 1, opts: [] },
    ]},
    { hour: 9, min: 28, customer: cClaire, status: 'collected', items: [
      { product: oatLatte, qty: 2, opts: [{ ...milkOpts[4], label: 'Oat' }, { ...sizeOpts[0], label: 'Regular' }] },
      { product: cinnamonRoll, qty: 1, opts: [] },
    ]},
    { hour: 9, min: 45, status: 'collected', type: 'dine_in', items: [
      { product: flatWhite, qty: 1, opts: [{ ...milkOpts[0], label: 'Whole' }, { ...sizeOpts[0], label: 'Regular' }] },
      { product: eggsBenedict, qty: 1, opts: [] },
    ]},
    { hour: 10, min: 5, customer: cFrank, status: 'collected', items: [
      { product: americano, qty: 2, opts: [{ ...sizeOpts[0], label: 'Regular' }] },
    ]},
    { hour: 10, min: 22, status: 'collected', items: [
      { product: coldBrew, qty: 1, opts: [{ ...sizeOpts[0], label: 'Regular' }] },
    ]},
    { hour: 10, min: 40, customer: cAlice, status: 'collected', items: [
      { product: flatWhite, qty: 1, opts: [{ ...milkOpts[0], label: 'Whole' }, { ...sizeOpts[0], label: 'Regular' }] },
    ]},
    { hour: 11, min: 0, status: 'collected', items: [
      { product: cortado, qty: 1, opts: [{ ...milkOpts[0], label: 'Whole' }, { ...sizeOpts[0], label: 'Regular' }] },
      { product: avoToast, qty: 1, opts: [{ ...brunchExtrasOpts[0], label: 'Extra Egg' }, { ...brunchExtrasOpts[1], label: 'Side Salad' }] },
    ]},
    { hour: 11, min: 30, customer: cBen, status: 'collected', type: 'dine_in', items: [
      { product: chemex, qty: 1, opts: [{ ...sizeOpts[6], label: 'Regular' }] },
      { product: granolaBowl, qty: 1, opts: [] },
    ]},
    { hour: 12, min: 15, status: 'collected', items: [
      { product: flatWhite, qty: 1, opts: [{ ...milkOpts[0], label: 'Whole' }, { ...sizeOpts[0], label: 'Regular' }] },
      { product: breakfastSandwich, qty: 1, opts: [] },
    ]},
    { hour: 12, min: 50, customer: cClaire, status: 'collected', items: [
      { product: oatLatte, qty: 1, opts: [{ ...milkOpts[4], label: 'Oat' }, { ...sizeOpts[3], label: 'Large' }] },
    ]},
    // Afternoon (1-3)
    { hour: 13, min: 20, status: 'collected', items: [
      { product: coldBrew, qty: 2, opts: [{ ...sizeOpts[3], label: 'Large' }] },
    ]},
    { hour: 13, min: 55, customer: cDev, status: 'collected', items: [
      { product: americano, qty: 1, opts: [{ ...sizeOpts[0], label: 'Regular' }] },
      { product: cake, qty: 1, opts: [] },
    ]},
    { hour: 14, min: 30, status: 'collected', items: [
      { product: v60, qty: 1, opts: [{ ...sizeOpts[0], label: 'Regular' }] },
    ]},
    { hour: 15, min: 10, customer: cFrank, status: 'collected', items: [
      { product: flatWhite, qty: 1, opts: [{ ...milkOpts[0], label: 'Whole' }, { ...sizeOpts[0], label: 'Regular' }] },
      { product: cinnamonRoll, qty: 1, opts: [] },
    ]},
    { hour: 15, min: 45, status: 'collected', items: [
      { product: batchBrew, qty: 1, opts: [{ ...sizeOpts[0], label: 'Regular' }] },
    ]},
    // Late afternoon (4-5)
    { hour: 16, min: 20, customer: cEmma, status: 'collected', items: [
      { product: oatLatte, qty: 1, opts: [{ ...milkOpts[4], label: 'Oat' }, { ...sizeOpts[0], label: 'Regular' }] },
      { product: bananaBread, qty: 1, opts: [] },
    ]},
    // ── CANCELLED ──────────────────────────────────────────────────
    { hour: 8, min: 10, status: 'cancelled', items: [
      { product: americano, qty: 1, opts: [{ ...sizeOpts[0], label: 'Regular' }] },
    ]},
    // ── PENDING PAYMENT ────────────────────────────────────────────
    { hour: 16, min: 40, customer: cBen, status: 'received', paymentStatus: 'pending', items: [
      { product: cappuccino, qty: 1, opts: [{ ...milkOpts[0], label: 'Whole' }, { ...sizeOpts[0], label: 'Regular' }] },
    ]},
    // ── LIVE (in queue right now) ──────────────────────────────────
    { hour: 16, min: 50, status: 'received', items: [
      { product: flatWhite, qty: 1, opts: [{ ...milkOpts[0], label: 'Whole' }, { ...sizeOpts[0], label: 'Regular' }] },
      { product: croissant, qty: 1, opts: [] },
    ]},
    { hour: 17, min: 0, status: 'making', items: [
      { product: oatLatte, qty: 2, opts: [{ ...milkOpts[4], label: 'Oat' }, { ...sizeOpts[0], label: 'Regular' }] },
    ]},
    { hour: 17, min: 5, status: 'ready', items: [
      { product: cortado, qty: 1, opts: [{ ...milkOpts[0], label: 'Whole' }, { ...sizeOpts[0], label: 'Regular' }] },
      { product: avoToast, qty: 1, opts: [] },
    ]},
  ]

  let orderCount = 0
  let totalRevenue = 0

  for (const def of orderDefs) {
    const created = ts(def.hour, def.min)
    const pickupAt = new Date(created.getTime() + 15 * 60_000)
    const customerName = def.customer?.name ?? pick(['Walk-in', 'Guest', 'Customer'])

    let subtotalPence = 0
    const itemsData: {
      productId: number; nameSnapshot: string; unitPricePence: number
      quantity: number; optionsSnapshot: Snapshot[]; lineTotalPence: number
    }[] = []

    for (const item of def.items) {
      const optTotal = item.opts.reduce((s, o) => s + o.priceDeltaPence, 0)
      const unitPrice = item.product.pricePence + optTotal
      const lineTotal = unitPrice * item.qty
      subtotalPence += lineTotal
      itemsData.push({
        productId: item.product.id,
        nameSnapshot: item.product.name,
        unitPricePence: unitPrice,
        quantity: item.qty,
        optionsSnapshot: item.opts,
        lineTotalPence: lineTotal,
      })
    }

    const [order] = await db
      .insert(orders)
      .values({
        shopId: shop.id,
        type: def.type ?? 'pickup',
        status: def.status,
        customerName,
        subtotalPence,
        totalPence: subtotalPence,
        paymentMethod: pick(['in_store', 'card']),
        paymentStatus: def.paymentStatus ?? (def.status === 'cancelled' ? 'paid' : 'paid'),
        pickupAt,
        createdAt: created,
      })
      .returning()

    await db.insert(orderItems).values(
      itemsData.map((i) => ({ orderId: order.id, ...i })),
    )

    // Status events
    const staffIds = [braxton.id, julia.id, quinn.id, maya.id]
    if (def.status === 'collected') {
      await db.insert(orderStatusEvents).values([
        { orderId: order.id, fromStatus: null, toStatus: 'received', byUserId: pick(staffIds), at: created },
        { orderId: order.id, fromStatus: 'received', toStatus: 'making', byUserId: pick(staffIds), at: new Date(created.getTime() + 2 * 60_000) },
        { orderId: order.id, fromStatus: 'making', toStatus: 'ready', byUserId: pick(staffIds), at: new Date(created.getTime() + 6 * 60_000) },
        { orderId: order.id, fromStatus: 'ready', toStatus: 'collected', byUserId: pick(staffIds), at: pickupAt },
      ])
    } else if (def.status === 'cancelled') {
      await db.insert(orderStatusEvents).values([
        { orderId: order.id, fromStatus: null, toStatus: 'received', byUserId: pick(staffIds), at: created },
        { orderId: order.id, fromStatus: 'received', toStatus: 'cancelled', byUserId: pick(staffIds), at: new Date(created.getTime() + 3 * 60_000) },
      ])
    } else if (def.status === 'received') {
      await db.insert(orderStatusEvents).values({
        orderId: order.id, fromStatus: null, toStatus: 'received', byUserId: pick(staffIds), at: created,
      })
    } else if (def.status === 'making') {
      await db.insert(orderStatusEvents).values([
        { orderId: order.id, fromStatus: null, toStatus: 'received', byUserId: pick(staffIds), at: created },
        { orderId: order.id, fromStatus: 'received', toStatus: 'making', byUserId: pick(staffIds), at: new Date(created.getTime() + 2 * 60_000) },
      ])
    } else if (def.status === 'ready') {
      await db.insert(orderStatusEvents).values([
        { orderId: order.id, fromStatus: null, toStatus: 'received', byUserId: pick(staffIds), at: created },
        { orderId: order.id, fromStatus: 'received', toStatus: 'making', byUserId: pick(staffIds), at: new Date(created.getTime() + 2 * 60_000) },
        { orderId: order.id, fromStatus: 'making', toStatus: 'ready', byUserId: pick(staffIds), at: new Date(created.getTime() + 6 * 60_000) },
      ])
    }

    if (def.status !== 'cancelled') {
      orderCount++
      totalRevenue += subtotalPence
    }
  }

  // ── INVENTORY MOVEMENTS (receipts + sales) ───────────────────────
  const allIngredients = [wholeMilk, oatMilkRow, coffeeBeans, sourdough, butter, eggs, avocado, cheddar, granola, bananas, cinnamon]
  await db.insert(inventoryMovements).values(
    allIngredients.map((ing) => ({
      shopId: shop.id,
      ingredientId: ing.id,
      change: String(Number(ing.name === 'Oat milk' ? '8' : ing.name === 'Espresso beans' ? '10' : ing.name === 'Sourdough loaf' ? '12' : ing.name === 'Butter' ? '5' : ing.name === 'Eggs' ? '8' : ing.name === 'Avocado' ? '6' : ing.name === 'Whole milk' ? '15' : ing.name === 'Cheddar' ? '3' : ing.name === 'Granola' ? '4' : ing.name === 'Bananas' ? '5' : '2')),
      reason: 'receipt' as const,
      note: 'Opening stock delivery',
      createdAt: ts(6, 0),
    })),
  )

  // ── DONE ─────────────────────────────────────────────────────────
  console.log('Seeded shop "%s" (id=%d).', shop.name, shop.id)
  console.log('  Staff: 4 users (braxton/julia/quinn/maya@cribstonecoffee.com · password: cribstone2026)')
  console.log('  Menu: %d products across %d categories', productRows.length, 4)
  console.log('  Customers: %d', 6)
  const revenue = (totalRevenue / 100).toFixed(2)
  console.log('  Orders today: %d completed, 3 live, 1 pending · revenue $%s', orderCount, revenue)
  console.log('  Tables: 5')
  await pool.end()
}

const isDirectRun = import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectRun) {
  seed().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
