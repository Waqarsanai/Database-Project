import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, Boxes, ChartLine, ClipboardList, LogOut, Package, Settings, Shield, Users } from 'lucide-react'
import { uiStore } from '@/store/uiStore'
import { authStore } from '@/store/authStore'
import { cn } from '@/utils/cn'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const nav = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: ChartLine },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Boxes },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/analytics', label: 'Analytics', icon: ChartLine },
  { to: '/admin/inventory', label: 'Inventory', icon: Package },
  { to: '/admin/audit-log', label: 'Audit Log', icon: Shield },
  { to: '/admin/admins', label: 'Admins', icon: Users },
]

export default function AdminLayout() {
  const sidebarOpen = uiStore((s) => s.sidebarOpen)
  const toggleSidebar = uiStore((s) => s.toggleSidebar)
  const { pathname } = useLocation()
  const user = authStore((s) => s.user)
  const logout = authStore((s) => s.logout)
  const breadcrumb = pathname
    .split('/')
    .filter(Boolean)
    .map((part) => part.replaceAll('-', ' '))
    .join(' / ')

  return (
    <div className="min-h-dvh bg-page text-ink">
      <div className="flex">
        <aside
          className={cn(
            'sticky top-0 hidden h-dvh shrink-0 border-r border-line bg-card lg:block',
            sidebarOpen ? 'w-64' : 'w-[72px]',
          )}
        >
          <div className="flex h-16 items-center justify-between px-4">
            <Link to="/admin/dashboard" className="flex items-center gap-3 font-semibold text-ink-strong">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-[10px] text-white shadow-sm">
                IIMS
              </span>
              {sidebarOpen && (
                <span>
                  <span className="block text-sm font-semibold">Admin</span>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Control center</span>
                </span>
              )}
            </Link>
            <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle sidebar">
              <Boxes />
            </Button>
          </div>
          <div className="flex h-[calc(100dvh-4rem)] flex-col justify-between px-3 pb-4">
            <div>
              {sidebarOpen && <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Operations</div>}
              <nav className="space-y-1">
                {nav.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-[12px] text-muted transition-all hover:bg-brand-soft hover:text-ink-deep',
                        isActive ? 'border-brand bg-brand-tint font-medium text-brand-hover' : '',
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {sidebarOpen && <span>{label}</span>}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="border-t border-line pt-4">
              {sidebarOpen && <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Preferences</div>}
              <NavLink
                to="/admin/settings"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-[12px] text-muted transition-all hover:bg-brand-soft hover:text-ink-deep',
                    isActive ? 'border-brand bg-brand-tint font-medium text-brand-hover' : '',
                  )
                }
              >
                <Settings className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>Settings</span>}
              </NavLink>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-line bg-card/90 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-5">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Admin workspace</div>
                <div className="truncate text-sm font-medium text-ink-strong">{breadcrumb || 'dashboard'}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-soft" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="h-10 gap-3 rounded-full px-2 pr-4">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-tint text-[11px] font-semibold text-brand-hover">
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                      </span>
                      <span className="hidden text-left sm:inline">
                        <span className="block text-sm font-semibold text-ink-strong">{user?.firstName} {user?.lastName}</span>
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Administrator</span>
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => logout()}>
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-[1400px] p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
