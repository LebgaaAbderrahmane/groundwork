import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { MenuHighlights } from '@/components/MenuHighlights'
import { BrewMethods } from '@/components/BrewMethods'
import { OurCoffee } from '@/components/OurCoffee'
import { About } from '@/components/About'
import { Gallery } from '@/components/Gallery'
import { Events } from '@/components/Events'
import { Testimonials } from '@/components/Testimonials'
import { FindUs } from '@/components/FindUs'
import { Footer } from '@/components/Footer'
import { MenuPage } from '@/pages/MenuPage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { OrderConfirmationPage } from '@/pages/OrderConfirmationPage'
import { ReceiptPage } from '@/pages/ReceiptPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

function HomePage() {
  return (
    <>
      <Hero />
      <MenuHighlights />
      <BrewMethods />
      <OurCoffee />
      <About />
      <Gallery />
      <Events />
      <Testimonials />
      <FindUs />
    </>
  )
}

function ScrollToHash() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => {
        const el = document.getElementById(hash.slice(1))
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      })
    } else {
      window.scrollTo({ top: 0 })
    }
  }, [pathname, hash])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <ScrollToHash />
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order/:orderId" element={<OrderConfirmationPage />} />
          <Route path="/receipt/:orderId" element={<ReceiptPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
