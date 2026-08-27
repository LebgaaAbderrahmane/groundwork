import { useState } from 'react'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc'
import { BRAND } from '@cribstone/shared'
import { Button, Card, EmptyState, Input } from '@/components/ui'
import { useDocumentTitle } from '@/lib/hooks'

export default function TablesPage() {
  useDocumentTitle('Tables')
  const utils = trpc.useUtils()
  const list = trpc.tables.list.useQuery()
  const invalidate = () => utils.tables.list.invalidate()

  const create = trpc.tables.create.useMutation({
    onSuccess: () => {
      invalidate()
      toast.success('Table added')
    },
    onError: (err) => toast.error(err.message),
  })
  const regenerate = trpc.tables.regenerateQR.useMutation({
    onSuccess: () => {
      invalidate()
      toast.success('QR code regenerated')
    },
    onError: (err) => toast.error(err.message),
  })
  const remove = trpc.tables.remove.useMutation({
    onSuccess: () => {
      invalidate()
      toast.success('Table removed')
    },
    onError: (err) => toast.error(err.message),
  })

  const [label, setLabel] = useState('')
  const [openQr, setOpenQr] = useState<number | null>(null)

  const tables = list.data ?? []

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    create.mutate({ label: label.trim() })
    setLabel('')
  }

  const qrUrl = (token: string) =>
    `https://${BRAND.domain}/order/table/${token}`

  return (
    <div className="mx-auto max-w-5xl">
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
          <div className="mt-4 flex items-center gap-2">
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
          {tables.length === 0 ? (
            <EmptyState
              title="No tables yet"
              description="Add a table above to generate a QR code for dine-in ordering."
            />
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {tables.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-border/70 bg-surface/50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{t.label}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {t.qrToken.slice(0, 12)}…
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        className="size-9 p-0 !px-0"
                        title="Regenerate QR"
                        onClick={() => regenerate.mutate({ id: t.id })}
                      >
                        <RefreshCw className="size-4" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        className="size-9 p-0 !px-0 text-muted-foreground hover:text-danger"
                        title="Remove table"
                        onClick={() => remove.mutate({ id: t.id })}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <div
                      className="cursor-pointer rounded-lg border border-border bg-white p-2 transition-shadow hover:shadow-md"
                      onClick={() => setOpenQr(openQr === t.id ? null : t.id)}
                      title="Click to enlarge"
                    >
                      <QRCodeSVG
                        value={qrUrl(t.qrToken)}
                        size={openQr === t.id ? 160 : 64}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        {openQr === t.id ? (
                          <>Scan to order at <strong>{t.label}</strong></>
                        ) : (
                          <>Click QR to preview</>
                        )}
                      </p>
                      {openQr === t.id && (
                        <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground/60">
                          {qrUrl(t.qrToken)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
