import { createAuthClient } from 'better-auth/react'
import { toast } from 'sonner'

export const authClient = createAuthClient({
  baseURL: window.location.origin,
  basePath: '/api/auth',
  fetchOptions: {
    onError(e) {
      if (e.error.status === 429) {
        toast.error('Too many attempts. Please wait a moment.')
      }
    },
  },
})

export const { signIn, signUp, signOut, useSession } = authClient
