import { EventEmitter } from 'node:events'

export type OrderUpdateEvent = {
  type: 'order.created' | 'order.updated' | 'order.cancelled'
  orderId: number
  status: string
}

const emitter = new EventEmitter()

export const orderEvents = emitter as EventEmitter

export function emitOrderUpdate(event: OrderUpdateEvent) {
  emitter.emit('order:update', event)
}
