import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { Providers } from '@/lib/providers'
import { AuthProvider } from '@/components/AuthProvider'
import { initTheme } from '@/store/theme'

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <HelmetProvider>
        <Providers>
          <AuthProvider />
          <App />
          <Toaster
            position="bottom-center"
            richColors
            closeButton
            toastOptions={{ className: 'font-sans text-sm' }}
          />
        </Providers>
      </HelmetProvider>
    </MotionConfig>
  </StrictMode>,
)
