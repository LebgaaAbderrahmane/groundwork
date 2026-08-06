import { router } from '../trpc'
import { authRouter } from './auth'
import { menuRouter } from './menu'
import { ordersRouter } from './orders'
import { inventoryRouter } from './inventory'
import { staffRouter } from './staff'
import { customersRouter } from './customers'
import { analyticsRouter } from './analytics'
import { tablesRouter } from './tables'
import { settingsRouter } from './settings'

export const appRouter = router({
  auth: authRouter,
  menu: menuRouter,
  orders: ordersRouter,
  inventory: inventoryRouter,
  staff: staffRouter,
  customers: customersRouter,
  analytics: analyticsRouter,
  tables: tablesRouter,
  settings: settingsRouter,
})

export type AppRouter = typeof appRouter
