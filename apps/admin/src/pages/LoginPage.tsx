import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Coffee } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useSession } from '@/store/session'
import { Button, Field, Input } from '@/components/ui'

export function LoginPage() {
  const navigate = useNavigate()
  const setUser = useSession((s) => s.setUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const login = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setUser(data.user)
      navigate('/', { replace: true })
    },
    onError: (err) => setError(err.message ?? 'Could not sign in'),
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    login.mutate({ email, password })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5">
          <Coffee className="size-6 text-accent" strokeWidth={1.8} />
          <span className="font-display text-2xl italic text-foreground">
            Groundwork
          </span>
        </div>
        <h1 className="mt-8 text-center font-display text-3xl font-bold text-foreground">
          Staff sign in
        </h1>
        <p className="mt-2 text-center text-sm font-light text-muted-foreground">
          The coffee won't pour itself.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@groundworkcoffee.co.uk"
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          {error && (
            <p className="rounded-lg bg-accent/15 px-3 py-2 text-xs text-accent">
              {error}
            </p>
          )}

          <Button type="submit" loading={login.isPending} className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </main>
  )
}
