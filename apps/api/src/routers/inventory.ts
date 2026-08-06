import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { and, asc, desc, eq, lte } from 'drizzle-orm'
import { ingredients, inventoryMovements, recipes } from '@groundwork/db'
import {
  adjustStockInput,
  ingredientInput,
  recipeInput,
} from '@groundwork/shared'
import { protectedProcedure, router, ownerProcedure } from '../trpc'

export const inventoryRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(ingredients)
      .where(eq(ingredients.shopId, ctx.user.shopId))
      .orderBy(asc(ingredients.name))
    return rows.map((ing) => ({
      ...ing,
      low: Number(ing.stockQty) <= Number(ing.lowStockThreshold),
    }))
  }),

  lowStock: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(ingredients)
      .where(
        and(
          eq(ingredients.shopId, ctx.user.shopId),
          lte(ingredients.stockQty, ingredients.lowStockThreshold),
        ),
      )
      .orderBy(asc(ingredients.name))
    return rows
  }),

  movements: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(inventoryMovements)
      .where(eq(inventoryMovements.shopId, ctx.user.shopId))
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(50)
  }),

  recipes: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: recipes.id,
        productId: recipes.productId,
        ingredientId: recipes.ingredientId,
        qtyPerServe: recipes.qtyPerServe,
        ingredientName: ingredients.name,
        unit: ingredients.unit,
      })
      .from(recipes)
      .innerJoin(ingredients, eq(recipes.ingredientId, ingredients.id))
      .where(eq(recipes.shopId, ctx.user.shopId))
    return rows
  }),

  adjust: protectedProcedure
    .input(adjustStockInput)
    .mutation(async ({ ctx, input }) => {
      const [ing] = await ctx.db
        .select()
        .from(ingredients)
        .where(
          and(
            eq(ingredients.id, input.ingredientId),
            eq(ingredients.shopId, ctx.user.shopId),
          ),
        )
        .limit(1)
      if (!ing) throw new TRPCError({ code: 'NOT_FOUND' })

      const next = Math.max(0, Number(ing.stockQty) + input.change)
      const [updated] = await ctx.db
        .update(ingredients)
        .set({ stockQty: String(next) })
        .where(eq(ingredients.id, ing.id))
        .returning()

      await ctx.db.insert(inventoryMovements).values({
        shopId: ctx.user.shopId,
        ingredientId: ing.id,
        change: String(input.change),
        reason: input.reason,
        note: input.note,
      })

      return updated
    }),

  createIngredient: ownerProcedure
    .input(ingredientInput)
    .mutation(async ({ ctx, input }) => {
      const [ing] = await ctx.db
        .insert(ingredients)
        .values({
          shopId: ctx.user.shopId,
          ...input,
          stockQty: String(input.stockQty),
          lowStockThreshold: String(input.lowStockThreshold),
          costPerUnit: String(input.costPerUnit),
        })
        .returning()
      return ing
    }),

  updateIngredient: ownerProcedure
    .input(ingredientInput.partial().extend({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input
      const set: Partial<typeof ingredients.$inferInsert> = {}
      if (rest.name !== undefined) set.name = rest.name
      if (rest.unit !== undefined) set.unit = rest.unit
      if (rest.stockQty !== undefined) set.stockQty = String(rest.stockQty)
      if (rest.lowStockThreshold !== undefined) set.lowStockThreshold = String(rest.lowStockThreshold)
      if (rest.costPerUnit !== undefined) set.costPerUnit = String(rest.costPerUnit)

      const [ing] = await ctx.db
        .update(ingredients)
        .set(set)
        .where(and(eq(ingredients.id, id), eq(ingredients.shopId, ctx.user.shopId)))
        .returning()
      if (!ing) throw new TRPCError({ code: 'NOT_FOUND' })
      return ing
    }),

  setRecipes: ownerProcedure
    .input(recipeInput.array())
    .mutation(async ({ ctx, input }) => {
      const productId = input[0]?.productId
      if (!productId) return { count: 0 }

      await ctx.db
        .delete(recipes)
        .where(and(eq(recipes.shopId, ctx.user.shopId), eq(recipes.productId, productId)))

      if (input.length > 0) {
        await ctx.db.insert(recipes).values(
          input.map((r) => ({
            shopId: ctx.user.shopId,
            productId: r.productId,
            ingredientId: r.ingredientId,
            qtyPerServe: String(r.qtyPerServe),
          })),
        )
      }
      return { count: input.length }
    }),
})
