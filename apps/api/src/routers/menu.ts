import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { and, asc, eq } from 'drizzle-orm'
import {
  categories,
  optionGroups,
  options,
  orderItems,
  products,
  shops,
} from '@groundwork/db'
import {
  categoryInput,
  optionGroupInput,
  optionInput,
  productInput,
  reorderInput,
} from '@groundwork/shared'
import { ownerProcedure, publicProcedure, router } from '../trpc'

const idInput = z.object({ id: z.number().int().positive() })

export const menuRouter = router({
  publicMenu: publicProcedure.query(async ({ ctx }) => {
    const [shop] = await ctx.db.select().from(shops).limit(1)
    if (!shop) {
      return { shop: null, categories: [] }
    }

    const cats = await ctx.db
      .select()
      .from(categories)
      .where(eq(categories.shopId, shop.id))
      .orderBy(asc(categories.sort))
    const prods = await ctx.db
      .select()
      .from(products)
      .where(eq(products.shopId, shop.id))
      .orderBy(asc(products.sort))
    const groups = await ctx.db
      .select()
      .from(optionGroups)
      .where(eq(optionGroups.shopId, shop.id))
      .orderBy(asc(optionGroups.sort))
    const opts = await ctx.db
      .select()
      .from(options)
      .where(eq(options.shopId, shop.id))
      .orderBy(asc(options.sort))

    const activeCats = cats.filter((c) => c.active === 1)
    const activeProds = prods.filter((p) => p.active === 1)
    const groupsByProduct = groupBy(groups, 'productId')
    const optsByGroup = groupBy(opts, 'groupId')

    const categoriesWithProducts = activeCats.map((cat) => ({
      id: cat.id,
      name: cat.name,
      products: activeProds
        .filter((p) => p.categoryId === cat.id)
        .map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          pricePence: p.pricePence,
          imageUrl: p.imageUrl,
          dietaryTags: p.dietaryTags,
          optionGroups: (groupsByProduct.get(p.id) ?? []).map((g) => ({
            id: g.id,
            name: g.name,
            required: g.required === 1,
            min: g.min,
            max: g.max,
            options: (optsByGroup.get(g.id) ?? []).map((o) => ({
              id: o.id,
              label: o.label,
              priceDeltaPence: o.priceDeltaPence,
            })),
          })),
        })),
    }))

    return {
      shop: {
        id: shop.id,
        name: shop.name,
        address: shop.address,
        hours: shop.hours,
        phone: shop.phone,
      },
      categories: categoriesWithProducts.filter((c) => c.products.length > 0),
    }
  }),

  admin: {
    list: ownerProcedure.query(async ({ ctx }) => {
      const [cats, prods, groups, opts] = await Promise.all([
        ctx.db
          .select()
          .from(categories)
          .where(eq(categories.shopId, ctx.user.shopId))
          .orderBy(asc(categories.sort)),
        ctx.db
          .select()
          .from(products)
          .where(eq(products.shopId, ctx.user.shopId))
          .orderBy(asc(products.sort)),
        ctx.db
          .select()
          .from(optionGroups)
          .where(eq(optionGroups.shopId, ctx.user.shopId))
          .orderBy(asc(optionGroups.sort)),
        ctx.db
          .select()
          .from(options)
          .where(eq(options.shopId, ctx.user.shopId))
          .orderBy(asc(options.sort)),
      ])
      return { categories: cats, products: prods, optionGroups: groups, options: opts }
    }),

    createCategory: ownerProcedure.input(categoryInput).mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(categories)
        .values({ shopId: ctx.user.shopId, name: input.name, sort: input.sort, active: input.active ? 1 : 0 })
        .returning()
      return row
    }),

    updateCategory: ownerProcedure
      .input(categoryInput.partial().extend({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...rest } = input
        const set: Partial<typeof categories.$inferInsert> = {}
        if (rest.name !== undefined) set.name = rest.name
        if (rest.sort !== undefined) set.sort = rest.sort
        if (rest.active !== undefined) set.active = rest.active ? 1 : 0
        const [row] = await ctx.db
          .update(categories)
          .set(set)
          .where(and(eq(categories.id, id), eq(categories.shopId, ctx.user.shopId)))
          .returning()
        if (!row) throw new TRPCError({ code: 'NOT_FOUND' })
        return row
      }),

    deleteCategory: ownerProcedure
      .input(idInput)
      .mutation(async ({ ctx, input }) => {
        const prods = await ctx.db
          .select({ id: products.id })
          .from(products)
          .where(and(eq(products.categoryId, input.id), eq(products.shopId, ctx.user.shopId)))
          .limit(1)
        if (prods.length > 0) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Category has products' })
        }
        const rows = await ctx.db
          .delete(categories)
          .where(and(eq(categories.id, input.id), eq(categories.shopId, ctx.user.shopId)))
          .returning()
        if (rows.length === 0) throw new TRPCError({ code: 'NOT_FOUND' })
        return { ok: true }
      }),

    createProduct: ownerProcedure.input(productInput).mutation(async ({ ctx, input }) => {
      const [cat] = await ctx.db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.id, input.categoryId), eq(categories.shopId, ctx.user.shopId)))
        .limit(1)
      if (!cat) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unknown category' })
      const [row] = await ctx.db
        .insert(products)
        .values({
          shopId: ctx.user.shopId,
          categoryId: input.categoryId,
          name: input.name,
          description: input.description,
          pricePence: input.pricePence,
          imageUrl: input.imageUrl,
          dietaryTags: input.dietaryTags,
          sort: input.sort,
          active: input.active ? 1 : 0,
        })
        .returning()
      return row
    }),

    updateProduct: ownerProcedure
      .input(productInput.partial().extend({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...rest } = input
        const set: Partial<typeof products.$inferInsert> = {}
        if (rest.name !== undefined) set.name = rest.name
        if (rest.description !== undefined) set.description = rest.description
        if (rest.categoryId !== undefined) set.categoryId = rest.categoryId
        if (rest.pricePence !== undefined) set.pricePence = rest.pricePence
        if (rest.imageUrl !== undefined) set.imageUrl = rest.imageUrl
        if (rest.dietaryTags !== undefined) set.dietaryTags = rest.dietaryTags
        if (rest.sort !== undefined) set.sort = rest.sort
        if (rest.active !== undefined) set.active = rest.active ? 1 : 0
        const [row] = await ctx.db
          .update(products)
          .set(set)
          .where(and(eq(products.id, id), eq(products.shopId, ctx.user.shopId)))
          .returning()
        if (!row) throw new TRPCError({ code: 'NOT_FOUND' })
        return row
      }),

    deleteProduct: ownerProcedure
      .input(idInput)
      .mutation(async ({ ctx, input }) => {
        const used = await ctx.db
          .select({ id: orderItems.id })
          .from(orderItems)
          .where(eq(orderItems.productId, input.id))
          .limit(1)
        if (used.length > 0) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Product has past orders — deactivate instead' })
        }
        const rows = await ctx.db
          .delete(products)
          .where(and(eq(products.id, input.id), eq(products.shopId, ctx.user.shopId)))
          .returning()
        if (rows.length === 0) throw new TRPCError({ code: 'NOT_FOUND' })
        return { ok: true }
      }),

    createOptionGroup: ownerProcedure
      .input(optionGroupInput)
      .mutation(async ({ ctx, input }) => {
        const [row] = await ctx.db
          .insert(optionGroups)
          .values({
            shopId: ctx.user.shopId,
            productId: input.productId,
            name: input.name,
            required: input.required ? 1 : 0,
            min: input.min,
            max: input.max,
          })
          .returning()
        return row
      }),

    deleteOptionGroup: ownerProcedure
      .input(idInput)
      .mutation(async ({ ctx, input }) => {
        const rows = await ctx.db
          .delete(optionGroups)
          .where(and(eq(optionGroups.id, input.id), eq(optionGroups.shopId, ctx.user.shopId)))
          .returning()
        if (rows.length === 0) throw new TRPCError({ code: 'NOT_FOUND' })
        return { ok: true }
      }),

    createOption: ownerProcedure.input(optionInput).mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(options)
        .values({
          shopId: ctx.user.shopId,
          groupId: input.groupId,
          label: input.label,
          priceDeltaPence: input.priceDeltaPence,
        })
        .returning()
      return row
    }),

    deleteOption: ownerProcedure
      .input(idInput)
      .mutation(async ({ ctx, input }) => {
        const rows = await ctx.db
          .delete(options)
          .where(and(eq(options.id, input.id), eq(options.shopId, ctx.user.shopId)))
          .returning()
        if (rows.length === 0) throw new TRPCError({ code: 'NOT_FOUND' })
        return { ok: true }
      }),

    reorderCategories: ownerProcedure.input(reorderInput).mutation(async ({ ctx, input }) => {
      for (const item of input.items) {
        await ctx.db
          .update(categories)
          .set({ sort: item.sort })
          .where(and(eq(categories.id, item.id), eq(categories.shopId, ctx.user.shopId)))
      }
      return { ok: true }
    }),

    reorderProducts: ownerProcedure.input(reorderInput).mutation(async ({ ctx, input }) => {
      for (const item of input.items) {
        await ctx.db
          .update(products)
          .set({ sort: item.sort })
          .where(and(eq(products.id, item.id), eq(products.shopId, ctx.user.shopId)))
      }
      return { ok: true }
    }),
  },
})

function groupBy<T extends { id: number }, K extends keyof T>(
  rows: T[],
  key: K,
): Map<number, T[]> {
  const map = new Map<number, T[]>()
  for (const row of rows) {
    const list = map.get(row[key] as number) ?? []
    list.push(row)
    map.set(row[key] as number, list)
  }
  return map
}
