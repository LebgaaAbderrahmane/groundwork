export const ORDER_STATUS = ['received', 'making', 'ready', 'collected', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUS)[number]

export const ORDER_TYPE = ['pickup', 'dine_in'] as const
export type OrderType = (typeof ORDER_TYPE)[number]

export const PAYMENT_METHOD = ['in_store', 'card'] as const
export type PaymentMethod = (typeof PAYMENT_METHOD)[number]

export const PAYMENT_STATUS = ['pending', 'paid'] as const
export type PaymentStatus = (typeof PAYMENT_STATUS)[number]

export const USER_ROLE = ['owner', 'manager', 'barista'] as const
export type UserRole = (typeof USER_ROLE)[number]

export const INVENTORY_REASON = ['sale', 'receipt', 'waste', 'adjustment'] as const
export type InventoryReason = (typeof INVENTORY_REASON)[number]

export const ORDER_STATUS_FLOW: Record<string, OrderStatus | null> = {
  received: 'making',
  making: 'ready',
  ready: 'collected',
  collected: null,
}
