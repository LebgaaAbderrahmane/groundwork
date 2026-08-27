import { useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc'
import { useApiUrlStore } from '@/store/apiUrl'

export function Providers({ children }: { children: React.ReactNode }) {
  const apiUrl = useApiUrlStore((s) => s.apiUrl)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            retry: (failureCount, error) => {
              if (error instanceof Error && error.message.includes('Failed to fetch')) return false
              return failureCount < 2
            },
          },
          mutations: {
            retry: false,
            onError: (error) => {
              toast.error(error.message || 'Something went wrong. Please try again.')
            },
          },
        },
      }),
  )
  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [httpBatchLink({ url: apiUrl })],
      }),
    [apiUrl],
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
