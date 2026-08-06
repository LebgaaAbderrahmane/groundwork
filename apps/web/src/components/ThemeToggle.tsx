import { useEffect, useRef, useState } from 'react'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useThemeStore, type ThemeOption } from '@/store/theme'
import { cn } from '@/lib/utils'

const OPTIONS: Array<{ value: ThemeOption; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function ThemeToggle({ layout = 'icon' }: { layout?: 'icon' | 'full' }) {
  const theme = useThemeStore((s) => s.theme)
  const resolved = useThemeStore((s) => s.resolved)
  const setTheme = useThemeStore((s) => s.setTheme)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  if (layout === 'full') {
    return (
      <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-foreground/80">
          Theme
        </span>
        <div className="flex gap-1">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              aria-label={opt.label}
              aria-pressed={theme === opt.value}
              className={cn(
                'flex size-8 items-center justify-center rounded-full transition-colors',
                theme === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <opt.icon className="size-4" strokeWidth={1.7} />
            </button>
          ))}
        </div>
      </div>
    )
  }

  const ActiveIcon = resolved === 'dark' ? Moon : Sun

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change theme"
        aria-expanded={open}
        className="flex size-10 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-surface hover:text-primary"
      >
        <ActiveIcon className="size-5" strokeWidth={1.7} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-44 rounded-xl border border-border bg-background p-1.5 shadow-lg">
          <div className="flex items-center justify-between px-3 pb-1 pt-1.5">
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Theme
            </span>
            <span className="text-[10px] uppercase tracking-[0.12em] text-accent">
              {resolved === 'dark' ? 'Dark' : 'Light'}
            </span>
          </div>
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setTheme(opt.value)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-surface hover:text-foreground"
            >
              <opt.icon className="size-4" strokeWidth={1.7} />
              <span className="flex-1 text-left">{opt.label}</span>
              {theme === opt.value && <Check className="size-4 text-primary" strokeWidth={2} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
