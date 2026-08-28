import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Coffee, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { signIn } from '@/lib/auth'
import { useDocumentTitle } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Head } from '@/components/Head'

export default function LoginPage() {
  useDocumentTitle('Sign in')
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await signIn.email({ email, password })
    if (res.error) {
      setError(res.error.message ?? 'Could not sign in.')
      setLoading(false)
      return
    }
    toast.success('Welcome back!')
    navigate('/my-orders', { replace: true })
  }

  async function google() {
    setError(null)
    await signIn.social({ provider: 'google', callbackURL: '/my-orders' })
  }

  const inputCls =
    'mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent'

  return (
    <main className="flex min-h-screen flex-col bg-surface px-6 pt-28">
      <Head title="Sign in" description="Sign in to Cribstone Coffee to order ahead and track your orders." path="/login" />
      <div className="container-site mx-auto w-full max-w-md">
        <Link to="/" className="flex items-center gap-2.5">
          <Coffee className="size-5 text-accent" strokeWidth={1.8} />
          <span className="font-display text-xl italic text-foreground">Cribstone</span>
        </Link>
        <h1 className="mt-8 font-display text-4xl font-bold text-foreground">Sign in</h1>
        <p className="mt-2 text-sm font-light text-muted-foreground">
          Order ahead, earn rewards, and track your coffee.
        </p>

        <form onSubmit={submit} className="mt-8 rounded-lg border border-border/70 bg-background p-6">
          <div>
            <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/70">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputCls}
            />
          </div>
          <div className="mt-4">
            <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/70">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>

          {error && <p className="mt-4 text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={loading} className="mt-6 w-full">
            {loading ? <Loader2 className="size-4 animate-spin" /> : 'Sign in'}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <Button type="button" variant="outline" onClick={google} className="w-full">
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-sm font-light text-muted-foreground">
          New here?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  )
}
