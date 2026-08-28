import type { UserRole } from '@cribstone/shared'

export type AuthUser = {
  id: string
  shopId: number
  email: string
  role: UserRole
}
