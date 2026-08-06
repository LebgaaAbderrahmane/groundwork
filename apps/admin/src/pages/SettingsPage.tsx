import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Button, Card, Field, Input, Select, Textarea } from '@/components/ui'

export function SettingsPage() {
  const utils = trpc.useUtils()
  const settings = trpc.settings.get.useQuery()

  const [form, setForm] = useState({
    shopName: '',
    address: '',
    phone: '',
    hours: '',
    paymentMode: 'in_store' as 'in_store' | 'card',
  })

  useEffect(() => {
    if (settings.data) {
      setForm({
        shopName: settings.data.name,
        address: settings.data.address ?? '',
        phone: settings.data.phone ?? '',
        hours: settings.data.hours ?? '',
        paymentMode: settings.data.paymentMode as 'in_store' | 'card',
      })
    }
  }, [settings.data])

  const update = trpc.settings.update.useMutation({
    onSuccess: () => utils.settings.get.invalidate(),
  })

  return (
    <div className="mx-auto max-w-2xl">
      <header>
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Shop configuration
        </span>
        <h1 className="mt-1 font-display text-4xl font-bold text-foreground">Settings</h1>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          update.mutate(form)
        }}
        className="mt-8"
      >
        <Card>
          <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Shop details
          </h2>
          <div className="mt-4 space-y-3">
            <Field label="Shop name" htmlFor="st-name">
              <Input id="st-name" value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} required />
            </Field>
            <Field label="Address" htmlFor="st-address">
              <Input id="st-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Phone" htmlFor="st-phone">
                <Input id="st-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+44 20 1234 5678" />
              </Field>
              <Field label="Payment mode" htmlFor="st-pay">
                <Select id="st-pay" value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value as 'in_store' | 'card' })}>
                  <option value="in_store">Pay in store</option>
                  <option value="card">Card online</option>
                </Select>
              </Field>
            </div>
            <Field label="Opening hours" htmlFor="st-hours">
              <Textarea id="st-hours" rows={2} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="Monday–Friday 7am–5pm…" />
            </Field>
          </div>
          <Button type="submit" loading={update.isPending} className="mt-4">
            <Save className="size-4" aria-hidden /> Save settings
          </Button>
        </Card>
      </form>
    </div>
  )
}
