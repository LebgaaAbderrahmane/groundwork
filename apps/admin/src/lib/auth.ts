import { createAuthClient } from 'better-auth/react'
import { toast } from 'sonner'

const API_URL_KEY = 'cc-api-url'

function staffOrigin(): string {
  let v: string | null = null
  try {
    v = localStorage.getItem(API_URL_KEY)
  } catch {}
  if (v && /^https?:\/\//.test(v)) {
    return v.replace(/\/trpc$/, '').replace(/\/api$/, '')
  }
  return window.location.origin
}

export const authClient = createAuthClient({
  baseURL: staffOrigin(),
  basePath: '/api/staff-auth',
  fetchOptions: {
    credentials: 'include',
    onError(e) {
      if (e.error.status === 429) {
        toast.error('Too many attempts. Please wait a moment.')
      }
    },
  },
})

export const { useSession, signIn, signOut } = authClient
