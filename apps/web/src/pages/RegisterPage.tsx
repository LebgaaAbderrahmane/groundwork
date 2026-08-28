import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Coffee, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { signUp } from '@/lib/auth'
import { useDocumentTitle } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Head } from '@/components/Head'

export default function RegisterPage() {
  useDocumentTitle('Create account')
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await signUp.email({ name, email, password })
    if (res.error) {
      setError(res.error.message ?? 'Could not create account.')
      setLoading(false)
      return
    }
    toast.success('Account created — welcome!')
    navigate('/my-orders', { replace: true })
  }

  const inputCls =
    'mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent'

  return (
    <main className="flex min-h-screen flex-col bg-surface px-6 pt-28">
      <Head title="Create account" description="Create a Cribstone Coffee account to order ahead and track your orders." path="/register" />
      <div className="container-site mx-auto w-full max-w-md">
        <Link to="/" className="flex items-center gap-2.5">
          <Coffee className="size-5 text-accent" strokeWidth={1.8} />
          <span className="font-display text-xl italic text-foreground">Cribstone</span>
        </Link>
        <h1 className="mt-8 font-display text-4xl font-bold text-foreground">Create account</h1>
        <p className="mt-2 text-sm font-light text-muted-foreground">
          Save your details and come back to your orders anytime.
        </p>

        <form onSubmit={submit} className="mt-8 rounded-lg border border-border/70 bg-background p-6">
          <div>
            <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/70">
              Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={inputCls}
            />
          </div>
          <div className="mt-4">
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={inputCls}
            />
          </div>

          {error && <p className="mt-4 text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={loading} className="mt-6 w-full">
            {loading ? <Loader2 className="size-4 animate-spin" /> : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm font-light text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
