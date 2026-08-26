import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useCart } from '@/store/cart'
import { Button } from '@/components/ui/button'

export default function TableLandingPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const setTable = useCart((s) => s.setTable)

  const table = trpc.tables.byToken.useQuery(
    { token: token ?? '' },
    { enabled: Boolean(token), retry: false },
  )

  useEffect(() => {
    if (table.data) {
      setTable({ id: table.data.id, label: table.data.label, token: token ?? '' })
      navigate('/menu', { replace: true })
    }
  }, [table.data, setTable, navigate, token])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 pt-24 text-center">
      {table.isLoading || table.isSuccess ? (
        <>
          <Loader2 className="size-10 animate-spin text-accent" strokeWidth={1.6} aria-hidden />
          <h1 className="mt-6 font-display text-3xl font-bold text-foreground">
            Opening the menu…
          </h1>
          <p className="mt-2 text-sm font-light text-foreground/60">
            Setting up your table order.
          </p>
        </>
      ) : (
        <>
          <AlertTriangle className="size-12 text-accent" strokeWidth={1.2} aria-hidden />
          <h1 className="mt-6 font-display text-4xl font-bold text-foreground">
            Table not found
          </h1>
          <p className="mt-3 max-w-sm text-sm font-light text-foreground/60">
            This QR code may be outdated or from another café. Ask a team member
            and we'll sort you out.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/menu">
              Browse the menu anyway <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </>
      )}
    </main>
  )
}
