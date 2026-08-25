import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Coffee,
  Home,
  LayoutList,
  LogOut,
  Users,
  Boxes,
  Settings,
  Menu as MenuIcon,
  UserRound,
  Table2,
} from 'lucide-react'
import { BRAND } from '@cribstone/shared'
import { trpc } from '@/lib/trpc'
import { useSession } from '@/store/session'
import { LoginPage } from '@/pages/LoginPage'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: 'Dashboard', icon: Home, end: true },
  { to: '/orders', label: 'Orders', icon: LayoutList },
  { to: '/menu', label: 'Menu', icon: MenuIcon },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/customers', label: 'Customers', icon: UserRound },
  { to: '/tables', label: 'Tables', icon: Table2 },
  { to: '/staff', label: 'Staff', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function Layout() {
  const user = useSession((s) => s.user)
  const setUser = useSession((s) => s.setUser)
  const navigate = useNavigate()
  const utils = trpc.useUtils()

  const me = trpc.auth.me.useQuery(undefined, { retry: false })

  useEffect(() => {
    if (me.data?.user) setUser(me.data.user)
    if (me.isError) setUser(null)
  }, [me.data, me.isError, setUser])

  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      setUser(null)
      await utils.invalidate()
      navigate('/login')
    },
  })

  if (me.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Coffee className="size-8 animate-pulse text-accent" strokeWidth={1.6} />
      </main>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-background md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <Coffee className="size-5 text-accent" strokeWidth={1.8} />
          <span className="font-display text-xl italic text-foreground">
            {BRAND.shortName}
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-surface font-medium text-primary'
                    : 'text-muted-foreground hover:bg-surface hover:text-foreground',
                )
              }
            >
              <item.icon className="size-4" strokeWidth={1.7} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border px-4 py-4">
          <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <Button
            variant="ghost"
            className="mt-3 w-full justify-start px-3 text-muted-foreground hover:text-red-700"
            onClick={() => logout.mutate()}
          >
            <LogOut className="size-4" aria-hidden /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col md:pl-56">
        <MobileNav user={user} onLogout={() => logout.mutate()} />
        <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function MobileNav({
  user,
  onLogout,
}: {
  user: NonNullable<ReturnType<typeof useSession.getState>['user']>
  onLogout: () => void
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur md:hidden">
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          <Coffee className="size-5 text-accent" strokeWidth={1.8} />
          <span className="font-display text-lg italic text-foreground">
            {BRAND.shortName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{user.name}</span>
          <Button variant="ghost" className="size-9 p-0" onClick={onLogout}>
            <LogOut className="size-4" aria-label="Sign out" />
          </Button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors',
                isActive
                  ? 'bg-surface font-medium text-primary'
                  : 'text-muted-foreground',
              )
            }
          >
            <item.icon className="size-4" strokeWidth={1.7} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

export default function AppShell() {
  return <Layout />
}
