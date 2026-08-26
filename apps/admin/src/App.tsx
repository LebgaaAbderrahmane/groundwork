import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppShell from '@/components/Shell'
import { LoginPage } from '@/pages/LoginPage'

const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const OrdersPage = lazy(() => import('@/pages/OrdersPage'))
const MenuPage = lazy(() => import('@/pages/MenuPage'))
const InventoryPage = lazy(() => import('@/pages/InventoryPage'))
const StaffPage = lazy(() => import('@/pages/StaffPage'))
const CustomersPage = lazy(() => import('@/pages/CustomersPage'))
const TablesPage = lazy(() => import('@/pages/TablesPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))

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

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <LazyPage><DashboardPage /></LazyPage> },
      { path: '/orders', element: <LazyPage><OrdersPage /></LazyPage> },
      { path: '/menu', element: <LazyPage><MenuPage /></LazyPage> },
      { path: '/inventory', element: <LazyPage><InventoryPage /></LazyPage> },
      { path: '/staff', element: <LazyPage><StaffPage /></LazyPage> },
      { path: '/customers', element: <LazyPage><CustomersPage /></LazyPage> },
      { path: '/tables', element: <LazyPage><TablesPage /></LazyPage> },
      { path: '/settings', element: <LazyPage><SettingsPage /></LazyPage> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
