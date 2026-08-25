import { create } from 'zustand'

export type ThemeOption = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'cc-theme'

function systemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function storedTheme(): ThemeOption {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {}
  return 'system'
}

function resolve(theme: ThemeOption): ResolvedTheme {
  return theme === 'system' ? systemTheme() : theme
}

function applyTheme(theme: ThemeOption) {
  document.documentElement.classList.toggle('dark', resolve(theme) === 'dark')
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {}
}

type ThemeState = {
  theme: ThemeOption
  resolved: ResolvedTheme
  setTheme: (theme: ThemeOption) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system',
  resolved: 'light',
  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme, resolved: resolve(theme) })
  },
}))

export function initTheme() {
  const theme = storedTheme()
  applyTheme(theme)
  useThemeStore.setState({ theme, resolved: resolve(theme) })

  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    if (useThemeStore.getState().theme === 'system') {
      useThemeStore.setState({ resolved: mql.matches ? 'dark' : 'light' })
    }
  }
  mql.addEventListener('change', onChange)
}
