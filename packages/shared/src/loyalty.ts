export const LOYALTY = {
  pointsPerDollar: 1,
  rewards: [
    { id: 'free_drip', name: 'Free drip coffee', points: 10, discountPence: 450 },
    { id: 'free_pastry', name: 'Free pastry', points: 20, discountPence: 550 },
    { id: 'free_drink', name: 'Free any drink', points: 30, discountPence: 700 },
  ],
} as const

export type LoyaltyReward = (typeof LOYALTY.rewards)[number]

export function earnPoints(totalPence: number): number {
  return Math.floor(totalPence / 100 / LOYALTY.pointsPerDollar)
}

export function bestAffordableReward(points: number): LoyaltyReward | null {
  let best: LoyaltyReward | null = null
  for (const r of LOYALTY.rewards) {
    if (points >= r.points && (!best || r.points > best.points)) {
      best = r
    }
  }
  return best
}
