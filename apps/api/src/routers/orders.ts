import { TRPCError } from '@trpc/server'
import { and, asc, desc, eq, gte, inArray } from 'drizzle-orm'
import {
  orderItems,
  orderStatusEvents,
  orders,
  optionGroups,
  options,
  products,
  tables,
} from '@cribstone/db'
import {
  ORDER_STATUS_FLOW,
  advanceOrderInput,
  cancelOrderInput,
  createOrderInput,
  myOrdersInput,
  type OrderStatus,
} from '@cribstone/shared'
import { customerProcedure, publicProcedure, protectedProcedure, router } from '../trpc'
import type { DB } from '../db'
import { deductInventory } from '../services/inventory'
import { applyLoyalty } from '../services/loyalty'
import { payments } from '../services/payments'
import { emitOrderUpdate } from '../services/events'
import { getShopId } from '../services/shop'

const ACTIVE_STATUSES: OrderStatus[] = ['received', 'making', 'ready']

function toOrderWithItems(
  order: typeof orders.$inferSelect,
  items: typeof orderItems.$inferSelect[],
  tableLabel?: string | null,
) {
  return {
    ...order,
    tableLabel: tableLabel ?? null,
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

async function tableLabelsFor(db: DB, orderRows: Array<{ tableId: number | null }>) {
  const ids = [...new Set(orderRows.map((o) => o.tableId).filter((id): id is number => id != null))]
  if (ids.length === 0) return new Map<number, string>()
  const rows = await db.select({ id: tables.id, label: tables.label }).from(tables).where(inArray(tables.id, ids))
  return new Map(rows.map((t) => [t.id, t.label]))
}

export const ordersRouter = router({
  create: publicProcedure.input(createOrderInput).mutation(async ({ ctx, input }) => {
    const shopId = await getShopId(ctx.db)

    let tableId: number | null = null
    let type = input.type
    if (input.tableToken) {
      const [table] = await ctx.db
        .select({ id: tables.id })
        .from(tables)
        .where(eq(tables.qrToken, input.tableToken))
      if (!table) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid table token' })
      }
      tableId = table.id
      type = 'dine_in'
    }

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
        type,
        status: 'received',
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        notes: input.notes,
        subtotalPence,
        totalPence: subtotalPence,
        paymentMethod: input.paymentMethod,
        paymentStatus,
        pickupAt: input.pickupAt ? new Date(input.pickupAt) : null,
        tableId,
        customerUserId: ctx.customer?.id ?? null,
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
        totalPence: order.totalPence,
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
    const labels = await tableLabelsFor(ctx.db, rows)
    return rows.map((o) => toOrderWithItems(o, itemsByOrder.get(o.id) ?? [], labels.get(o.tableId ?? -1)))
  }),

  myOrders: customerProcedure.query(async ({ ctx }) => {
    const shopId = await getShopId(ctx.db)
    const uid = ctx.customer!.id
    const rows = await ctx.db
      .select()
      .from(orders)
      .where(and(eq(orders.shopId, shopId), eq(orders.customerUserId, uid)))
      .orderBy(desc(orders.createdAt))
      .limit(50)
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
    const labels = await tableLabelsFor(ctx.db, rows)
    return rows.map((o) => toOrderWithItems(o, itemsByOrder.get(o.id) ?? [], labels.get(o.tableId ?? -1)))
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
    const labels = await tableLabelsFor(ctx.db, rows)
    return rows.map((o) => toOrderWithItems(o, itemsByOrder.get(o.id) ?? [], labels.get(o.tableId ?? -1)))
  }),

  getById: publicProcedure.input(cancelOrderInput).query(async ({ ctx, input }) => {
    const [order] = await ctx.db.select().from(orders).where(eq(orders.id, input.orderId))
    if (!order) throw new TRPCError({ code: 'NOT_FOUND' })
    const items = await ctx.db.select().from(orderItems).where(eq(orderItems.orderId, order.id))
    const labels = await tableLabelsFor(ctx.db, [order])
    return toOrderWithItems(order, items, labels.get(order.tableId ?? -1))
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
      const labels = await tableLabelsFor(ctx.db, [order])
      return toOrderWithItems(order, items, labels.get(order.tableId ?? -1))
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

  kitchenActive: publicProcedure.query(async ({ ctx }) => {
    const shopId = await getShopId(ctx.db)
    const rows = await ctx.db
      .select()
      .from(orders)
      .where(and(eq(orders.shopId, shopId), inArray(orders.status, ACTIVE_STATUSES)))
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
    const labels = await tableLabelsFor(ctx.db, rows)
    return rows.map((o) => toOrderWithItems(o, itemsByOrder.get(o.id) ?? [], labels.get(o.tableId ?? -1)))
  }),

  kitchenAdvance: publicProcedure.input(advanceOrderInput).mutation(async ({ ctx, input }) => {
    const shopId = await getShopId(ctx.db)
    const [order] = await ctx.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, input.orderId), eq(orders.shopId, shopId)))
    if (!order) throw new TRPCError({ code: 'NOT_FOUND' })

    const next = ORDER_STATUS_FLOW[order.status]
    if (!next) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Order is already final' })

    const [updated] = await ctx.db
      .update(orders)
      .set({ status: next, paymentStatus: order.paymentMethod === 'in_store' && next === 'collected' ? 'paid' : order.paymentStatus })
      .where(eq(orders.id, order.id))
      .returning()

    await ctx.db.insert(orderStatusEvents).values({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: next,
      byUserId: null,
    })

    emitOrderUpdate({ type: 'order.updated', orderId: order.id, status: updated.status })
    return updated
  }),
})
