import { useState } from 'react'
import { Plus } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useSession } from '@/store/session'
import { Badge, Button, Card, Field, Input, Select } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useDocumentTitle } from '@/lib/hooks'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  barista: 'Barista',
}

export function StaffPage() {
  useDocumentTitle('Staff')
  const utils = trpc.useUtils()
  const me = useSession((s) => s.user)
  const list = trpc.staff.list.useQuery()
  const invalidate = () => utils.staff.list.invalidate()

  const invite = trpc.staff.invite.useMutation({ onSuccess: invalidate })
  const updateRole = trpc.staff.updateRole.useMutation({ onSuccess: invalidate })
  const setActive = trpc.staff.setActive.useMutation({ onSuccess: invalidate })

  const [form, setForm] = useState({ name: '', email: '', role: 'barista', password: '' })
  const [error, setError] = useState<string | null>(null)

  const staff = list.data ?? []

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    invite.mutate(
      { name: form.name.trim(), email: form.email.trim(), role: form.role as 'owner' | 'manager' | 'barista', password: form.password },
      {
        onSuccess: () => setForm({ name: '', email: '', role: 'barista', password: '' }),
        onError: (err) => setError(err.message ?? 'Could not invite'),
      },
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Team
        </span>
        <h1 className="mt-1 font-display text-4xl font-bold text-foreground">Staff</h1>
      </header>

      <form onSubmit={submit} className="mt-8">
        <Card>
          <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Invite team member
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Field label="Name" htmlFor="s-name">
              <Input id="s-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sam Taylor" required />
            </Field>
            <Field label="Email" htmlFor="s-email">
              <Input id="s-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="sam@cribstonecoffee.com" required />
            </Field>
            <Field label="Role" htmlFor="s-role">
              <Select id="s-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="barista">Barista</option>
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
              </Select>
            </Field>
            <Field label="Temporary password" htmlFor="s-pass">
              <Input id="s-pass" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="min 8 chars" required />
            </Field>
          </div>
          {error && (
            <p className="mt-3 rounded-lg bg-accent/15 px-3 py-2 text-xs text-accent">{error}</p>
          )}
          <Button type="submit" loading={invite.isPending} className="mt-4">
            <Plus className="size-4" aria-hidden /> Invite
          </Button>
        </Card>
      </form>

      <div className="mt-6">
        <Card>
          <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {staff.length} team member{staff.length === 1 ? '' : 's'}
          </h2>
          <ul className="mt-4 space-y-2">
            {staff.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-surface/50 px-4 py-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium text-foreground">
                    {u.name}
                    {u.id === me?.id && <Badge className="bg-accent/15 text-accent">You</Badge>}
                  </p>
                  <p className={cn('text-sm text-muted-foreground', u.active === 0 && 'line-through opacity-60')}>
                    {u.email}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={u.role}
                    onChange={(e) =>
                      updateRole.mutate(
                        { userId: u.id, role: e.target.value as 'owner' | 'manager' | 'barista' },
                        { onError: (err) => alert(err.message) },
                      )
                    }
                    className="w-36"
                  >
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="barista">Barista</option>
                  </Select>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={u.active === 1}
                      onChange={(e) =>
                        setActive.mutate(
                          { userId: u.id, active: e.target.checked },
                          { onError: (err) => alert(err.message) },
                        )
                      }
                      className="size-4 accent-[hsl(var(--primary))]"
                    />
                    <span className="text-[10px] font-medium uppercase tracking-[0.1em]">
                      {u.active === 1 ? 'Active' : 'Disabled'}
                    </span>
                  </label>
                  <Badge className="bg-background text-muted-foreground ring-1 ring-border">
                    {ROLE_LABELS[u.role] ?? u.role}
                  </Badge>
                </div>
              </li>
            ))}
            {staff.length === 0 && (
              <li className="py-6 text-center text-sm font-light text-muted-foreground">
                No team members yet.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  )
}
