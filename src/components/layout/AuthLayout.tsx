import { Outlet, Link, useLocation } from 'react-router-dom'
import { APP_NAME } from '@/utils/constants'

export default function AuthLayout() {
  const location = useLocation()
  const isAuth = location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,_rgba(20,184,138,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(55,138,221,0.12),_transparent_30%),var(--color-page)]">
      <header className="sticky top-0 z-20 border-b border-line bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3 font-semibold text-ink-strong">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-sm text-white shadow-sm">
              {APP_NAME}
            </span>
            <span>
              <span className="block text-sm font-semibold">Intelligent Inventory Management</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Retail operations suite</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-sm text-muted">
            <Link to="/app/products" className="rounded-full px-4 py-2 font-semibold transition-colors hover:bg-brand-soft hover:text-ink-deep">
              Browse
            </Link>
            <Link to={isAuth ? '/' : '/login'} className="rounded-full px-4 py-2 font-semibold transition-colors hover:bg-brand-soft hover:text-ink-deep">
              {isAuth ? 'Home' : 'Login'}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-card/80">
        <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted">
          © {new Date().getFullYear()} {APP_NAME}. Built for production-grade inventory operations.
        </div>
      </footer>
    </div>
  )
}
