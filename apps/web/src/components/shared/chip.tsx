import { cn } from '@/lib/utils'

type ChipProps = {
  children: React.ReactNode
  className?: string
}

export function Chip({ children, className }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-accent/40 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-primary',
        className,
      )}
    >
      {children}
    </span>
  )
}
