import {
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['owner', 'manager', 'barista'])
export const orderStatusEnum = pgEnum('order_status', [
  'received',
  'making',
  'ready',
  'collected',
  'cancelled',
])
export const orderTypeEnum = pgEnum('order_type', ['pickup', 'dine_in'])
export const paymentMethodEnum = pgEnum('payment_method', ['in_store', 'card'])
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid'])
export const inventoryReasonEnum = pgEnum('inventory_reason', [
  'sale',
  'receipt',
  'waste',
  'adjustment',
])

const now = () => new Date()

export const shops = pgTable('shops', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  address: text('address'),
  phone: text('phone'),
  hours: text('hours'),
  paymentMode: text('payment_mode').notNull().default('in_store'),
  settings: jsonb('settings').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at').notNull().default(now()),
})

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    shopId: integer('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRoleEnum('role').notNull().default('barista'),
    active: integer('active').notNull().default(1),
    createdAt: timestamp('created_at').notNull().default(now()),
  },
  (t) => [uniqueIndex('users_email_unique').on(t.email)],
)

export const refreshTokens = pgTable('refresh_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().default(now()),
})

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .notNull()
    .references(() => shops.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sort: integer('sort').notNull().default(0),
  active: integer('active').notNull().default(1),
})

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .notNull()
    .references(() => shops.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  pricePence: integer('price_pence').notNull(),
  imageUrl: text('image_url'),
  dietaryTags: text('dietary_tags').array().notNull().default([]),
  sort: integer('sort').notNull().default(0),
  active: integer('active').notNull().default(1),
})

export const optionGroups = pgTable('option_groups', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .notNull()
    .references(() => shops.id, { onDelete: 'cascade' }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  required: integer('required').notNull().default(0),
  min: integer('min').notNull().default(0),
  max: integer('max').notNull().default(1),
  sort: integer('sort').notNull().default(0),
})

export const options = pgTable('options', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .notNull()
    .references(() => shops.id, { onDelete: 'cascade' }),
  groupId: integer('group_id')
    .notNull()
    .references(() => optionGroups.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  priceDeltaPence: integer('price_delta_pence').notNull().default(0),
  sort: integer('sort').notNull().default(0),
})

export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .notNull()
    .references(() => shops.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  unit: text('unit').notNull(),
  stockQty: numeric('stock_qty').notNull().default('0'),
  lowStockThreshold: numeric('low_stock_threshold').notNull().default('0'),
  costPerUnit: numeric('cost_per_unit').notNull().default('0'),
})

export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .notNull()
    .references(() => shops.id, { onDelete: 'cascade' }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  ingredientId: integer('ingredient_id')
    .notNull()
    .references(() => ingredients.id, { onDelete: 'cascade' }),
  qtyPerServe: numeric('qty_per_serve').notNull(),
})

export const inventoryMovements = pgTable('inventory_movements', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .notNull()
    .references(() => shops.id, { onDelete: 'cascade' }),
  ingredientId: integer('ingredient_id')
    .notNull()
    .references(() => ingredients.id, { onDelete: 'cascade' }),
  change: numeric('change').notNull(),
  reason: inventoryReasonEnum('reason').notNull(),
  refId: integer('ref_id'),
  note: text('note'),
  createdAt: timestamp('created_at').notNull().default(now()),
})

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .notNull()
    .references(() => shops.id, { onDelete: 'cascade' }),
  type: orderTypeEnum('type').notNull().default('pickup'),
  status: orderStatusEnum('status').notNull().default('received'),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  notes: text('notes'),
  subtotalPence: integer('subtotal_pence').notNull().default(0),
  totalPence: integer('total_pence').notNull().default(0),
  paymentMethod: paymentMethodEnum('payment_method').notNull().default('in_store'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
  pickupAt: timestamp('pickup_at'),
  tableId: integer('table_id').references(() => tables.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().default(now()),
})

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id),
  nameSnapshot: text('name_snapshot').notNull(),
  unitPricePence: integer('unit_price_pence').notNull(),
  quantity: integer('quantity').notNull(),
  optionsSnapshot: jsonb('options_snapshot')
    .$type<Array<{ id: number; label: string; priceDeltaPence: number }>>()
    .notNull()
    .default([]),
  lineTotalPence: integer('line_total_pence').notNull(),
})

export const orderStatusEvents = pgTable('order_status_events', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  fromStatus: orderStatusEnum('from_status'),
  toStatus: orderStatusEnum('to_status').notNull(),
  byUserId: integer('by_user_id').references(() => users.id),
  at: timestamp('at').notNull().default(now()),
})

export const customers = pgTable(
  'customers',
  {
    id: serial('id').primaryKey(),
    shopId: integer('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    loyaltyPoints: integer('loyalty_points').notNull().default(0),
    visits: integer('visits').notNull().default(0),
    lastVisitAt: timestamp('last_visit_at'),
    createdAt: timestamp('created_at').notNull().default(now()),
  },
  (t) => [uniqueIndex('customers_phone_unique').on(t.shopId, t.phone)],
)

export const loyaltyTransactions = pgTable('loyalty_transactions', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  points: integer('points').notNull(),
  reason: text('reason'),
  refOrderId: integer('ref_order_id').references(() => orders.id),
  createdAt: timestamp('created_at').notNull().default(now()),
})

export const tables = pgTable('tables', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .notNull()
    .references(() => shops.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  qrToken: text('qr_token').notNull(),
})

export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .notNull()
    .references(() => shops.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: integer('entity_id'),
  details: jsonb('details').$type<Record<string, unknown>>().notNull().default({}),
  at: timestamp('at').notNull().default(now()),
})
