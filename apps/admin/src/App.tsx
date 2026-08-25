import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppShell from '@/components/Shell'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { MenuPage } from '@/pages/MenuPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { StaffPage } from '@/pages/StaffPage'
import { CustomersPage } from '@/pages/CustomersPage'
import { TablesPage } from '@/pages/TablesPage'
import { SettingsPage } from '@/pages/SettingsPage'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/orders', element: <OrdersPage /> },
      { path: '/menu', element: <MenuPage /> },
      { path: '/inventory', element: <InventoryPage /> },
      { path: '/staff', element: <StaffPage /> },
      { path: '/customers', element: <CustomersPage /> },
      { path: '/tables', element: <TablesPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
