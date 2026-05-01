import { Link, NavLink, Outlet } from 'react-router-dom'
import { LogOut, ShoppingCart, User } from 'lucide-react'
import { authStore } from '@/store/authStore'
import { cartStore } from '@/store/cartStore'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function CustomerLayout() {
  const user = authStore((s) => s.user)
  const logout = authStore((s) => s.logout)
  const totalItems = cartStore((s) => s.totalItems)

  return (
    <div className="min-h-dvh bg-page">
      <header className="sticky top-0 z-20 border-b border-line bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/app/dashboard" className="flex items-center gap-3 font-semibold text-ink-strong">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-sm text-white shadow-sm">
              IIMS
            </span>
            <span>
              <span className="block text-sm font-semibold">Store</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Customer portal</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 rounded-full border border-line bg-page p-1 text-sm text-muted md:flex">
            <NavLink to="/app/dashboard" className={({ isActive }) => cn('rounded-full px-4 py-2 text-[13px] font-semibold transition-colors', isActive ? 'bg-brand-tint text-brand-hover' : 'hover:bg-brand-soft hover:text-ink-deep')}>
              Home
            </NavLink>
            <NavLink to="/app/products" className={({ isActive }) => cn('rounded-full px-4 py-2 text-[13px] font-semibold transition-colors', isActive ? 'bg-brand-tint text-brand-hover' : 'hover:bg-brand-soft hover:text-ink-deep')}>
              Products
            </NavLink>
            <NavLink to="/app/orders" className={({ isActive }) => cn('rounded-full px-4 py-2 text-[13px] font-semibold transition-colors', isActive ? 'bg-brand-tint text-brand-hover' : 'hover:bg-brand-soft hover:text-ink-deep')}>
              Orders
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" aria-label="Cart" className="relative">
              <Link to="/app/cart" className="relative">
                <ShoppingCart />
                {totalItems() > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
                    {totalItems()}
                  </span>
                )}
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="h-10 gap-2 rounded-full px-2 pr-4" aria-label="Account menu">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-tint text-[11px] font-semibold text-blue">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </span>
                  <span className="hidden text-left sm:inline">
                    <span className="block text-sm font-semibold text-ink-strong">{user?.firstName}</span>
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Customer</span>
                  </span>
                  <User className="h-4 w-4 text-muted sm:hidden" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.firstName} {user?.lastName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/app/profile">Profile</Link>
                </DropdownMenuItem>
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

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
