import { Monitor, Moon, Sun } from 'lucide-react'
import { useThemeStore, type ThemeOption } from '@/store/theme'
import { cn } from '@/lib/utils'

const OPTIONS: ThemeOption[] = ['light', 'dark', 'system']

const ICONS: Record<ThemeOption, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  const next = (): ThemeOption => {
    const i = OPTIONS.indexOf(theme)
    return OPTIONS[(i + 1) % OPTIONS.length]
  }

  const Icon = ICONS[theme]

  return (
    <button
      type="button"
      onClick={() => setTheme(next())}
      aria-label={`Theme: ${theme}. Click to cycle.`}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors',
        'text-muted-foreground hover:bg-surface hover:text-foreground',
      )}
    >
      <Icon className="size-4" strokeWidth={1.7} />
      <span className="capitalize">{theme}</span>
    </button>
  )
}
