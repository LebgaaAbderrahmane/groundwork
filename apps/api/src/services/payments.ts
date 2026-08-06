import type { PaymentMethod } from '@groundwork/shared'

export interface PaymentProvider {
  charge(opts: {
    amountPence: number
    method: PaymentMethod
  }): Promise<{ paymentStatus: 'paid' | 'pending' }>
}

/**
 * v1 mock provider: card charges "succeed" instantly; in-store stays pending.
 * Swap for a Stripe adapter behind this same interface later.
 */
export const payments: PaymentProvider = {
  async charge({ method }) {
    return { paymentStatus: method === 'card' ? 'paid' : 'pending' }
  },
}
