import { useCallback, useEffect, useRef } from 'react'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prev = document.title
    document.title = title
    return () => { document.title = prev }
  }, [title])
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
