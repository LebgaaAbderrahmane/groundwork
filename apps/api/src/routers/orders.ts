import { TRPCError } from '@trpc/server'
import { and, asc, desc, eq, gte, inArray } from 'drizzle-orm'
import {
  orderItems,
  orderStatusEvents,
  orders,
  optionGroups,
  options,
  products,
  shops,
} from '@cribstone/db'
import {
  ORDER_STATUS_FLOW,
  advanceOrderInput,
  cancelOrderInput,
  createOrderInput,
  myOrdersInput,
  type OrderStatus,
} from '@cribstone/shared'
import { publicProcedure, protectedProcedure, router } from '../trpc'
import type { DB } from '../db'
import { deductInventory } from '../services/inventory'
import { applyLoyalty } from '../services/loyalty'
import { payments } from '../services/payments'
import { emitOrderUpdate } from '../services/events'

const ACTIVE_STATUSES: OrderStatus[] = ['received', 'making', 'ready']

async function getShopId(db: DB) {
  const [shop] = await db.select({ id: shops.id }).from(shops).limit(1)
  if (!shop) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No shop configured' })
  }
  return shop.id
}

function toOrderWithItems(order: typeof orders.$inferSelect, items: typeof orderItems.$inferSelect[]) {
  return {
    ...order,
    items: items.map((i) => ({
      id: i.id,
      productId: i.productId,
      name: i.nameSnapshot,
      unitPricePence: i.unitPricePence,
      quantity: i.quantity,
      options: i.optionsSnapshot,
      lineTotalPence: i.lineTotalPence,
    })),
  }
}

