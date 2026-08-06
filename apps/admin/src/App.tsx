import { Route, Routes } from 'react-router-dom'
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

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/tables" element={<TablesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
