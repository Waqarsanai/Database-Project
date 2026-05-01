import * as React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

const LandingPage = React.lazy(() => import('@/pages/public/LandingPage'))
const LoginPage = React.lazy(() => import('@/pages/public/LoginPage'))
const RegisterPage = React.lazy(() => import('@/pages/public/RegisterPage'))

const AdminLayout = React.lazy(() => import('@/components/layout/AdminLayout'))
const CustomerLayout = React.lazy(() => import('@/components/layout/CustomerLayout'))
const AuthLayout = React.lazy(() => import('@/components/layout/AuthLayout'))

// Admin pages
const AdminDashboardPage = React.lazy(() => import('@/pages/admin/DashboardPage'))
const AdminProductsPage = React.lazy(() => import('@/pages/admin/ProductsPage'))
const AdminProductDetailPage = React.lazy(() => import('@/pages/admin/ProductDetailPage'))
const AdminCategoriesPage = React.lazy(() => import('@/pages/admin/CategoriesPage'))
const AdminOrdersPage = React.lazy(() => import('@/pages/admin/OrdersPage'))
const AdminOrderDetailPage = React.lazy(() => import('@/pages/admin/OrderDetailPage'))
const AdminCustomersPage = React.lazy(() => import('@/pages/admin/CustomersPage'))
const AdminCustomerDetailPage = React.lazy(() => import('@/pages/admin/CustomerDetailPage'))
const AdminAnalyticsPage = React.lazy(() => import('@/pages/admin/AnalyticsPage'))
const AdminInventoryPage = React.lazy(() => import('@/pages/admin/InventoryPage'))
const AdminAuditLogPage = React.lazy(() => import('@/pages/admin/AuditLogPage'))
const AdminAdminsPage = React.lazy(() => import('@/pages/admin/AdminsPage'))
const AdminSettingsPage = React.lazy(() => import('@/pages/admin/SettingsPage'))

// Customer pages
const CustomerDashboardPage = React.lazy(() => import('@/pages/customer/DashboardPage'))
const CustomerProductsPage = React.lazy(() => import('@/pages/customer/ProductsPage'))
const CustomerProductDetailPage = React.lazy(() => import('@/pages/customer/ProductDetailPage'))
const CartPage = React.lazy(() => import('@/pages/customer/CartPage'))
const CheckoutPage = React.lazy(() => import('@/pages/customer/CheckoutPage'))
const CustomerOrdersPage = React.lazy(() => import('@/pages/customer/OrdersPage'))
const CustomerOrderDetailPage = React.lazy(() => import('@/pages/customer/OrderDetailPage'))
const CustomerProfilePage = React.lazy(() => import('@/pages/customer/ProfilePage'))
const CheckoutSuccessPage = React.lazy(() => import('@/pages/customer/CheckoutSuccessPage'))

function SuspenseShell({ children }: { children: React.ReactNode }) {
  return <React.Suspense fallback={<div className="p-6 text-sm text-zinc-600">Loading…</div>}>{children}</React.Suspense>
}

export const router = createBrowserRouter([
  {
    element: (
      <SuspenseShell>
        <AuthLayout />
      </SuspenseShell>
    ),
    children: [
      { path: '/', element: <SuspenseShell><LandingPage /></SuspenseShell> },
      { path: '/login', element: <SuspenseShell><LoginPage /></SuspenseShell> },
      { path: '/register', element: <SuspenseShell><RegisterPage /></SuspenseShell> },
    ],
  },
  {
    element: <ProtectedRoute role="admin" />,
    children: [
      {
        path: '/admin',
        element: (
          <SuspenseShell>
            <AdminLayout />
          </SuspenseShell>
        ),
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: 'dashboard', element: <SuspenseShell><AdminDashboardPage /></SuspenseShell> },
          { path: 'products', element: <SuspenseShell><AdminProductsPage /></SuspenseShell> },
          { path: 'products/:id', element: <SuspenseShell><AdminProductDetailPage /></SuspenseShell> },
          { path: 'categories', element: <SuspenseShell><AdminCategoriesPage /></SuspenseShell> },
          { path: 'orders', element: <SuspenseShell><AdminOrdersPage /></SuspenseShell> },
          { path: 'orders/:id', element: <SuspenseShell><AdminOrderDetailPage /></SuspenseShell> },
          { path: 'customers', element: <SuspenseShell><AdminCustomersPage /></SuspenseShell> },
          { path: 'customers/:id', element: <SuspenseShell><AdminCustomerDetailPage /></SuspenseShell> },
          { path: 'analytics', element: <SuspenseShell><AdminAnalyticsPage /></SuspenseShell> },
          { path: 'inventory', element: <SuspenseShell><AdminInventoryPage /></SuspenseShell> },
          { path: 'audit-log', element: <SuspenseShell><AdminAuditLogPage /></SuspenseShell> },
          { path: 'admins', element: <SuspenseShell><AdminAdminsPage /></SuspenseShell> },
          { path: 'settings', element: <SuspenseShell><AdminSettingsPage /></SuspenseShell> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute role="customer" />,
    children: [
      {
        path: '/app',
        element: (
          <SuspenseShell>
            <CustomerLayout />
          </SuspenseShell>
        ),
        children: [
          { index: true, element: <Navigate to="/app/dashboard" replace /> },
          { path: 'dashboard', element: <SuspenseShell><CustomerDashboardPage /></SuspenseShell> },
          { path: 'products', element: <SuspenseShell><CustomerProductsPage /></SuspenseShell> },
          { path: 'products/:id', element: <SuspenseShell><CustomerProductDetailPage /></SuspenseShell> },
          { path: 'cart', element: <SuspenseShell><CartPage /></SuspenseShell> },
          { path: 'checkout', element: <SuspenseShell><CheckoutPage /></SuspenseShell> },
          { path: 'checkout/success/:id', element: <SuspenseShell><CheckoutSuccessPage /></SuspenseShell> },
          { path: 'orders', element: <SuspenseShell><CustomerOrdersPage /></SuspenseShell> },
          { path: 'orders/:id', element: <SuspenseShell><CustomerOrderDetailPage /></SuspenseShell> },
          { path: 'profile', element: <SuspenseShell><CustomerProfilePage /></SuspenseShell> },
        ],
      },
    ],
  },
])