export const ordersRouter = router({
  create: publicProcedure.input(createOrderInput).mutation(async ({ ctx, input }) => {
    const shopId = await getShopId(ctx.db)

    const productIds = [...new Set(input.items.map((i) => i.productId))]
    const prods = await ctx.db
      .select()
      .from(products)
      .where(and(eq(products.shopId, shopId), inArray(products.id, productIds)))
    const productMap = new Map(prods.map((p) => [p.id, p]))

    const groups = await ctx.db
      .select()
      .from(optionGroups)
      .where(
        and(
          eq(optionGroups.shopId, shopId),
          inArray(optionGroups.productId, productIds),
        ),
      )
    const groupMap = new Map<number, typeof groups[number][]>()
    for (const g of groups) {
      const list = groupMap.get(g.productId) ?? []
      list.push(g)
      groupMap.set(g.productId, list)
    }

    const allOpts = await ctx.db
      .select()
      .from(options)
      .where(eq(options.shopId, shopId))
    const optsByGroup = new Map<number, typeof allOpts[number][]>()
    for (const o of allOpts) {
      const list = optsByGroup.get(o.groupId) ?? []
      list.push(o)
      optsByGroup.set(o.groupId, list)
    }

    let subtotalPence = 0
    const lines: Array<{
      productId: number
      nameSnapshot: string
      unitPricePence: number
      quantity: number
      optionsSnapshot: Array<{ id: number; label: string; priceDeltaPence: number }>
      lineTotalPence: number
    }> = []

    for (const item of input.items) {
      const product = productMap.get(item.productId)
      if (!product || product.active !== 1) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Product ${item.productId} is not available`,
        })
      }

      const productGroups = groupMap.get(product.id) ?? []
      const selectedIds = new Set(item.options.map((o) => o.id))

      for (const group of productGroups) {
        const selectedInGroup = item.options.filter((o) =>
          (optsByGroup.get(group.id) ?? []).some((opt) => opt.id === o.id),
        )
        if (group.required === 1 && selectedInGroup.length < group.min) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `"${product.name}": ${group.name} requires at least ${group.min} selection`,
          })
        }
        if (selectedInGroup.length > group.max) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `"${product.name}": too many selections for ${group.name}`,
          })
        }
      }

      let unitPricePence = product.pricePence
      const snapshot: typeof lines[number]['optionsSnapshot'] = []
      for (const sel of item.options) {
        const opt = allOpts.find((o) => o.id === sel.id && selectedIds.has(o.id))
        if (!opt) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Option ${sel.id} is not valid for "${product.name}"`,
          })
        }
        unitPricePence += opt.priceDeltaPence
        snapshot.push({ id: opt.id, label: opt.label, priceDeltaPence: opt.priceDeltaPence })
      }

      const lineTotalPence = unitPricePence * item.quantity
      subtotalPence += lineTotalPence
      lines.push({
        productId: product.id,
        nameSnapshot: product.name,
        unitPricePence,
        quantity: item.quantity,
        optionsSnapshot: snapshot,
        lineTotalPence,
      })
    }

    const { paymentStatus } = await payments.charge({
      amountPence: subtotalPence,
      method: input.paymentMethod,
    })

    const [order] = await ctx.db
      .insert(orders)
      .values({
        shopId,
        type: input.type,
        status: 'received',
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        notes: input.notes,
        subtotalPence,
        totalPence: subtotalPence,
        paymentMethod: input.paymentMethod,
        paymentStatus,
        pickupAt: input.pickupAt ? new Date(input.pickupAt) : null,
      })
      .returning()

    await ctx.db.insert(orderItems).values(
      lines.map((l) => ({ orderId: order.id, ...l })),
    )
    await ctx.db.insert(orderStatusEvents).values({
      orderId: order.id,
      fromStatus: null,
      toStatus: 'received',
    })

    await deductInventory(ctx.db, shopId, order.id, lines)

    if (input.customerPhone) {
      await applyLoyalty(ctx.db, shopId, {
        name: input.customerName,
        phone: input.customerPhone,
        orderId: order.id,
      })
    }

    emitOrderUpdate({ type: 'order.created', orderId: order.id, status: order.status })

    return { orderId: order.id, totalPence: order.totalPence, status: order.status }
  }),

  myRecent: publicProcedure.input(myOrdersInput).query(async ({ ctx, input }) => {
    const shopId = await getShopId(ctx.db)
    const rows = await ctx.db
      .select()
      .from(orders)
      .where(and(eq(orders.shopId, shopId), eq(orders.customerPhone, input.phone)))
      .orderBy(desc(orders.createdAt))
      .limit(5)
    const itemRows = await ctx.db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, rows.map((r) => r.id)))
    const itemsByOrder = new Map<number, typeof itemRows>()
    for (const item of itemRows) {
      const list = itemsByOrder.get(item.orderId) ?? []
      list.push(item)
      itemsByOrder.set(item.orderId, list)
    }
    return rows.map((o) => toOrderWithItems(o, itemsByOrder.get(o.id) ?? []))
  }),

  queue: protectedProcedure.query(async ({ ctx }) => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const rows = await ctx.db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.shopId, ctx.user.shopId),
          inArray(orders.status, ACTIVE_STATUSES),
          gte(orders.createdAt, startOfDay),
        ),
      )
      .orderBy(asc(orders.createdAt))
    const itemRows = await ctx.db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, rows.map((r) => r.id)))
    const itemsByOrder = new Map<number, typeof itemRows>()
    for (const item of itemRows) {
      const list = itemsByOrder.get(item.orderId) ?? []
      list.push(item)
      itemsByOrder.set(item.orderId, list)
    }
    return rows.map((o) => toOrderWithItems(o, itemsByOrder.get(o.id) ?? []))
  }),

  getById: publicProcedure.input(cancelOrderInput).query(async ({ ctx, input }) => {
    const [order] = await ctx.db.select().from(orders).where(eq(orders.id, input.orderId))
    if (!order) throw new TRPCError({ code: 'NOT_FOUND' })
    const items = await ctx.db.select().from(orderItems).where(eq(orderItems.orderId, order.id))
    return toOrderWithItems(order, items)
  }),

  byId: protectedProcedure
    .input(cancelOrderInput)
    .query(async ({ ctx, input }) => {
      const [order] = await ctx.db
        .select()
        .from(orders)
        .where(and(eq(orders.id, input.orderId), eq(orders.shopId, ctx.user.shopId)))
      if (!order) throw new TRPCError({ code: 'NOT_FOUND' })
      const items = await ctx.db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id))
      return toOrderWithItems(order, items)
    }),

  advanceStatus: protectedProcedure
    .input(advanceOrderInput)
    .mutation(async ({ ctx, input }) => {
      const [order] = await ctx.db
        .select()
        .from(orders)
        .where(and(eq(orders.id, input.orderId), eq(orders.shopId, ctx.user.shopId)))
      if (!order) throw new TRPCError({ code: 'NOT_FOUND' })

      const next = ORDER_STATUS_FLOW[order.status]
      if (!next) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Order is already final' })
      }

      const [updated] = await ctx.db
        .update(orders)
        .set({ status: next, paymentStatus: order.paymentMethod === 'in_store' && next === 'collected' ? 'paid' : order.paymentStatus })
        .where(eq(orders.id, order.id))
        .returning()

      await ctx.db.insert(orderStatusEvents).values({
        orderId: order.id,
        fromStatus: order.status,
        toStatus: next,
        byUserId: ctx.user.id,
      })

      emitOrderUpdate({ type: 'order.updated', orderId: order.id, status: updated.status })
      return updated
    }),

  cancel: protectedProcedure
    .input(cancelOrderInput)
    .mutation(async ({ ctx, input }) => {
      const [order] = await ctx.db
        .select()
        .from(orders)
        .where(and(eq(orders.id, input.orderId), eq(orders.shopId, ctx.user.shopId)))
      if (!order) throw new TRPCError({ code: 'NOT_FOUND' })

      const [updated] = await ctx.db
        .update(orders)
        .set({ status: 'cancelled' })
        .where(eq(orders.id, order.id))
        .returning()

      await ctx.db.insert(orderStatusEvents).values({
        orderId: order.id,
        fromStatus: order.status,
        toStatus: 'cancelled',
        byUserId: ctx.user.id,
      })

      emitOrderUpdate({ type: 'order.cancelled', orderId: order.id, status: 'cancelled' })
      return updated
    }),
})
