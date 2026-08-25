import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc'
import { Button, Card, Field, Input, Select } from '@/components/ui'
import { useDocumentTitle } from '@/lib/hooks'
import { setUnsavedDirty } from '@/lib/unsaved'
import {
  DAYS,
  DAY_ABBREVS,
  HOURS,
  MINUTES,
  to12h,
  toMinutes,
  parseMinutes,
  formatSchedule,
  defaultSchedule,
} from '@/lib/time'

type HoursForm = Record<(typeof DAYS)[number], { open: number; close: number } | null>

function parseHoursString(raw: string): HoursForm {
  if (!raw.trim()) return defaultSchedule()
  const result: Partial<HoursForm> = {}
  const parts = raw.split(/[·•]/).map((s) => s.trim()).filter(Boolean)
  for (const part of parts) {
    const m = part.match(/^(\w+)\s+(\d{1,2}(?::\d{2})?(?:am|pm))\s*[–-]\s*(\d{1,2}(?::\d{2})?(?:am|pm))$/i)
    if (!m) continue
    const dayName = DAYS.find((d) => d.startsWith(m[1]) || DAY_ABBREVS[d] === m[1])
    if (!dayName) continue
    const open = parseTimeString(m[2])
    const close = parseTimeString(m[3])
    if (open !== null && close !== null) {
      result[dayName] = { open, close }
    }
  }
  const fallback = defaultSchedule()
  return { ...fallback, ...result }
}

function parseTimeString(t: string): number | null {
  const m = t.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/i)
  if (!m) return null
  let hour = parseInt(m[1], 10)
  const minute = parseInt(m[2] ?? '0', 10)
  const suffix = m[3].toLowerCase()
  if (suffix === 'pm' && hour !== 12) hour += 12
  if (suffix === 'am' && hour === 12) hour = 0
  return toMinutes(hour, minute)
}

function serializeHours(form: HoursForm): string {
  return DAYS.map((d) => {
    const s = form[d]
    if (!s) return `${DAY_ABBREVS[d]} Closed`
    return `${DAY_ABBREVS[d]} ${formatSchedule(s)}`
  }).join(' · ')
}

function TimeSelect({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const { hour, minute } = parseMinutes(value)
  return (
    <div className="flex items-center gap-1">
      <Select
        value={String(hour)}
        onChange={(e) => onChange(toMinutes(Number(e.target.value), minute))}
        className="w-20"
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {to12h(toMinutes(h, 0))}
          </option>
        ))}
      </Select>
      <span className="text-xs text-muted-foreground">:</span>
      <Select
        value={String(minute)}
        onChange={(e) => onChange(toMinutes(hour, Number(e.target.value)))}
        className="w-16"
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {String(m).padStart(2, '0')}
          </option>
        ))}
      </Select>
    </div>
  )
}

function BusinessHoursInput({
  value,
  onChange,
}: {
  value: HoursForm
  onChange: (v: HoursForm) => void
}) {
  function toggleDay(day: (typeof DAYS)[number]) {
    if (value[day]) {
      onChange({ ...value, [day]: null })
    } else {
      onChange({ ...value, [day]: { open: toMinutes(7, 0), close: toMinutes(17, 0) } })
    }
  }

  function update(day: (typeof DAYS)[number], field: 'open' | 'close', minutes: number) {
    const current = value[day] ?? { open: toMinutes(7, 0), close: toMinutes(17, 0) }
    onChange({ ...value, [day]: { ...current, [field]: minutes } })
  }

  return (
    <div className="space-y-2">
      {DAYS.map((day) => {
        const schedule = value[day]
        return (
          <div key={day} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleDay(day)}
              className={`w-20 shrink-0 rounded-lg border px-2 py-1.5 text-left text-xs font-medium transition-colors ${
                schedule
                  ? 'border-primary/40 bg-surface text-foreground'
                  : 'border-border text-muted-foreground'
              }`}
            >
              {DAY_ABBREVS[day]}
            </button>
            {schedule ? (
              <div className="flex items-center gap-2">
                <TimeSelect
                  value={schedule.open}
                  onChange={(v) => update(day, 'open', v)}
                />
                <span className="text-xs text-muted-foreground">–</span>
                <TimeSelect
                  value={schedule.close}
                  onChange={(v) => update(day, 'close', v)}
                />
              </div>
            ) : (
              <span className="text-xs text-muted-foreground/60">Closed</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function SettingsPage() {
  useDocumentTitle('Settings')
  const utils = trpc.useUtils()
  const settings = trpc.settings.get.useQuery()

  const [form, setForm] = useState({
    shopName: '',
    address: '',
    phone: '',
    hours: '',
    paymentMode: 'in_store' as 'in_store' | 'card',
  })
  const [hoursForm, setHoursForm] = useState<HoursForm>(defaultSchedule())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (settings.data && !loaded) {
      setForm({
        shopName: settings.data.name,
        address: settings.data.address ?? '',
        phone: settings.data.phone ?? '',
        hours: settings.data.hours ?? '',
        paymentMode: settings.data.paymentMode as 'in_store' | 'card',
      })
      setHoursForm(parseHoursString(settings.data.hours ?? ''))
      setLoaded(true)
    }
  }, [settings.data, loaded])

  useEffect(() => {
    setUnsavedDirty(loaded && settings.data ? serializeHours(hoursForm) !== (settings.data.hours ?? '') || form.shopName !== settings.data.name : false)
  }, [form, hoursForm, loaded, settings.data])

  const update = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate()
      setUnsavedDirty(false)
      toast.success('Settings saved')
    },
    onError: (err) => toast.error(err.message ?? 'Failed to save settings'),
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate({ ...form, hours: serializeHours(hoursForm) })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header>
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Shop configuration
        </span>
        <h1 className="mt-1 font-display text-4xl font-bold text-foreground">Settings</h1>
      </header>

      <form onSubmit={submit} className="mt-8 space-y-6">
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
                <Input id="st-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 207 555 1234" />
              </Field>
              <Field label="Payment mode" htmlFor="st-pay">
                <Select id="st-pay" value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value as 'in_store' | 'card' })}>
                  <option value="in_store">Pay in store</option>
                  <option value="card">Card online</option>
                </Select>
              </Field>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Opening hours
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Click a day to toggle it open/closed, then set the hours.
          </p>
          <div className="mt-4">
            <BusinessHoursInput value={hoursForm} onChange={setHoursForm} />
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={update.isPending}>
            <Save className="size-4" aria-hidden /> Save settings
          </Button>
        </div>
      </form>
    </div>
  )
}
