import { useState } from 'react'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Badge, Button, Card, Input } from '@/components/ui'
import { useDocumentTitle } from '@/lib/hooks'

export function TablesPage() {
  useDocumentTitle('Tables')
  const utils = trpc.useUtils()
  const list = trpc.tables.list.useQuery()
  const invalidate = () => utils.tables.list.invalidate()

  const create = trpc.tables.create.useMutation({ onSuccess: invalidate })
  const regenerate = trpc.tables.regenerateQR.useMutation({ onSuccess: invalidate })
  const remove = trpc.tables.remove.useMutation({ onSuccess: invalidate })

  const [label, setLabel] = useState('')

  const tables = list.data ?? []

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    create.mutate({ label: label.trim() })
    setLabel('')
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Dine-in
        </span>
        <h1 className="mt-1 font-display text-4xl font-bold text-foreground">Tables</h1>
      </header>

      <form onSubmit={submit} className="mt-8">
        <Card>
          <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Add a table
          </h2>
          <div className="mt-4 flex gap-2">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Table 4"
              className="max-w-sm"
              required
            />
            <Button type="submit" loading={create.isPending}>
              <Plus className="size-4" aria-hidden /> Add table
            </Button>
          </div>
        </Card>
      </form>

      <div className="mt-6">
        <Card>
          <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {tables.length} table{tables.length === 1 ? '' : 's'}
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {tables.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-surface/50 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{t.label}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    token · {t.qrToken.slice(0, 8)}…
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge className="bg-background text-muted-foreground ring-1 ring-border">
                    QR ready
                  </Badge>
                  <Button
                    variant="outline"
                   
                    className="size-9 p-0"
                    title="Regenerate QR"
                    onClick={() => regenerate.mutate({ id: t.id })}
                  >
                    <RefreshCw className="size-4" aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                   
                    className="size-9 p-0 text-muted-foreground hover:text-danger"
                    title="Remove table"
                    onClick={() => remove.mutate({ id: t.id })}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
            {tables.length === 0 && (
              <li className="col-span-full py-6 text-center text-sm font-light text-muted-foreground">
                No tables yet.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  )
}
