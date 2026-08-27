import { useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc'
import { clockTime } from '@/lib/format'
import { Badge, Button, Card, Field, Input } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useDocumentTitle } from '@/lib/hooks'

export default function CustomersPage() {
  useDocumentTitle('Customers')
  const utils = trpc.useUtils()
  const list = trpc.customers.list.useQuery()
  const award = trpc.customers.awardPoints.useMutation({
    onSuccess: () => {
      utils.customers.list.invalidate()
      utils.customers.search.invalidate()
      utils.customers.transactions.invalidate()
      toast.success('Points awarded')
    },
    onError: (err) => toast.error(err.message),
  })

  const [phone, setPhone] = useState('')
  const [searchPhone, setSearchPhone] = useState<string | null>(null)
  const [points, setPoints] = useState('1')
  const [reason, setReason] = useState('')

  const search = trpc.customers.search.useQuery(
    { phone: searchPhone ?? '' },
    { enabled: Boolean(searchPhone) },
  )
  const transactions = trpc.customers.transactions.useQuery(
    { phone: searchPhone ?? '' },
    { enabled: Boolean(searchPhone) },
  )

  const customers = list.data ?? []
  const found = search.data

  function doSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearchPhone(phone.trim() || null)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Loyalty
        </span>
        <h1 className="mt-1 font-display text-4xl font-bold text-foreground">Customers</h1>
      </header>

      <form onSubmit={doSearch} className="mt-8">
        <Card>
          <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Look up a customer
          </h2>
          <div className="mt-4 flex gap-2">
            <div className="relative max-w-sm">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Search by phone…"
                className="h-9 pr-9"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button type="submit">
              Search
            </Button>
          </div>

          {searchPhone && search.isLoading && (
            <p className="mt-4 text-sm font-light text-muted-foreground">Searching…</p>
          )}
          {searchPhone && !search.isLoading && !found && (
            <p className="mt-4 text-sm font-light text-muted-foreground">
              No customer with that number — orders will create one automatically.
            </p>
          )}
          {found && (
            <div className="mt-4 rounded-lg border border-border/70 bg-surface/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{found.name}</p>
                  <p className="text-sm text-muted-foreground">{found.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-accent/15 text-accent">{found.loyaltyPoints} pts</Badge>
                  <Badge className="bg-background text-muted-foreground ring-1 ring-border">
                    {found.visits} visits
                  </Badge>
                </div>
              </div>

              <form
                className="mt-4 flex flex-wrap items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  award.mutate({
                    customerId: found.id,
                    points: Number(points) || 0,
                    reason: reason.trim() || undefined,
                  })
                  setPoints('1')
                  setReason('')
                }}
              >
                <Field label="Points" htmlFor="pts">
                  <Input
                    id="pts"
                    type="number"
                    step="1"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    className="w-24"
                  />
                </Field>
                <Field label="Reason" htmlFor="pts-reason">
                  <Input
                    id="pts-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Voucher"
                    className="w-48"
                  />
                </Field>
                <Button type="submit" loading={award.isPending}>
                  Award points
                </Button>
              </form>

              <h3 className="mt-5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Point history
              </h3>
              <ul className="mt-2 space-y-1.5">
                {(transactions.data ?? []).map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t.reason ?? 'Order'}
                      <span className="ml-2 text-xs text-muted-foreground/70">
                        {clockTime(t.createdAt)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'font-semibold tabular-nums',
                        t.points > 0 ? 'text-primary' : 'text-danger',
                      )}
                    >
                      {t.points > 0 ? '+' : ''}
                      {t.points}
                    </span>
                  </li>
                ))}
                {(transactions.data ?? []).length === 0 && (
                  <li className="text-sm font-light text-muted-foreground">No point activity.</li>
                )}
              </ul>
            </div>
          )}
        </Card>
      </form>

      <div className="mt-6">
        <Card>
          <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Recent customers
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="pb-2 pr-3">Name</th>
                  <th className="pb-2 pr-3">Phone</th>
                  <th className="pb-2 pr-3">Points</th>
                  <th className="pb-2 pr-3">Visits</th>
                  <th className="pb-2">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-foreground">{c.name}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{c.phone}</td>
                    <td className="py-2.5 pr-3 tabular-nums text-foreground">{c.loyaltyPoints}</td>
                    <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">{c.visits}</td>
                    <td className="py-2.5 text-muted-foreground">
                      {c.lastVisitAt ? clockTime(c.lastVisitAt) : '—'}
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center font-light text-muted-foreground">
                      No loyalty customers yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
