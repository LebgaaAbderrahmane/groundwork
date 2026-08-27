import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import { initTheme } from '@/store/theme'
import { initApiUrl } from '@/store/apiUrl'
import { ensureNotificationPermission, isDesktopApp } from '@/lib/notifications'
import './index.css'
import App from './App.tsx'
import { Providers } from '@/lib/providers'

initTheme()
initApiUrl()

if (isDesktopApp()) {
  ensureNotificationPermission()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <App />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ className: 'font-sans text-sm' }}
      />
    </Providers>
  </StrictMode>,
)
