import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { OfflineBanner } from '@/components/OfflineBanner'

const HomePage = lazy(() => import('@/pages/HomePage'))
const MenuPage = lazy(() => import('@/pages/MenuPage'))
const CartPage = lazy(() => import('@/pages/CartPage'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'))
const OrderConfirmationPage = lazy(() => import('@/pages/OrderConfirmationPage'))
const ReceiptPage = lazy(() => import('@/pages/ReceiptPage'))
const OurCoffeePage = lazy(() => import('@/pages/OurCoffeePage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const FindUsPage = lazy(() => import('@/pages/FindUsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const TableLandingPage = lazy(() => import('@/pages/TableLandingPage'))

function PageLoader() {
  return (
    <div className="flex min-h-[50svh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="size-8 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Loading
        </p>
      </div>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <ScrollToTop />
        <Navbar />
        <Suspense fallback={<PageLoader />}>
          <ErrorBoundary>
            <div id="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order/:orderId" element={<OrderConfirmationPage />} />
                <Route path="/receipt/:orderId" element={<ReceiptPage />} />
                <Route path="/our-coffee" element={<OurCoffeePage />} />
                <Route path="/about" element={<AboutPage />} />
              <Route path="/find-us" element={<FindUsPage />} />
              <Route path="/order/table/:token" element={<TableLandingPage />} />
              <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
          </ErrorBoundary>
        </Suspense>
        <Footer />
        <OfflineBanner />
      </div>
    </BrowserRouter>
  )
}

export default App
