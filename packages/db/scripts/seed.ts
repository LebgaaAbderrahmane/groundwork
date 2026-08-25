import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import {
  categories,
  ingredients,
  optionGroups,
  options,
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

const IMAGES = {
  flatWhite: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80',
  v60: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  brunch: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=800&q=80',
  croissant: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
  coldBrew: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool)

  const existing = await db.select({ id: shops.id }).from(shops).limit(1)
  if (existing.length > 0) {
    console.log(`Seed skipped — shop already exists (id=${existing[0].id}).`)
    await pool.end()
    return
  }

  const [shop] = await db
    .insert(shops)
    .values({
      name: 'Cribstone Coffee',
      slug: 'cribstone',
      address: '1845 Harpswell Islands Road, Orr\'s Island, ME 04066',
      phone: '+1 207 555 0123',
      hours: 'Monday–Friday 7am–5pm · Saturday–Sunday 8am–5pm',
      paymentMode: 'in_store',
    })
    .returning()

  await db.insert(users).values({
    shopId: shop.id,
    name: 'Braxton Jarratt',
    email: 'braxton@cribstonecoffee.com',
    passwordHash: await bcrypt.hash('cribstone2026', 12),
    role: 'owner',
  })

  const [espresso, filter, brunch, baked] = await db
    .insert(categories)
    .values([
      { shopId: shop.id, name: 'Espresso', sort: 0 },
      { shopId: shop.id, name: 'Filter', sort: 1 },
      { shopId: shop.id, name: 'Brunch', sort: 2 },
      { shopId: shop.id, name: 'Baked Goods', sort: 3 },
    ])
    .returning()

  const [flatWhite, oatLatte, , , avoToast, croissant] = await db
    .insert(products)
    .values([
      {
        shopId: shop.id,
        categoryId: espresso.id,
        name: 'Flat White',
        description: 'Double shot, velvety steamed milk',
        pricePence: 350,
        imageUrl: IMAGES.flatWhite,
      },
      {
        shopId: shop.id,
        categoryId: espresso.id,
        name: 'Oat Latte',
        description: 'Smooth oat milk, signature house blend',
        pricePence: 380,
        imageUrl: IMAGES.flatWhite,
        dietaryTags: ['vegan'],
      },
      {
        shopId: shop.id,
        categoryId: filter.id,
        name: 'V60',
        description: 'Seasonal single origin, bright and delicate',
        pricePence: 380,
        imageUrl: IMAGES.v60,
      },
      {
        shopId: shop.id,
        categoryId: filter.id,
        name: 'Cold Brew',
        description: 'Slow-steeped 18 hours, sweet and mellow',
        pricePence: 400,
        imageUrl: IMAGES.coldBrew,
      },
      {
        shopId: shop.id,
        categoryId: brunch.id,
        name: 'Avocado Toast',
        description: 'Sourdough, smashed avo, chilli flakes, poached egg',
        pricePence: 900,
        imageUrl: IMAGES.brunch,
        dietaryTags: ['vegetarian'],
      },
      {
        shopId: shop.id,
        categoryId: baked.id,
        name: 'Butter Croissant',
        description: 'Baked in-house every morning',
        pricePence: 280,
        imageUrl: IMAGES.croissant,
      },
    ])
    .returning()

  const [milkGroup, sizeGroup] = await db
    .insert(optionGroups)
    .values([
      { shopId: shop.id, productId: flatWhite.id, name: 'Milk', required: 1, min: 1, max: 1 },
      { shopId: shop.id, productId: flatWhite.id, name: 'Size', required: 1, min: 1, max: 1 },
    ])
    .returning()

  await db.insert(options).values([
    { shopId: shop.id, groupId: milkGroup.id, label: 'Whole', priceDeltaPence: 0 },
    { shopId: shop.id, groupId: milkGroup.id, label: 'Oat', priceDeltaPence: 30 },
    { shopId: shop.id, groupId: milkGroup.id, label: 'Soya', priceDeltaPence: 30 },
    { shopId: shop.id, groupId: sizeGroup.id, label: 'Small', priceDeltaPence: 0 },
    { shopId: shop.id, groupId: sizeGroup.id, label: 'Large', priceDeltaPence: 50 },
  ])

  const [wholeMilk, oatMilkRow, coffeeBeans, sourdough, butter] = await db
    .insert(ingredients)
    .values([
      { shopId: shop.id, name: 'Whole milk', unit: 'L', stockQty: '12', lowStockThreshold: '3', costPerUnit: '1.20' },
      { shopId: shop.id, name: 'Oat milk', unit: 'L', stockQty: '8', lowStockThreshold: '2', costPerUnit: '1.80' },
      { shopId: shop.id, name: 'Espresso beans', unit: 'kg', stockQty: '6', lowStockThreshold: '2', costPerUnit: '28' },
      { shopId: shop.id, name: 'Sourdough loaf', unit: 'loaf', stockQty: '10', lowStockThreshold: '4', costPerUnit: '3.50' },
      { shopId: shop.id, name: 'Butter', unit: 'kg', stockQty: '4', lowStockThreshold: '1', costPerUnit: '7' },
    ])
    .returning()

  await db.insert(recipes).values([
    { shopId: shop.id, productId: flatWhite.id, ingredientId: wholeMilk.id, qtyPerServe: '0.15' },
    { shopId: shop.id, productId: flatWhite.id, ingredientId: coffeeBeans.id, qtyPerServe: '0.02' },
    { shopId: shop.id, productId: oatLatte.id, ingredientId: oatMilkRow.id, qtyPerServe: '0.15' },
    { shopId: shop.id, productId: oatLatte.id, ingredientId: coffeeBeans.id, qtyPerServe: '0.02' },
    { shopId: shop.id, productId: avoToast.id, ingredientId: sourdough.id, qtyPerServe: '1' },
    { shopId: shop.id, productId: croissant.id, ingredientId: butter.id, qtyPerServe: '0.05' },
  ])

  await db.insert(tables).values([
    { shopId: shop.id, label: 'Counter', qrToken: crypto.randomUUID() },
    { shopId: shop.id, label: 'Window 1', qrToken: crypto.randomUUID() },
    { shopId: shop.id, label: 'Window 2', qrToken: crypto.randomUUID() },
  ])

  console.log('Seeded shop "%s" (id=%d).', shop.name, shop.id)
  console.log('Owner login: braxton@cribstonecoffee.com / cribstone2026')
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
