import { create } from 'zustand'

export type SessionUser = {
  id: number
  name: string
  email: string
  role: 'owner' | 'manager' | 'barista'
}

type SessionState = {
  user: SessionUser | null
  setUser: (user: SessionUser | null) => void
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
