import { create } from 'zustand'

const STORAGE_KEY = 'cc-api-url'

export function defaultApiUrl(): string {
  return '/api/trpc'
}

/** SSE events endpoint derived from the configured tRPC URL (browser proxied or absolute host). */
export function eventsUrl(): string {
  const api = useApiUrlStore.getState().apiUrl
  if (api === defaultApiUrl()) return '/api/events'
  const base = api.replace(/\/trpc\/?$/, '').replace(/\/+$/, '')
  return `${base}/api/events`
}

function storedApiUrl(): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && /^https?:\/\/.+/i.test(v)) return v
  } catch {}
  return defaultApiUrl()
}

type ApiUrlState = {
  apiUrl: string
  setApiUrl: (url: string) => void
}

export const useApiUrlStore = create<ApiUrlState>((set) => ({
  apiUrl: defaultApiUrl(),
  setApiUrl: (url) => {
    const trimmed = url.trim().replace(/\/+$/, '')
    const next = trimmed ? `${trimmed}/trpc` : defaultApiUrl()
    try {
      if (next === defaultApiUrl()) localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {}
    set({ apiUrl: next })
  },
}))

export function initApiUrl() {
  useApiUrlStore.setState({ apiUrl: storedApiUrl() })
}
