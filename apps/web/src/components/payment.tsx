import { CreditCard, Store, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-primary/15 text-primary',
  pending: 'bg-accent/15 text-accent',
}

const STATUS_LABELS: Record<string, string> = {
  paid: 'Paid',
  pending: 'Pending',
}

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em]',
        STATUS_STYLES[status] ?? 'bg-surface text-muted-foreground',
        className,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

type PaymentOption = {
  value: string
  label: string
  note: string
  icon: typeof CreditCard
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { value: 'in_store', label: 'Pay at the counter', note: 'Card or cash on pickup', icon: Store },
  { value: 'card', label: 'Pay by card now', note: 'Debit or credit card', icon: CreditCard },
  { value: 'apple_pay', label: 'Apple Pay', note: 'Quick tap to pay', icon: Smartphone },
  { value: 'google_pay', label: 'Google Pay', note: 'Quick tap to pay', icon: Smartphone },
]

export function PaymentMethodSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (method: string) => void
}) {
  function handleChange(optValue: string) {
    // Apple Pay and Google Pay map to 'card' on the backend
    const mapped = optValue === 'apple_pay' || optValue === 'google_pay' ? 'card' : optValue
    onChange(mapped)
  }

  return (
    <div className="space-y-2">
      {PAYMENT_OPTIONS.map((opt) => {
        const active = value === opt.value || (value === 'card' && opt.value === 'card')
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleChange(opt.value)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
              active
                ? 'border-primary bg-surface'
                : 'border-border hover:border-primary/40',
            )}
          >
            <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.6} />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{opt.label}</p>
              <p className="text-xs font-light text-muted-foreground">{opt.note}</p>
            </div>
            <span
              className={cn(
                'size-4 shrink-0 rounded-full border-2',
                active ? 'border-primary bg-primary' : 'border-border',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
