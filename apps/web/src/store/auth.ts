import { create } from 'zustand'

export type AuthUser = {
  id: string
  name: string
  email: string
  image?: string | null
}

type AuthState = {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
