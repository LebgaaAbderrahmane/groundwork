import { and, eq, inArray } from 'drizzle-orm'
import { ingredients, inventoryMovements, recipes } from '@groundwork/db'
import type { DB } from '../db'

type OrderItem = {
  productId: number
  quantity: number
}

/**
 * Decrements ingredient stock for an order via its recipes and logs
 * `sale` movements. Non-blocking: stock may go negative if under-supplied.
 */
export async function deductInventory(
  db: DB,
  shopId: number,
  orderId: number,
  items: OrderItem[],
) {
  const productIds = items.map((i) => i.productId)
  const productRecipes = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.shopId, shopId), inArray(recipes.productId, productIds)))

  if (productRecipes.length === 0) return

  const qtyByProduct = new Map(items.map((i) => [i.productId, i.quantity]))
  const movements = new Map<
    number,
    { ingredientId: number; change: number; qtyPerServe: number }
  >()

  for (const recipe of productRecipes) {
    const qty = qtyByProduct.get(recipe.productId) ?? 0
    const change = Number(recipe.qtyPerServe) * qty
    const existing = movements.get(recipe.ingredientId)
    if (existing) {
      existing.change += change
    } else {
      movements.set(recipe.ingredientId, {
        ingredientId: recipe.ingredientId,
        change,
        qtyPerServe: Number(recipe.qtyPerServe),
      })
    }
  }

  for (const m of movements.values()) {
    const [ing] = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.id, m.ingredientId))
      .limit(1)
    if (!ing) continue

    const newStock = Math.max(0, Number(ing.stockQty) - m.change)
    await db
      .update(ingredients)
      .set({ stockQty: String(newStock) })
      .where(eq(ingredients.id, m.ingredientId))

    await db.insert(inventoryMovements).values({
      shopId,
      ingredientId: m.ingredientId,
      change: String(-m.change),
      reason: 'sale',
      refId: orderId,
    })
  }
}
