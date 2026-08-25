import { useCallback, useEffect, useRef, useState } from 'react'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prev = document.title
    document.title = title
    return () => { document.title = prev }
  }, [title])
}

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])

  return debounced
}

export function useInterval(callback: () => void, delayMs: number | null) {
  const savedCallback = useRef(callback)
  savedCallback.current = callback

  useEffect(() => {
    if (delayMs === null) return
    const id = setInterval(() => savedCallback.current(), delayMs)
    return () => clearInterval(id)
  }, [delayMs])
}

export function useBroadcastChannel<T>(
  channelName: string,
  onMessage: (data: T) => void,
) {
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const channelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    try {
      const channel = new BroadcastChannel(channelName)
      channelRef.current = channel
      channel.onmessage = (e) => onMessageRef.current(e.data as T)
      return () => channel.close()
    } catch {
      // BroadcastChannel not supported — silently ignore
    }
  }, [channelName])

  const post = useCallback((data: T) => {
    channelRef.current?.postMessage(data)
  }, [])

  return { post }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next = value instanceof Function ? value(prev) : value
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch {
          // quota exceeded — silently ignore
        }
        return next
      })
    },
    [key],
  )

  return [stored, setValue]
}
