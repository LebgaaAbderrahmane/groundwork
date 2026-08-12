import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import './index.css'
import App from './App.tsx'
import { Providers } from '@/lib/providers'
import { initTheme } from '@/store/theme'

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <Providers>
        <App />
      </Providers>
    </MotionConfig>
  </StrictMode>,
)
