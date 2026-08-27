import { Monitor, Moon, Sun } from 'lucide-react'
import { useThemeStore, type ThemeOption } from '@/store/theme'

const OPTIONS: ThemeOption[] = ['light', 'dark', 'system']

const ICONS: Record<ThemeOption, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

const LABELS: Record<ThemeOption, string> = {
  light: 'Light theme',
  dark: 'Dark theme',
  system: 'System theme',
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
      aria-label={`${LABELS[theme]}. Click to cycle.`}
      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
    >
      <Icon className="size-4" strokeWidth={1.7} />
    </button>
  )
}
