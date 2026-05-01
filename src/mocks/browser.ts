import { setupWorker } from 'msw/browser'
import { handlers } from '@/mocks/handlers'
import { db } from '@/mocks/db'

let worker: ReturnType<typeof setupWorker> | null = null
let startPromise: Promise<void> | null = null

function logMockCredentials() {
  const adminUsernames = db.admins.map((admin) => admin.username).join(', ')
  const customerUsernames = db.customers.map((customer) => customer.username).join(', ')

  console.groupCollapsed('[MOCK AUTH] credentials')
  console.log(`[MOCK AUTH] admin users: ${adminUsernames}`)
  console.log('[MOCK AUTH] admin password: AdminPass123!')
  console.log(`[MOCK AUTH] customer users: ${customerUsernames}`)
  console.log('[MOCK AUTH] customer password: Password123!')
  console.table(
    db.admins.map((admin) => ({
      role: 'admin',
      username: admin.username,
      password: admin.password,
      email: admin.email,
    })),
  )
  console.table(
    db.customers.map((customer) => ({
      role: 'customer',
      username: customer.username,
      password: customer.password,
      email: customer.email,
    })),
  )
  console.groupEnd()
}

export async function initMocks() {
  if (startPromise) return startPromise
  console.log('[MSW] starting...')

  if (!worker) {
    worker = setupWorker(...handlers)
  }

  startPromise = worker
    .start({
      onUnhandledRequest: 'bypass',
      quiet: true,
    })
    .then(() => {
      console.log('[MSW] ready')
      console.log('[MSW] seed counts', {
        products: db.products.length,
        categories: db.categories.length,
        customers: db.customers.length,
        orders: db.orders.length,
        orderItems: db.orderItems.length,
        admins: db.admins.length,
        audit: db.audit.length,
      })
      logMockCredentials()
    })
    .catch((error) => {
      startPromise = null
      console.error('[MSW] failed to start', error)
      throw error
    })

  await startPromise
}
