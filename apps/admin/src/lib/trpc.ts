import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@cribstone/api'

export const trpc = createTRPCReact<AppRouter>()
