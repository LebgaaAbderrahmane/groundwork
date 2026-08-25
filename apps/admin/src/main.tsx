import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { initTheme } from '@/store/theme'
import './index.css'
import App from './App.tsx'
import { Providers } from '@/lib/providers'

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{ className: 'font-sans text-sm' }}
        />
      </BrowserRouter>
    </Providers>
  </StrictMode>,
)
