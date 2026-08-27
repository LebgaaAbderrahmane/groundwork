import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { NavLink, Outlet, useNavigate, useBlocker } from 'react-router-dom'
import {
  Coffee,
  Home,
  LayoutList,
  LogOut,
  Users,
  Boxes,
  Settings,
  UserRound,
  Table2,
  ChevronDown,
} from 'lucide-react'
import { BRAND } from '@cribstone/shared'
import { trpc } from '@/lib/trpc'
import { useSession } from '@/store/session'
import { LoginPage } from '@/pages/LoginPage'
import { Button, ConfirmDialog } from '@/components/ui'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'
import { isUnsavedDirty, subscribeUnsaved, setUnsavedDirty } from '@/lib/unsaved'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { OfflineBanner } from '@/components/OfflineBanner'

const NAV = [
  { to: '/', label: 'Dashboard', icon: Home, end: true },
  { to: '/orders', label: 'Orders', icon: LayoutList },
  { to: '/menu', label: 'Menu', icon: Coffee },
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

  const dirty = useSyncExternalStore(subscribeUnsaved, isUnsavedDirty)

  const blocker = useBlocker(() => {
    if (!dirty) return false
    return true
  })

  const [blockerTarget, setBlockerTarget] = useState<string | null>(null)
  const confirmedRef = useRef(false)

  useEffect(() => {
    if (blocker.state === 'blocked' && !confirmedRef.current) {
      setBlockerTarget(blocker.location.pathname)
    }
  }, [blocker])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  function confirmLeave() {
    confirmedRef.current = true
    setUnsavedDirty(false)
    setBlockerTarget(null)
    if (blocker.state === 'blocked') blocker.proceed()
  }

  function cancelLeave() {
    setBlockerTarget(null)
    if (blocker.state === 'blocked') blocker.reset()
  }

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
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
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
      </aside>

      <div className="flex min-h-screen flex-1 flex-col md:pl-56">
        <MobileNav user={user} onLogout={() => logout.mutate()} />
        <TopBar user={user} onLogout={() => logout.mutate()} />
        <main id="main-content" className="flex-1 px-6 py-8 md:px-16 md:py-10">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <ConfirmDialog
        open={blockerTarget !== null}
        onClose={cancelLeave}
        onConfirm={confirmLeave}
        title="Unsaved changes"
        description="You have unsaved changes. Leave without saving?"
        confirmLabel="Leave"
      />
      <OfflineBanner />
    </div>
  )
}

function TopBar({
  user,
  onLogout,
}: {
  user: NonNullable<ReturnType<typeof useSession.getState>['user']>
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="sticky top-0 z-20 hidden border-b border-border bg-background/90 backdrop-blur md:block">
      <div className="flex h-14 items-center justify-end gap-3 px-6 md:px-16">
        <ThemeToggle />
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-accent/15 text-[10px] font-semibold text-accent">
              {initials}
            </span>
            <span className="hidden lg:inline">{user.name}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-background py-1 shadow-lg">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="border-t border-border" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  onLogout()
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-danger"
              >
                <LogOut className="size-4" aria-hidden /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
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
          <ThemeToggle />
          <span className="text-sm font-medium text-foreground">{user.name}</span>
          <Button variant="ghost" className="size-9 p-0 !px-0" onClick={onLogout}>
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
