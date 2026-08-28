import { useEffect } from 'react'
import { useSession } from '@/lib/auth'
import { useAuth } from '@/store/auth'

export function AuthProvider() {
  const session = useSession()
  const setUser = useAuth((s) => s.setUser)

  useEffect(() => {
    if (session.data?.user) {
      setUser({
        id: session.data.user.id,
        name: session.data.user.name,
        email: session.data.user.email,
        image: session.data.user.image,
      })
    } else if (!session.isPending) {
      setUser(null)
    }
  }, [session.data, session.isPending, setUser])

  return null
}
