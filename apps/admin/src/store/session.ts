import { create } from 'zustand'

export type SessionUser = {
  id: string
  name: string
  email: string
  role: 'owner' | 'manager' | 'barista'
  shopId: number
}

/** The raw Better Auth session user (adds our additional fields at runtime). */
export type SessionUserRecord = {
  id: string
  name: string
  email: string
  role?: string
  shopId?: number | string
}

type SessionState = {
  user: SessionUser | null
  token: string | null
  setSession: (user: SessionUser | null, token?: string | null) => void
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  token: null,
  setSession: (user, token) => set({ user, token: user ? token ?? null : null }),
}))
