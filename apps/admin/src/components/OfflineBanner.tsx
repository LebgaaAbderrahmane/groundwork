import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const onOnline = () => setOffline(false)
    const onOffline = () => setOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="alert"
      className="fixed inset-x-0 bottom-0 z-[70] flex items-center justify-center gap-2 bg-accent/95 px-4 py-3 text-sm font-medium text-white backdrop-blur"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden />
      You are offline — some features may be unavailable
    </div>
  )
}
